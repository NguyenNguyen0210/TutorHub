---

name: git-workflow
description: Manage Git safely during software development. Use when implementing features, fixing bugs, creating commits, reviewing changes, synchronizing branches, resolving conflicts, or pushing code. The primary workflow is feature-scoped development: inspect the current branch, keep implementation on that branch, commit only relevant changes, and push to the same feature branch. Never switch branches or perform destructive Git operations without explicit authorization.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Git Workflow & Safety

## 1. Purpose

This skill defines how an AI coding agent should work with Git while implementing software changes.

The primary objective is:

```text
Requested Feature
      ↓
Inspect Repository
      ↓
Validate Current Branch
      ↓
Implement On Current Branch
      ↓
Test
      ↓
Review Changes
      ↓
Commit
      ↓
Verify Branch
      ↓
Push Same Branch
      ↓
Verify Remote
```

Git operations must preserve:

* Feature isolation.
* Branch correctness.
* Commit clarity.
* Repository safety.
* Existing project conventions.
* User changes.
* Remote branch integrity.

Do not treat Git as a collection of commands.

Treat Git as the state-management system for the development workflow.

---

# 2. Core Rules

These rules have priority over convenience.

## Rule 1 — Inspect before acting

Before performing meaningful Git operations, inspect the repository.

At minimum:

```bash
git status
git branch --show-current
```

When necessary:

```bash
git branch -vv
git remote -v
git log --oneline -n 10
git diff
```

Never assume:

* The current branch.
* The working tree is clean.
* The branch has an upstream.
* The remote is `origin`.
* The project uses a specific branch naming convention.

---

## Rule 2 — The current branch is the execution branch

When the user asks to implement a feature or fix:

> Work on the branch that is currently checked out.

Example:

```text
Current branch:
feature/student-enrollment
```

Requested work:

```text
Implement student enrollment
```

Then all implementation work must remain on:

```text
feature/student-enrollment
```

Do not automatically switch branches.

Do not automatically create another branch.

---

## Rule 3 — Do not silently change branches

Never execute:

```bash
git checkout ...
git switch ...
git switch -c ...
git checkout -b ...
```

during feature implementation merely because another branch appears more appropriate.

If the current branch does not match the requested work:

```text
STOP
```

Explain the mismatch and ask the user what branch should be used.

---

## Rule 4 — Do not develop features directly on protected branches

If the current branch is:

```text
main
master
develop
release/*
```

and the user asks for normal feature development, do not immediately modify and commit code there.

Inform the user that the current branch appears inappropriate for feature development and ask them to provide/switch to the intended feature branch.

Exception:

If the user explicitly instructs:

```text
Implement directly on main.
```

follow the explicit instruction.

---

# 3. Feature-to-Branch Alignment

The current branch should represent the feature being implemented.

Examples:

```text
feature/student-enrollment
```

should contain work related to:

```text
Student Enrollment
```

Not:

```text
Payment Gateway
```

or:

```text
Notification System
```

If the branch and requested feature clearly do not correspond:

```text
Current branch:
feature/student-enrollment

Requested:
Implement payment gateway
```

Do not start implementation.

Ask the user to resolve the branch mismatch.

---

# 4. Existing Branch Conventions

Do not impose a branch naming convention if the repository already has one.

Possible conventions include:

```text
feature/*
feat/*
bugfix/*
fix/*
hotfix/*
task/*
```

Before creating or recommending a branch, inspect:

```bash
git branch -a
git log --oneline --decorate -n 20
```

Follow the repository's established convention.

If there is no convention, a reasonable default is:

```text
feature/<short-feature-name>
```

However, do not create the branch automatically unless explicitly authorized.

---

# 5. Never Assume the Remote

Do not assume the remote is named:

```text
origin
```

Inspect:

```bash
git remote -v
```

When pushing, verify the current branch and upstream:

```bash
git branch -vv
```

The intended relationship should be:

```text
Local Feature Branch
        ↓
Remote Feature Branch
```

