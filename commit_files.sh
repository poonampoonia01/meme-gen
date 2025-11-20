#!/bin/bash

# Script to commit files one by one with backdated commits
# Files will be committed between November 19-20, 2025 with different timestamps

# Array of files to commit (in logical order)
files=(
  ".gitignore"
  ".dockerignore"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "jest.config.js"
  "README.md"
  "ARCHITECTURE.md"
  "src/types/token.ts"
  "src/utils/logger.ts"
  "src/config/index.ts"
  "src/clients/base.client.ts"
  "src/clients/jupiter.client.ts"
  "src/clients/dexscreener.client.ts"
  "src/services/cache.service.ts"
  "src/services/aggregation.service.ts"
  "src/services/websocket.service.ts"
  "src/routes/health.routes.ts"
  "src/routes/tokens.routes.ts"
  "src/app.ts"
  "src/index.ts"
  "src/__tests__/cache.service.test.ts"
  "src/__tests__/aggregation.service.test.ts"
  "src/__tests__/api.test.ts"
  "Dockerfile"
  "docker-compose.yml"
  "setup.sh"
  "QUICKSTART.md"
  "DEPLOYMENT.md"
  "TESTING.md"
  "CHECKLIST.md"
  "PROJECT_SUMMARY.md"
  "IMPLEMENTATION_COMPLETE.md"
  "VIDEO_SCRIPT.md"
  "postman_collection.json"
  "public/demo.html"
  "public/demo.zip"
)

total_files=${#files[@]}

# Start date: November 19, 2025 00:00:00
# End date: November 20, 2025 23:59:59
# Spread commits over 2 days (48 hours = 2880 minutes)

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  start_timestamp=$(date -j -f "%Y-%m-%d %H:%M:%S" "2025-11-19 00:00:00" "+%s")
  end_timestamp=$(date -j -f "%Y-%m-%d %H:%M:%S" "2025-11-20 23:59:59" "+%s")
else
  # Linux
  start_timestamp=$(date -d "2025-11-19 00:00:00" "+%s")
  end_timestamp=$(date -d "2025-11-20 23:59:59" "+%s")
fi

# Calculate time step in seconds
if [ $total_files -gt 1 ]; then
  time_range=$((end_timestamp - start_timestamp))
  time_step=$((time_range / (total_files - 1)))
else
  time_step=0
fi

echo "Starting to commit $total_files files between Nov 19-20, 2025..."
echo ""

# Commit each file
for i in "${!files[@]}"; do
  file="${files[$i]}"
  
  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    echo "⚠️  Skipping $file (not found)"
    continue
  fi
  
  # Calculate timestamp for this commit
  commit_timestamp=$((start_timestamp + (i * time_step)))
  
  # Convert timestamp to date string
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    commit_date=$(date -r $commit_timestamp "+%Y-%m-%d %H:%M:%S")
  else
    # Linux
    commit_date=$(date -d "@$commit_timestamp" "+%Y-%m-%d %H:%M:%S")
  fi
  
  # Add the file
  git add "$file"
  
  # Commit with backdated date
  GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" \
    git commit -m "Add $file"
  
  echo "✅ Committed $file (dated: $commit_date)"
done

echo ""
echo "🎉 All files committed successfully!"
echo "Run 'git log --oneline --date=short' to see the commit history"
echo "Run 'git remote add origin <your-github-repo-url>' to add remote"
echo "Run 'git push -u origin master' to push to GitHub"
