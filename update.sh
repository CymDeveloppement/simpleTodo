#!/usr/bin/env bash

set -euo pipefail

# Always run from the script's directory (project root for Lumen app)
cd "$(dirname "$0")"

echo "=== SimpleTodo Update ==="
echo "Directory: $(pwd)"

# Optional: force remote state if conflicts occur
FORCE_REMOTE=0
if [[ "${1:-}" == "--force" ]] || [[ "${FORCE_REMOTE:-0}" == "1" ]]; then
  FORCE_REMOTE=1
fi

# Avoid interactive prompts from git
export GIT_TERMINAL_PROMPT=0

# Silence whitespace warnings during patch application
git config apply.whitespace nowarn || true

ensure_tracking_branch() {
  local current_branch upstream
  current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

  if [[ -z "$current_branch" || "$current_branch" == "HEAD" ]]; then
    return 0
  fi

  if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
    return 0
  fi

  if git remote get-url origin >/dev/null 2>&1; then
    if git ls-remote --exit-code --heads origin "$current_branch" >/dev/null 2>&1; then
      echo "Setting upstream for ${current_branch} to origin/${current_branch}..."
      git branch --set-upstream-to="origin/${current_branch}" "${current_branch}" || true
      return 0
    fi

    if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
      echo "Setting upstream for ${current_branch} to origin/main..."
      git branch --set-upstream-to="origin/main" "${current_branch}" || true
      return 0
    fi
  fi
}

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
  ensure_tracking_branch
  if ! git pull --rebase; then
    echo "git pull --rebase failed. Checking for merge conflicts..."
    if git ls-files -u | grep -q ""; then
      echo "Unmerged files detected."
      if [[ "$FORCE_REMOTE" == "1" ]]; then
        echo "FORCE mode: resetting hard to origin/main"
        git fetch origin || true
        git reset --hard origin/main
      else
        echo "Aborting update due to conflicts. Re-run with --force to overwrite local changes."
        exit 2
      fi
    else
      echo "No unmerged files, but pull failed. Aborting."
      exit 2
    fi
  fi
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
    if ! git pull --rebase origin main; then
      echo "Rebase failed while aligning with origin/main."
      if [[ "$FORCE_REMOTE" == "1" ]]; then
        echo "FORCE mode: resetting hard to origin/main"
        git reset --hard origin/main
      else
        echo "Aborting update due to conflicts. Re-run with --force to overwrite local changes."
        exit 2
      fi
    fi
  else
    echo "Remote 'origin' has no 'main' branch yet. Staying on local main."
  fi
  # Pull latest if tracking is set
  if ! git pull --rebase origin main; then
    echo "Final pull failed."
    if [[ "$FORCE_REMOTE" == "1" ]]; then
      echo "FORCE mode: resetting hard to origin/main"
      git reset --hard origin/main
    else
      echo "Aborting update due to conflicts. Re-run with --force to overwrite local changes."
      exit 2
    fi
  fi
fi

# 3) Run database migrations (non-interactive)
echo "Running database migrations..."
if command -v php >/dev/null 2>&1; then
  php artisan migrate --force
else
  echo "php command not found. Skipping migrations."
fi

echo "✅ Update completed successfully."