Example:

```text
feature/student-enrollment
        ↓
origin/feature/student-enrollment
```

---

# 6. Protect User Changes

Before modifying files:

```bash
git status
```

Inspect existing modifications.

If the working tree already contains user changes:

```text
Modified files
Untracked files
Staged files
```

do not assume those changes belong to the current task.

Preserve them.

Do not:

```bash
git reset --hard
git clean -fd
git restore .
```

to obtain a clean working tree.

User changes are not disposable.

---

# 7. Working Tree Inspection

Understand the three important Git states:

```text
Working Tree
     ↓ git add
Staging Area
     ↓ git commit
Repository
```

Use:

```bash
git status
```

to understand the overall state.

Use:

```bash
git diff
```

to inspect unstaged changes.

Use:

```bash
git diff --cached
```

to inspect staged changes.

Never commit without knowing what is staged.

---

# 8. Feature Implementation Workflow

When implementing a feature, follow this workflow:

```text
1. Inspect branch
2. Inspect working tree
3. Confirm feature scope
4. Implement feature
5. Run relevant tests
6. Review diff
7. Identify unrelated changes
8. Stage only relevant files
9. Review staged diff
10. Create commit
11. Verify current branch
12. Verify upstream
13. Push same branch
14. Verify push
```

Do not skip branch verification before pushing.

---

# 9. Branch Verification Before Coding

At the beginning of a feature task:

```bash
git branch --show-current
git status
```

Record mentally:

```text
Current branch = execution branch
```

All code changes for the task must remain on that branch unless the user explicitly changes the workflow.

---

# 10. Branch Verification Before Commit

Before committing:

```bash
git branch --show-current
git status
```

Confirm that the commit will be created on the intended feature branch.

Do not commit if the branch unexpectedly changed.

---

# 11. Branch Verification Before Push

Immediately before pushing:

```bash
git branch --show-current
git branch -vv
git status
```

Confirm:

```text
Current branch
        =
Intended feature branch
```

and:

```text
Upstream branch
        =
Same feature branch
```

Example:

```text
Local:
feature/student-enrollment

Upstream:
origin/feature/student-enrollment
```

Only then push.

---

# 12. Push Rule

When feature work is complete:

> Push the current feature branch to its corresponding remote feature branch.

Preferred:

```bash
git push
```

when the upstream is already correctly configured.

If the upstream does not exist, inspect the situation first.

Do not silently choose another remote branch.

Do not push feature work to:

```text
main
master
develop
```

unless explicitly instructed.

---

# 13. Push Safety

Before pushing:

```text
[ ] Correct branch
[ ] Correct upstream
[ ] Correct remote
[ ] Intended commits only
[ ] No secrets
[ ] Tests completed
[ ] Working tree understood
```

If any of these are unclear, stop and inspect.

---

# 14. Never Force Push by Default

Never execute:

```bash
git push --force
```

automatically.

If history must be rewritten and the user explicitly authorizes it, prefer:

```bash
git push --force-with-lease
```

over:

```bash
git push --force
```

Understand that force-pushing can overwrite remote history and potentially destroy other developers' commits.

---

# 15. High-Risk Git Operations

Treat these as destructive or potentially destructive:

```bash
git reset --hard
git clean -fd
git clean -fdx
git push --force
git push --force-with-lease
git branch -D
git rebase
git filter-repo
history rewriting
```

Do not perform them automatically.

Before executing a destructive operation:

1. Explain what will be affected.
2. Explain the risk.
3. Obtain explicit authorization if it was not already clearly provided.
4. Prefer the least destructive alternative.

---

# 16. Commit Scope

A commit should represent a coherent logical change.

For feature work:

```text
feature/student-enrollment
```

commits should primarily contain:

```text
Student enrollment implementation
Student enrollment validation
Student enrollment tests
```

Avoid mixing unrelated work:

```text
Student enrollment
+
Payment gateway
+
README formatting
+
Unrelated refactor
```

