#!/usr/bin/env bash

set -euo pipefail

# Always run from the script's directory (project root for Lumen app)
cd "$(dirname "$0")"

echo "=== SimpleTodo Update ==="
echo "Directory: $(pwd)"

# 1) Git steps (only if in a git repository)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Stash local changes if any (including untracked)
  if git diff --quiet && git diff --cached --quiet; then
    echo "No local changes to stash."
  else
    echo "Stashing local changes..."
    git stash push -u -m "auto-update $(date +%Y-%m-%d_%H-%M-%S)" || true
  fi

  # Pull latest changes
  echo "Pulling latest changes..."
  git pull --rebase
else
  echo "Not a git repository. Initializing..."
  git init
  # Ensure default branch is main
  if git symbolic-ref -q HEAD >/dev/null 2>&1; then
    : # HEAD already set
  else
    git checkout -b main || git symbolic-ref HEAD refs/heads/main || true
  fi
  # Commit current working tree to preserve files
  echo "Creating initial commit of current working tree..."
  git add -A || true
  if git diff --cached --quiet; then
    echo "Nothing to commit in initial commit."
  else
    git commit -m "chore: initialize working tree" || true
  fi
  # Configure remote origin
  if git remote get-url origin >/dev/null 2>&1; then
    echo "Remote 'origin' already configured."
  else
    git remote add origin "https://github.com/CymDeveloppement/simpleTodo.git"
  fi
  echo "Fetching from origin..."
  git fetch origin || true
  # Track main branch if it exists remotely
  if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
    echo "Setting local main to track origin/main..."
    git branch --set-upstream-to=origin/main main || true
    echo "Rebasing local commits onto origin/main..."
    git pull --rebase origin main || true
  else
    echo "Remote 'origin' has no 'main' branch yet. Staying on local main."
  fi
  # Pull latest if tracking is set
  git pull --rebase origin main || true
fi

# 3) Run database migrations (non-interactive)
echo "Running database migrations..."
php artisan migrate --force

echo "✅ Update completed successfully."


