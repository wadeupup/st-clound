#!/usr/bin/env node

/**
 * Setup Git Hooks for Prowler UI
 *
 * This script checks if Python pre-commit is managing git hooks.
 * If not, it runs the repository's setup script to install pre-commit.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Check if Python pre-commit framework is managing git hooks
 */
function isPreCommitInstalled(gitRoot) {
  const hookPath = path.join(gitRoot, '.git', 'hooks', 'pre-commit');

  try {
    if (!fs.existsSync(hookPath)) return false;

    const content = fs.readFileSync(hookPath, 'utf8');
    return content.includes('pre-commit') || content.includes('INSTALL_PYTHON');
  } catch {
    return false;
  }
}

/**
 * Get git repository root directory
 */
function getGitRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Run the repository setup script
 */
function runSetupScript(gitRoot) {
  const setupScript = path.join(gitRoot, 'scripts', 'setup-git-hooks.sh');

  if (!fs.existsSync(setupScript)) {
    throw new Error('Setup script not found');
  }

  execSync(`bash "${setupScript}"`, {
    cwd: gitRoot,
    stdio: 'inherit'
  });
}

// Main execution

// Skip in Docker/CI environments
if (process.env.DOCKER || process.env.CI || process.env.KUBERNETES_SERVICE_HOST) {
  console.log('⚠️  Running in containerized environment. Skipping git hooks setup.');
  process.exit(0);
}

// Skip on Windows (bash not available by default)
if (process.platform === 'win32') {
  console.log('⚠️  Running on Windows. Git hooks setup skipped.');
  console.log('   To setup git hooks on Windows, use Git Bash or WSL.');
  process.exit(0);
}

const gitRoot = getGitRoot();

if (!gitRoot) {
  console.log('⚠️  Not in a git repository. Skipping git hooks setup.');
  process.exit(0);
}

if (isPreCommitInstalled(gitRoot)) {
  console.log('✅ Git hooks managed by Python pre-commit framework');
  console.log('   Husky hooks will be called automatically for UI files');
  process.exit(0);
}

// Pre-commit not installed - set it up
console.log('⚠️  Pre-commit hooks not installed');
console.log('📦 Installing pre-commit hooks from project dependencies...');
console.log('');

try {
  runSetupScript(gitRoot);
  console.log('');
  console.log('✅ Pre-commit hooks installed successfully');
} catch (error) {
  console.error('❌ Failed to setup git hooks');
  console.error('   Please run manually from repo root: ./scripts/setup-git-hooks.sh');
  process.exit(1);
}