in the same commit unless the changes are genuinely coupled.

---

# 17. Staging Strategy

Do not blindly use:

```bash
git add .
```

when unrelated changes may exist.

Prefer targeted staging:

```bash
git add path/to/file1 path/to/file2
```

Then inspect:

```bash
git diff --cached
```

If changes within a file are mixed between the current task and unrelated work, consider partial staging when practical.

The objective is:

```text
Commit
=
Relevant changes for this task
```

---

# 18. Commit Message

Follow the repository's existing commit convention.

First inspect recent history:

```bash
git log --oneline -n 20
```

Possible conventions include:

```text
feat: add student enrollment
fix: handle duplicate enrollment
refactor: simplify enrollment validation
test: add enrollment handler tests
```

or:

```text
Add student enrollment
Fix duplicate enrollment
```

Do not introduce Conventional Commits solely because it is popular.

If the repository has no obvious convention, use a concise imperative message describing the actual change.

Avoid:

```text
Update
Changes
Fix stuff
Work
Done
```

Prefer:

```text
Add student enrollment workflow
```

---

# 19. Commit Preconditions

Before creating a commit:

```text
[ ] Correct branch
[ ] Correct feature
[ ] Tests completed
[ ] Diff reviewed
[ ] No accidental files
[ ] No secrets
[ ] Staged changes understood
[ ] Commit message describes actual change
```

Then:

```bash
git commit
```

After committing:

```bash
git status
git log --oneline -n 3
```

---

# 20. Diff Review

Before committing feature work:

```bash
git diff
```

and:

```bash
git diff --cached
```

Review for:

* Accidental modifications.
* Debug statements.
* Temporary code.
* Unrelated refactoring.
* Deleted files.
* Generated files.
* Configuration changes.
* Credentials.
* Secrets.
* Unexpected formatting changes.

The Git diff is part of the implementation review process.

---

# 21. Generated Files

Be aware of generated files such as:

```text
bin/
obj/
node_modules/
coverage/
build/
dist/
IDE metadata
temporary files
```

Follow the project's `.gitignore` and existing repository conventions.

Do not automatically modify `.gitignore` simply because an untracked file exists.

Determine whether the file is:

```text
Generated
Required
Project-specific
Temporary
Sensitive
```

before deciding how to handle it.

---

# 22. Secret Protection

Before committing, look for accidentally staged sensitive information:

```text
API keys
Access tokens
Passwords
Private keys
Database credentials
Connection strings
.env files
Credential files
Cloud credentials
```

Never intentionally commit secrets.

If a secret has already been committed:

```text
Removing the file from the working tree is not sufficient.
```

The secret may still exist in Git history.

Recommended response:

```text
1. Stop further exposure.
2. Rotate/revoke the secret.
3. Determine whether history rewriting is necessary.
4. Remove sensitive history if required.
5. Verify the repository.
```

Do not attempt history rewriting automatically.

---

# 23. History Investigation

Use Git history to understand existing behavior before making risky changes.

Useful commands:

```bash
git log --oneline
git log -- path/to/file
git show <commit>
git blame path/to/file
```

Use history when:

* A code section appears unusual.
* A configuration was intentionally structured a certain way.
* A refactor may break historical assumptions.
* A bug appears related to a previous change.
* You need to understand why a file was modified.

Do not use `git blame` to assign responsibility socially.

Use it as a historical investigation tool.

---

# 24. Fetch vs Pull

Understand the distinction.

### Fetch

```bash
git fetch
```

Updates remote-tracking information without automatically modifying the current branch.

Use when inspecting remote state.

### Pull

```bash
git pull
```

Fetches and integrates remote changes into the current branch.

Do not execute `git pull` automatically merely because the repository has remote changes.

Before pulling, inspect:

```bash
git status
git branch -vv
```

Understand what integration strategy the repository uses.

---

# 25. Synchronizing a Feature Branch

When asked to synchronize a feature branch:

