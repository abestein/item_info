# Git Hooks with Claude Integration

Custom git hooks that automatically detect issues and help you send them to Claude for assistance.

## Installed Hooks

### 1. **pre-commit** Hook
Runs before each commit to check for:
- `console.log` statements
- TODO/FIXME/HACK comments
- Merge conflict markers
- Potential sensitive data (passwords, API keys, tokens)

**When it finds issues:**
- Saves details to `.git/claude-issue.txt`
- Gives you a message to tell Claude

**Example:**
```bash
git commit -m "Add new feature"
# Hook detects console.log statements
# You tell Claude: "Check .git/claude-issue.txt and help me fix these console.log statements"
```

### 2. **pre-push** Hook
Runs before pushing to remote to check for:
- Test failures (if tests are configured)
- Untracked important files
- Poor quality commit messages

**When pushing to master/main:**
- Automatically runs tests (if available)
- Warns about test failures
- Saves results to `.git/test-results.txt`

**Example:**
```bash
git push origin master
# Hook runs tests and they fail
# You tell Claude: "Check .git/test-results.txt - tests are failing before push"
```

### 3. **commit-msg** Hook
Validates commit message quality:
- Minimum 10 characters
- Suggests conventional commit format
- Warns about all-caps messages

**Conventional Commit Format:**
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance

### 4. **post-commit** Hook
Analyzes each commit after it's made:
- Detects large files
- Warns about large commits (>20 files)
- Saves commit statistics to `.git/last-commit-stats.txt`

**Example:**
```bash
# After committing
# Hook saves stats
# You tell Claude: "Check .git/last-commit-stats.txt and review my last commit"
```

## Managing Hooks

Use the `git-hooks-manager.sh` script:

### Check Status
```bash
./git-hooks-manager.sh status
```

### Disable a Hook
```bash
./git-hooks-manager.sh disable pre-commit
```

### Enable a Hook
```bash
./git-hooks-manager.sh enable pre-commit
```

### Disable All Hooks
```bash
./git-hooks-manager.sh disable
```

### Enable All Hooks
```bash
./git-hooks-manager.sh enable
```

### Test Hooks
```bash
./git-hooks-manager.sh test
```

## Quick Bypass (When Needed)

Sometimes you need to bypass hooks:

### Skip pre-commit hook
```bash
git commit --no-verify -m "Your message"
```

### Skip pre-push hook
```bash
git push --no-verify
```

## Claude Integration Workflow

1. **Hook detects an issue**
   - Issue details saved to `.git/claude-issue.txt` or `.git/test-results.txt`
   - Hook shows you a message

2. **You tell Claude**
   - Copy the message shown by the hook
   - Paste it to Claude

3. **Claude helps fix it**
   - Claude reads the issue file
   - Provides solution or fixes the code

4. **Commit/push again**
   - Hook runs again
   - If fixed, commit/push succeeds!

## Example Scenarios

### Scenario 1: Console.log Detection
```bash
$ git commit -m "Add login feature"
Running pre-commit checks...

WARNING: Found console.log statements:
client/src/pages/LoginPage.tsx:45:console.log("user data:", userData)
client/src/services/authService.ts:23:console.log("token:", token)

Do you want Claude to help remove these? (y/n)
y

Issue saved to .git/claude-issue.txt
Tell Claude: 'Check .git/claude-issue.txt and help me fix these console.log statements'
```

Then you tell me: "Check .git/claude-issue.txt and help me fix these console.log statements"

### Scenario 2: Test Failures
```bash
$ git push origin master
Running pre-push checks...
WARNING: Pushing to master branch
Running tests before push...

FAIL client/src/tests/auth.test.ts
  ✓ should login successfully
  ✗ should handle invalid credentials

ERROR: Tests failed!
Test results saved to .git/test-results.txt

Tell Claude: 'Check .git/test-results.txt - tests are failing before push'
```

### Scenario 3: Merge Conflicts
```bash
$ git commit -m "Merge feature branch"
Running pre-commit checks...

ERROR: Found merge conflict markers in staged files!

Commit blocked. Issue saved to .git/claude-issue.txt
Tell Claude: 'Check .git/claude-issue.txt - I have unresolved merge conflicts'
```

## Files Created by Hooks

- `.git/claude-issue.txt` - Issues found by pre-commit hook
- `.git/test-results.txt` - Test results from pre-push hook
- `.git/last-commit-stats.txt` - Statistics from post-commit hook

You can always view these files:
```bash
cat .git/claude-issue.txt
cat .git/test-results.txt
cat .git/last-commit-stats.txt
```

## Customization

All hooks are located in `.git/hooks/` and can be edited:
- `.git/hooks/pre-commit`
- `.git/hooks/pre-push`
- `.git/hooks/commit-msg`
- `.git/hooks/post-commit`

Edit them with any text editor to customize behavior.

## Troubleshooting

### Hooks not running?
Check if they're executable:
```bash
ls -la .git/hooks/ | grep -E "(pre-commit|pre-push)"
```

Make them executable:
```bash
chmod +x .git/hooks/*
```

### Want to skip hooks temporarily?
Use `--no-verify`:
```bash
git commit --no-verify -m "Quick fix"
git push --no-verify
```

### Hooks running on every auto-commit?
The auto-push script bypasses hooks by default. If you want hooks to run on auto-commits, edit `auto-git-push.ps1`.

## Summary

These hooks help you:
1. Catch issues before they're committed
2. Maintain code quality
3. Get Claude's help when problems are detected
4. Learn from your mistakes

The hooks are your safety net - they're there to help, not to annoy!
