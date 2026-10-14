/*
 * Adapted from TheStreamCode/opencode-muse-auth and its V2 PR #8.
 * MIT License — Copyright (c) 2026 TheStreamCode
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { setTimeout as sleep } from 'node:timers/promises'
import { Credential, Integration, Plugin } from '@opencode/plugin'
import { z } from 'zod'

const clientID = '1031625952748946'
const methodID = Integration.MethodID.make('muse-code-subscription')
const headers = { Accept: 'application/json', 'x-api-version': '1.0.0' }
const timeout = 25_000

const deviceSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.url(),
  verification_uri_complete: z.url().optional(),
  interval: z.number().finite().nonnegative(),
  expires_in: z.number().finite().positive()
})

const tokenSchema = z.object({
  access_token: z.string().min(1).optional(),
  error: z.string().optional()
})

const keySchema = z.object({
  api_key: z.string().trim().min(1).optional(),
  is_subs_active: z.boolean().optional(),
  require_payment: z.boolean().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  user_email: z.string().optional()
})

async function postForm(url: string, params: Record<string, string>, requestTimeout = timeout) {
  return fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(requestTimeout)
  })
}

async function completeLogin(device: z.infer<typeof deviceSchema>, deadline: number): Promise<Credential.OAuth> {
  let interval = Math.max(1, device.interval) * 1000

  while (Date.now() < deadline) {
    // Respect Meta's poll interval before the first request and each retry.
    await sleep(Math.min(interval, deadline - Date.now()))
    const remaining = deadline - Date.now()
    if (remaining <= 0) break

    const response = await postForm(
      'https://auth.meta.com/oidc/device/token/',
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: clientID,
        device_code: device.device_code
      },
      Math.max(1, Math.min(timeout, remaining))
    )
    const token = tokenSchema.parse(await response.json())

    // OAuth pending/slow-down replies use HTTP error statuses during normal login.
    if (token.error === 'authorization_pending') continue
    if (token.error === 'slow_down') {
      interval += 5000
      continue
    }
    if (token.error === 'access_denied') throw new Error('Meta login was denied')
    if (token.error === 'expired_token') throw new Error('Meta device code expired; run /connect again')
    if (!response.ok || token.error || !token.access_token) {
      throw new Error(`Meta token exchange failed (HTTP ${response.status})`)
    }

    const exchange = await fetch('https://api.meta.ai/muse-code/key', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.access_token}`
      },
      body: JSON.stringify({ onboard: true }),
      signal: AbortSignal.timeout(timeout)
    })
    // Do not include response bodies in errors: they can contain credentials.
    if (!exchange.ok) throw new Error(`Muse key exchange failed (HTTP ${exchange.status})`)
    const key = keySchema.parse(await exchange.json())
    if (key.is_subs_active === false || key.require_payment === true) {
      throw new Error('An active Muse Code subscription is required')
    }
    if (!key.api_key) throw new Error('Meta did not return a Muse subscription key')

    // Persist only the inference key; the temporary Meta OAuth token stays in memory.
    return {
      type: 'oauth',
      methodID,
      access: key.api_key,
      refresh: '',
      expires: Number.MAX_SAFE_INTEGER,
      metadata: { accountId: key.user_id, email: key.user_email }
    }
  }

  throw new Error('Meta login timed out; run /connect again')
}

export default {
  id: 'custom.oc-muse',

  async setup(ctx) {
    await ctx.integration.transform((editor) => {
      editor.method.update({
        integrationID: 'meta',
        method: {
          id: methodID,
          type: 'oauth',
          label: 'Muse Code subscription (Meta device login)'
        },
        async authorize() {
          const response = await postForm('https://auth.meta.com/oidc/device/authorization/', {
            client_id: clientID
          })
          if (!response.ok) throw new Error(`Meta device login failed (HTTP ${response.status})`)
          const device = deviceSchema.parse(await response.json())
          const expiresAt = Date.now() + device.expires_in * 1000
          const callback = completeLogin(device, expiresAt)
          // OpenCode consumes the original promise after it displays the device code.
          // Handle early rejection without altering that promise or its error.
          void callback.catch(() => undefined)

          return {
            url: device.verification_uri_complete ?? device.verification_uri,
            instructions: `Open the Meta URL and enter code: ${device.user_code}`,
            mode: 'auto',
            expiresAt,
            callback
          }
        },
        label: (credential) =>
          typeof credential.metadata?.email === 'string' ? credential.metadata.email : 'Muse Code subscription'
      })
    })

    await ctx.session.hook(
      'http.request',
      async (event) => {
        const connection = await ctx.integration.connection.active('meta')
        if (!connection) return
        const credential = await ctx.integration.connection.resolve(connection)
        if (credential?.type !== 'oauth' || credential.methodID !== methodID) return

        // Keep the subscription key on Meta's API origin, even with a custom provider URL.
        if (new URL(event.request.url).origin !== 'https://api.meta.ai') return
        event.request.headers.set('Authorization', `Bearer ${credential.access}`)
      },
      { providerID: 'meta' }
    )
  }
} satisfies Plugin.Plugin
