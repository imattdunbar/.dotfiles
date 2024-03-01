package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
)

func main() {
	backup := flag.Bool("backup", false, "Perform backup operation")
	restore := flag.Bool("restore", false, "Perform restore operation")
	flag.Parse()

	if !*backup && !*restore {
		fmt.Println("Use -backup or -restore.")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("No home directory")
	}

	ensureDirectories(homeDir)

	moveKeybinds(homeDir, *backup)
	moveTheme(homeDir, *backup)

	if *backup {
		println("Xcode settings backed up")
	} else {
		println("Xcode settings restored")
	}

}

func moveKeybinds(homeDir string, backup bool) {
	src := filepath.Join(homeDir, "Library/Developer/Xcode/UserData/KeyBindings/Default.idekeybindings")
	dest := filepath.Join(homeDir, ".config/xcode/Default.idekeybindings")

	// Flip them if it's restore
	if !backup {
		temp := src
		src = dest
		dest = temp
	}

	deleteExistingFile(dest)
	moveFile(src, dest)
}

func moveTheme(homeDir string, backup bool) {
	src := filepath.Join(homeDir, "Library/Developer/Xcode/UserData/FontAndColorThemes/Dunbar.xccolortheme")
	dest := filepath.Join(homeDir, ".config/xcode/Dunbar.xccolortheme")

	// Flip them if it's restore
	if !backup {
		temp := src
		src = dest
		dest = temp
	}

	deleteExistingFile(dest)
	moveFile(src, dest)
}

func deleteExistingFile(path string) {
	if _, err := os.Stat(path); err == nil {
		err := os.Remove(path)
		if err != nil {
			log.Fatalf("Error removing existing file %v: %v", path, err)
		}
	}
}

func ensureDirectories(homeDir string) {

	kb := filepath.Join(homeDir, "Library/Developer/Xcode/UserData/KeyBindings")
	th := filepath.Join(homeDir, "Library/Developer/Xcode/UserData/FontAndColorThemes")

	// Ensure both directories exist
	err := os.MkdirAll(kb, os.ModePerm)
	if err != nil {
		log.Fatalf("Error ensuring directory: %v", err)
	}

	err = os.MkdirAll(th, os.ModePerm)
	if err != nil {
		log.Fatalf("Error ensuring directory: %v", err)
	}

}

func moveFile(src string, dest string) {

	// Open the source file
	sourceFile, err := os.Open(src)
	if err != nil {
		log.Fatalf("Error moving file: %v", err)
	}
	defer sourceFile.Close()

	// Create the destination file
	destinationFile, err := os.Create(dest)
	if err != nil {
		log.Fatalf("Error moving file: %v", err)
	}
	defer destinationFile.Close()

	// Copy the source file to the destination file
	_, err = io.Copy(destinationFile, sourceFile)
	if err != nil {
		log.Fatalf("Error moving file: %v", err)
	}

	// Ensure that any writes to the destination file are committed
	err = destinationFile.Sync()
	if err != nil {
		log.Fatalf("Error moving file: %v", err)
	}
}
