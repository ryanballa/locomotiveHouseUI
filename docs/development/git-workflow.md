# Git Workflow

Follow this workflow for consistent, trackable development.

## Branch Strategy

We use a simple branch-based workflow:

- **main** - Production-ready code
- **feature/*** - New features
- **fix/*** - Bug fixes
- **docs/*** - Documentation
- **test/*** - Tests
- **refactor/*** - Code refactoring
- **chore/*** - Maintenance

## Creating a Feature Branch

### 1. Update Main

```bash
git checkout main
git pull origin main
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive names:
- `feature/club-management` - New club feature
- `fix/auth-error` - Fix authentication error
- `docs/api-guide` - API documentation
- `test/appointments` - Tests for appointments

### 3. Push to Remote

```bash
git push origin feature/your-feature-name
```

Establishes remote branch for collaboration.

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### Commit Types

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
test:     Tests
refactor: Code refactoring (no functionality change)
chore:    Maintenance, dependencies, tooling
style:    Formatting only (no logic change)
perf:     Performance improvements
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Examples

#### Simple Feature

```bash
git commit -m "feat: add club-based appointments

- Created /club/[id]/appointments route
- Implemented appointment list with filters
- Added create appointment form"
```

#### Bug Fix

```bash
git commit -m "fix: prevent admin dropdown showing for non-admins

The admin dropdown was visible due to missing loading state.
Added setLoading(false) in early returns of useAdminCheck hook.

Fixes #123"
```

#### Documentation

```bash
git commit -m "docs: add authentication guide

Explains the authentication flow using Clerk,
how to get tokens, and common patterns."
```

#### Refactoring

```bash
git commit -m "refactor: extract appointment filtering logic

Moved filtering logic from component to custom hook.
Makes code more testable and reusable.

No behavior changes."
```

### Best Practices

#### 1. Small, Logical Commits

```bash
# ✓ Good: Commit related changes together
git add components/AppointmentCard.tsx
git commit -m "feat: add appointment card component"

# ✓ Good: Separate concerns
git add components/AppointmentCard.test.tsx
git commit -m "test: add tests for appointment card"

# ✗ Avoid: Large, unrelated changes
git add .
git commit -m "fixed stuff and added things"
```

#### 2. Atomic Commits

Each commit should be a complete, working unit:

```bash
# ✓ Good: Feature complete in one commit
# - New component
# - Component tests
# - Component usage

# ✗ Avoid: Half-finished commits
# - New component (not used)
# - Broken tests
# - Incomplete refactoring
```

#### 3. Meaningful Messages

```bash
# ✓ Good
git commit -m "feat: add date range filter for appointments"

# ✗ Avoid
git commit -m "update"
git commit -m "wip"
git commit -m "fix stuff"
```

#### 4. Reference Issues

```bash
# ✓ Good: Link to issue
git commit -m "feat: add appointments feature

Implements user stories from #42 and #43.
Closes #42, #43"

# ✓ Also good: Mention issue number
git commit -m "fix: prevent duplicate appointments

Fixes #125"
```

## Pulling Latest Changes

Before starting work or before pushing:

```bash
# Update current branch
git pull origin feature/your-feature-name

# Or, reset to remote if local changes aren't important
git fetch origin
git reset --hard origin/feature/your-feature-name
```

## Pushing Your Changes

### Push Single Commit

```bash
git push origin feature/your-feature-name
```

### Push Multiple Commits

```bash
# All local commits will be pushed
git push origin feature/your-feature-name
```

### Force Push (Use Carefully!)

Only use if you've rebased or amended commits locally:

```bash
# Only safe if you're the only one on this branch
git push origin feature/your-feature-name --force
```

**Warning**: Never force push to `main`.

## Creating a Pull Request

### On GitHub

1. Push your branch
2. Go to repository
3. GitHub shows "Create Pull Request" button
4. Click it
5. Fill in PR template:
   - **Title**: Clear, concise summary
   - **Description**: What changed and why
   - **Testing**: How to test changes
   - **Related Issues**: Link to issues

### PR Title Format

```
feat: add club-based appointment creation
fix: resolve authentication error
docs: update setup guide
```

### PR Description Template

```markdown
## Summary
Brief description of changes (1-3 sentences)

## Changes
- What was added/changed/removed

## Testing
How to test this:
1. Navigate to appointments
2. Click "Create"
3. Verify form works

## Related Issues
Closes #123, #124

## Checklist
- [x] Tests pass
- [x] No console errors
- [x] Documentation updated
- [x] Code follows standards
```

## Code Review Process

### Getting Your PR Reviewed

1. Create PR with clear description
2. Request reviewers
3. Address feedback from reviewers
4. Reviewers approve
5. Merge to main

### What Reviewers Check

- Code follows standards
- Tests are comprehensive
- Documentation is updated
- No breaking changes
- Performance implications

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "Address review feedback"

# Push changes (same branch)
git push origin feature/your-feature-name

# PR automatically updates with new commits
```

## Merging Your PR

Once approved:

### 1. Ensure Branch is Up to Date

```bash
git pull origin main
git merge main
# Resolve any conflicts
git push origin feature/your-feature-name
```

### 2. Merge via GitHub

- Click "Merge pull request" button
- Select merge strategy (usually "Create merge commit")
- Confirm merge

### 3. Delete Branch

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

## Handling Merge Conflicts

### When Conflicts Occur

```bash
# Someone merged main while your PR was open
# Update your branch
git fetch origin
git rebase origin/main

# OR merge main into your branch
git merge origin/main
```

### Resolving Conflicts

1. Open conflicted files
2. Look for `<<<<<<<`, `=======`, `>>>>>>>`
3. Keep both changes (if applicable) or choose one
4. Remove conflict markers
5. Test and commit

```bash
git add conflicted-file.ts
git commit -m "resolve merge conflicts"
git push origin feature/your-feature-name
```

## Checking History

### View Commits

```bash
# View recent commits
git log

# View commits on current branch
git log --oneline

# View commits with graph
git log --graph --oneline --all
```

### View Changes

```bash
# Changes in current branch vs main
git diff main

# Changes in specific file
git diff main -- file.ts

# Changes in specific commit
git show commit-hash
```

## Undoing Mistakes

### Undo Last Commit (Not Pushed)

```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

### Undo Changes to File

```bash
# Discard changes (not committed)
git restore file.ts

# Restore from specific commit
git restore --source=commit-hash file.ts
```

### Revert Commit (After Pushed)

```bash
# Create new commit that undoes changes
git revert commit-hash
git push origin main
```

## Team Collaboration

### Pulling Latest Changes

Always pull before starting work:

```bash
git checkout main
git pull origin main
```

### Syncing Feature Branch

If main was updated while working:

```bash
git fetch origin
git merge origin/main
# OR
git rebase origin/main
```

### Keeping Branch Clean

```bash
# Remove deleted remote branches from local
git fetch origin --prune

# View branches
git branch -a

# Clean up local branches
git branch -vv
```

## Best Practices

### 1. Commit Frequently

```bash
# ✓ Good: Frequent, small commits
git commit -m "add appointment list component"
git commit -m "add appointment list styles"
git commit -m "add appointment list tests"

# ✗ Avoid: Rare, large commits
git commit -m "add appointments, fix bugs, update docs"
```

### 2. Keep Branch Focused

```bash
# ✓ Good: One feature per branch
# feature/appointments - Only appointment-related changes

# ✗ Avoid: Multiple features
# feature/everything - appointments, addresses, admin, etc.
```

### 3. Don't Commit Secrets

```bash
# ✓ Good: Use environment variables
CLERK_SECRET_KEY=pk_test_xxx  # In .env.local (not committed)

# ✗ Avoid: Commit secrets
git add .env.local  # Contains API keys!
```

### 4. Review Your Own Code First

```bash
# Before pushing, check what you're committing
git diff
git status
git log -1

# Make sure changes are correct
```

### 5. Write Clear Commit Messages

Future you (and others) will thank you for clear commits.

```bash
# When debugging, you'll need to read commit messages:
git log
git log -p file.ts  # Show changes in file
git blame file.ts   # See who changed what
```

## Workflow Example

Complete workflow for a feature:

```bash
# 1. Start
git checkout main
git pull origin main

# 2. Create branch
git checkout -b feature/add-appointment-filters

# 3. Work on feature
# ... make changes ...
git add components/AppointmentFilter.tsx
git commit -m "feat: add appointment filter component"

# ... more work ...
git add components/AppointmentFilter.test.tsx
git commit -m "test: add appointment filter tests"

# 4. Push
git push origin feature/add-appointment-filters

# 5. Create PR on GitHub

# 6. Address review feedback (if needed)
git add lib/filter-utils.ts
git commit -m "Address review feedback"
git push origin feature/add-appointment-filters

# 7. Merge (via GitHub)

# 8. Clean up
git checkout main
git pull origin main
git branch -d feature/add-appointment-filters
```

## Related Documentation

- [Coding Standards](./coding-standards.md) - Code quality
- [Testing Guide](./testing.md) - Ensure tests pass before committing
- [Contributing Guide](../../CONTRIBUTING.md) - Overall contribution guidelines