```text
Inspect
 ↓
Determine upstream
 ↓
Fetch
 ↓
Inspect divergence
 ↓
Choose merge/rebase according to project workflow
 ↓
Resolve conflicts carefully
 ↓
Test
 ↓
Push
```

Do not arbitrarily rebase a shared feature branch.

Do not rewrite public history without authorization.

---

# 26. Merge

Before merging:

```bash
git status
git branch --show-current
```

Understand:

```text
Current branch
Target branch
```

A merge must not accidentally reverse these roles.

After merging:

```bash
git status
git diff
```

Then run relevant tests.

If conflicts occur, follow the conflict-resolution workflow.

---

# 27. Rebase

Rebase rewrites commit history.

Before rebasing:

```text
Determine:
- Which branch is being rebased?
- Is the branch shared?
- Will the remote history be rewritten?
- Is the user expecting a linear history?
```

Never blindly rebase a shared branch.

After a rebase:

```text
Review history
Run tests
Verify branch
```

If pushing rewritten history is required, use:

```bash
git push --force-with-lease
```

only with appropriate authorization.

---

# 28. Conflict Resolution

When a conflict occurs:

```text
1. Stop normal workflow.
2. Run git status.
3. Identify conflicted files.
4. Inspect both sides.
5. Understand intended behavior.
6. Resolve manually.
7. Review git diff.
8. Run tests.
9. Stage resolved files.
10. Continue merge/rebase.
```

Never resolve conflicts mechanically by choosing:

```bash
git checkout --ours .
```

or:

```bash
git checkout --theirs .
```

without understanding the changes.

Conflict resolution is a code correctness problem, not merely a Git problem.

---

# 29. Undoing Changes

Understand the difference between:

```text
git restore
git reset
git revert
```

### Restore

Used primarily to discard or unstage changes.

Potentially destructive when discarding working-tree changes.

### Reset

Moves branch pointers and/or modifies staging/working state depending on mode.

Especially dangerous:

```bash
git reset --hard
```

### Revert

Creates a new commit that reverses an earlier commit.

For changes already shared publicly, prefer:

```text
revert
```

over rewriting history.

---

# 30. Stash

Use stash when temporarily setting aside work is genuinely useful.

Common operations:

```bash
git stash
git stash list
git stash show
git stash apply
git stash pop
```

Before stashing, understand what is being hidden.

Do not use stash as a substitute for proper commits when the work represents a meaningful logical change.

---

# 31. Branch Deletion

Do not delete branches automatically.

Especially distinguish:

```bash
git branch -d branch
```

from:

```bash
git branch -D branch
```

`-D` can delete a branch even when Git considers it unmerged.

Never delete a user's branch or another developer's branch without explicit authorization.

---

# 32. Remote Branch Deletion

Deleting a remote branch affects other repository users.

Do not execute:

```bash
git push origin --delete <branch>
```

unless explicitly requested or clearly authorized.

---

# 33. Tags and Releases

Tags may represent releases or important repository states.

Do not create, move, or delete release tags automatically.

Especially avoid rewriting existing release tags without explicit authorization.

---

# 34. Feature Completion Workflow

When the requested feature is complete:

```text
Current Branch
      ↓
Verify feature scope
      ↓
Run tests
      ↓
Review git diff
      ↓
Stage relevant changes
      ↓
Review staged diff
      ↓
Commit
      ↓
Verify commit
      ↓
Verify current branch
      ↓
Verify upstream
      ↓
Push
      ↓
Verify remote state
```

The final state should be:

```text
Local:
feature/<feature>

        ↓

Remote:
origin/feature/<feature>
```

---

# 35. Required Final Verification

After pushing:

```bash
git status
git branch -vv
git log --oneline -n 3
```

Confirm:

```text
[ ] Correct branch
[ ] Commit exists
[ ] Upstream is correct
[ ] Push succeeded
[ ] No unexpected uncommitted changes
```

Report the result clearly.

Example:

```text
Implemented student enrollment on feature/student-enrollment.

Commit:
abc1234 Add student enrollment workflow

Pushed to:
origin/feature/student-enrollment
```

