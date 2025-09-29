#!/bin/bash
# Script to handle private packages installation on Vercel

# Configure git to use token for GitHub packages
if [ -n "$GITHUB_PACKAGES_TOKEN" ]; then
  git config --global url."https://${GITHUB_PACKAGES_TOKEN}@github.com/".insteadOf "https://github.com/"
  git config --global url."https://${GITHUB_PACKAGES_TOKEN}@github.com/".insteadOf "git@github.com:"
  git config --global url."https://${GITHUB_PACKAGES_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
fi

# Export Motion Plus token if provided
if [ -n "$MOTION_PLUS_TOKEN" ]; then
  export MOTION_PLUS_TOKEN=$MOTION_PLUS_TOKEN
fi

# Run npm install
npm install