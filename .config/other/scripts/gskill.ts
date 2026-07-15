#!/usr/bin/env bun

// @ts-nocheck

import { cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type SkillSource = {
  source: string;
  skill?: string;
};

const usage = () => {
  console.error("Usage: gskill <skill-url>");
  console.error(
    "Example: gskill https://www.skills.sh/site/docs.restate.dev/restatedev",
  );
};

const parseSkillSource = (input: string): SkillSource => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { source: input };
  }

  const isSkillsSh =
    url.hostname === "skills.sh" || url.hostname === "www.skills.sh";

  if (!isSkillsSh) {
    return { source: input };
  }

  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));

  if (parts[0] === "site" && parts.length >= 3) {
    return {
      source: `https://${parts[1]}`,
      skill: parts[2],
    };
  }

  if (parts.length >= 3) {
    return {
      source: `${parts[0]}/${parts[1]}`,
      skill: parts[2],
    };
  }

  throw new Error(`Expected a skills.sh skill page URL, received: ${input}`);
};

const installSkill = async () => {
  const input = process.argv[2];

  if (!input || process.argv.length > 3) {
    usage();
    process.exit(1);
  }

  const projectDirectory = process.cwd();
  const projectSkillsDirectory = join(projectDirectory, ".agents", "skills");
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "gskill-"));

  try {
    const { source, skill } = parseSkillSource(input);
    const command = [
      "bunx",
      "skills",
      "add",
      source,
      "--agent",
      "opencode",
      "--copy",
      "--yes",
    ];

    if (skill) {
      command.push("--skill", skill);
    }

    const processResult = Bun.spawn(command, {
      cwd: temporaryDirectory,
      env: {
        ...process.env,
        DISABLE_TELEMETRY: "1",
      },
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await processResult.exited;

    if (exitCode !== 0) {
      process.exit(exitCode);
    }

    const temporarySkillsDirectory = join(
      temporaryDirectory,
      ".agents",
      "skills",
    );
    const entries = await readdir(temporarySkillsDirectory, {
      withFileTypes: true,
    });
    const skillDirectories = entries.filter((entry) => entry.isDirectory());

    if (skillDirectories.length === 0) {
      throw new Error("The skills CLI completed without installing a skill.");
    }

    await mkdir(projectSkillsDirectory, { recursive: true });

    for (const entry of skillDirectories) {
      const sourceDirectory = join(temporarySkillsDirectory, entry.name);
      const destinationDirectory = join(projectSkillsDirectory, entry.name);

      await rm(destinationDirectory, { recursive: true, force: true });
      await cp(sourceDirectory, destinationDirectory, {
        recursive: true,
        dereference: true,
      });

      console.log(`Installed ${entry.name} into ${destinationDirectory}`);
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
};

try {
  await installSkill();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`gskill: ${message}`);
  process.exit(1);
}
