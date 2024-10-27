#!/bin/bash

# Check if this is the first run
if [ ! -d ".git" ]; then
  # Initialize git repo and add remote if not already a git repository
  git init
  git remote add origin https://github.com/Cyteon/the-watcher.git
  git fetch origin main
  git checkout -b main origin/main
  # Install initial dependencies
  npm install
else
  # Remove untracked files (e.g., package-lock.json) to prevent conflicts
  ls
  git fetch origin
  git reset --hard origin/main
  if ! git diff --quiet origin/main; then
    echo "Updates found. Pulling changes..."
    git pull origin main           # Pull latest changes
    npm install                     # Install any new dependencies
  else
    echo "No updates found."
  fi
fi

if [ ! -f "config.yaml" ]; then
  echo "Config file missing. Copying default config.yaml.example to config.yaml."
  cp config.yaml.example config.yaml
fi

# Start the main script
echo "Starting prod.js..."
node prod.js
