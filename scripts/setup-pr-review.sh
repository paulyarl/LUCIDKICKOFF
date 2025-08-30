#!/bin/bash

# Install required npm packages
echo "Installing PR review dependencies..."
npm install --save-dev @types/commander commander eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks postcss postcss-js

# Make the PR review script executable
chmod +x scripts/pr-review.js

echo "✅ PR review tool setup complete!"
echo "You can now run the following commands:"
echo "  npm run review:pr       # Run PR review"
echo "  npm run review:pr:fix   # Run PR review with auto-fix"

# Add a pre-commit hook if git is initialized
if [ -d ".git" ]; then
  echo "Setting up pre-commit hook..."
  cat > .git/hooks/pre-commit << 'EOL'
#!/bin/sh

# Run PR review before commit
echo "Running PR review..."
npm run review:pr
EOL
  
  chmod +x .git/hooks/pre-commit
  echo "✅ Pre-commit hook installed"
fi
