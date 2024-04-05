package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

var configPath = ".git/config"
var urlPath = ".git/url"
var gitDir = ".git"

func main() {

	if !fileExists(gitDir) {
		fmt.Println("Not a git repo")
		return
	}

	setURL := flag.String("set-url", "", "Set the repo URL manually")
	clearURL := flag.Bool("clear-url", false, "Clear the set URL")
	compare := flag.Bool("compare", false, "Append compare to open compare branch UI")
	print := flag.Bool("print", false, "Log the URL")
	flag.Parse()

	if *clearURL {
		os.Remove(urlPath)
		return
	}

	if setURL != nil && *setURL != "" {
		err := os.WriteFile(urlPath, []byte(*setURL), 0644)
		if err != nil {
			log.Fatalf("Could not set url: %f", err)
		}
		return
	}

	if fileExists(urlPath) {
		content, err := os.ReadFile(urlPath)
		if err != nil {
			log.Fatalf("Failed to get url from file: %v", err)
		}

		url := string(content)
		if url != "" {
			OpenURL(url)
			return
		}
	}

	origin, err := getRemoteOriginURL(configPath)
	if err != nil {
		log.Fatalf("Could not get origin url: %v", err)
	}

	isSSH := strings.Contains(origin, "git@")
	isGithubSSH := strings.Contains(origin, "git@github")
	isBBSSH := strings.Contains(origin, "git@bitbucket")

	urlToOpen := ""

	if !isSSH {
		urlToOpen = origin
		OpenURL(origin)
		return
	}

	if isGithubSSH {
		urlToOpen = urlFromGithubSSH(origin)
	}

	if isBBSSH {
		urlToOpen = urlFromBBSSH(origin)
	}

	if urlToOpen != "" {

		if *compare {
			urlToOpen = urlToOpen + "/compare"
		}

		if *print {
			fmt.Printf("Current URL: %v\n", urlToOpen)
			return
		}

		OpenURL(urlToOpen)
		return
	}

	fmt.Println("URL not recognized, use set-url")
}

func fileExists(filePath string) bool {
	_, err := os.Stat(filePath)

	if err != nil && os.IsNotExist(err) {
		return false
	}

	return true
}

func urlFromGithubSSH(sshURL string) string {
	// Remove the "git@" prefix and ".git" suffix
	prefixRemoved := strings.TrimPrefix(sshURL, "git@")
	suffixRemoved := strings.TrimSuffix(prefixRemoved, ".git")

	// Replace the ":" after "github.com" with "/"
	httpsURL := strings.Replace(suffixRemoved, ":", "/", 1)

	return "https://" + httpsURL
}

func urlFromBBSSH(sshURL string) string {
	parsedURL, err := url.Parse(sshURL)
	if err != nil {
		return ""
	}

	// Split to make sure there's no port attached to the host
	parts := strings.Split(parsedURL.Host, ":")
	host := parts[0]

	pathParts := strings.Split(parsedURL.Path, "/")
	var finalPath = ""
	count := len(pathParts)
	for i, part := range pathParts {
		if part == "" {
			continue
		}

		if i == count-1 {
			finalPath += "/repos"
		}
		finalPath = fmt.Sprintf("%v/%v", finalPath, part)

	}

	httpsURL := "https://" + host + "/projects" + strings.TrimSuffix(finalPath, ".git")
	return httpsURL
}

func getRemoteOriginURL(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var isOriginSection bool
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "[remote \"origin\"]") {
			isOriginSection = true
			continue
		}
		if isOriginSection && strings.Contains(line, "url =") {
			parts := strings.Split(line, "=")
			if len(parts) == 2 {
				return strings.TrimSpace(parts[1]), nil
			}
		} else if isOriginSection && strings.HasPrefix(line, "[") {
			break
		}
	}

	if err := scanner.Err(); err != nil {
		return "", err
	}

	return "", fmt.Errorf("URL not found")
}

func OpenURL(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	default:
		return fmt.Errorf("unsupported platform")
	}

	return exec.Command(cmd, args...).Start()
}