Do not claim a push succeeded unless the Git command actually succeeded.

---

# 36. When the User Only Asks to Code

If the user asks:

> Implement feature X

and the project workflow expects Git completion, follow:

```text
Inspect branch
→ Implement
→ Test
→ Review
→ Commit
→ Push same branch
```

However, do not push merely because the repository has Git.

If the user or project workflow does not authorize pushing, stop after the appropriate local work/commit and report the state.

When push is part of the established workflow or explicitly requested, push the current feature branch.

---

# 37. When the User Asks Only About Git

If the user asks:

> What is git rebase?

or:

> Why is my branch behind?

Do not modify the repository.

Use Git commands only when necessary to inspect the actual repository state.

---

# 38. Agent Safety Levels

Classify operations.

## Safe

Normally safe to execute:

```bash
git status
git branch
git branch --show-current
git remote -v
git log
git diff
git show
git fetch
```

Still inspect context before modifying anything.

## Caution

Potentially changes local state:

```bash
git add
git commit
git pull
git merge
git rebase
git restore
git reset
git stash
```

Understand the repository state before execution.

## High Risk

Require explicit authorization when not already clearly requested:

```bash
git reset --hard
git clean -fd
git clean -fdx
git push --force
git push --force-with-lease
git branch -D
git push --delete
history rewriting
```

---

# 39. Agent Decision Tree

When asked to implement a feature:

```text
                User requests feature
                         │
                         ▼
                 Inspect repository
                         │
                         ▼
                Get current branch
                         │
                         ▼
              Inspect working tree
                         │
                         ▼
             Does branch match task?
                    /          \
                  YES           NO
                   │             │
                   ▼             ▼
               Continue         STOP
                   │         Ask user
                   ▼
               Implement
                   │
                   ▼
                 Test
                   │
                   ▼
              Review diff
                   │
                   ▼
          Stage relevant changes
                   │
                   ▼
          Review staged changes
                   │
                   ▼
                Commit
                   │
                   ▼
          Verify current branch
                   │
                   ▼
           Verify remote/upstream
                   │
                   ▼
             Push same branch
                   │
                   ▼
          Verify push succeeded
```

---

# 40. Non-Negotiable Rules

The following rules must always be respected:

```text
1. Never assume the current branch.
2. Inspect the branch before implementing.
3. Treat the current branch as the execution branch.
4. Do not silently switch branches.
5. Do not silently create a different feature branch.
6. Do not implement normal features directly on protected branches.
7. Keep changes scoped to the requested feature.
8. Preserve pre-existing user changes.
9. Review diffs before committing.
10. Review staged changes before committing.
11. Verify the branch before pushing.
12. Push feature work to the same feature branch.
13. Never push feature work to main/develop accidentally.
14. Never force-push without explicit authorization.
15. Never use destructive commands merely to make the repository clean.
16. Never commit secrets.
17. Resolve conflicts based on code intent, not blindly.
18. Prefer revert over rewriting public history.
19. Follow repository-specific Git conventions.
20. Verify the final Git state after completing the workflow.
```

---

# 41. Guiding Principle

The agent must optimize for:

```text
Correct code
+
Correct feature
+
Correct branch
+
Correct commit
+
Correct remote
```

A feature is not considered successfully completed if:

```text
The code is correct
but
the code was committed to the wrong branch.
```

Likewise:

```text
The commit is correct
but
the code was pushed to the wrong remote branch.
```

The Git workflow is part of the correctness of the implementation.

The final expected state for feature development is:

```text
             Feature Request
                    │
                    ▼
          Current Feature Branch
                    │
                    ▼
              Implementation
                    │
                    ▼
                  Tests
                    │
                    ▼
               Git Review
                    │
                    ▼
                 Commit
                    │
                    ▼
          Same Feature Branch
                    │
                    ▼
          Remote Feature Branch
```

Never trade branch correctness for convenience.
