# Project Agent Rules

## Safety Rules

* Never run `git commit` unless explicitly asked.
* Never run `git push` unless explicitly asked.
* Never create, delete, or switch git branches unless explicitly asked.
* Never merge pull requests unless explicitly asked.
* Never modify CI/CD, deployment, infrastructure, secrets, or production configuration unless explicitly asked.
* Never install global packages or system software without approval.
* Never delete files or directories without approval.
* Always show a summary of planned changes before making large modifications.
* Ask for confirmation before any potentially destructive action.

## Git Workflow

Allowed:

* git status
* git diff
* git log
* git show

Require approval:

* git add
* git commit
* git push
* git rebase
* git reset
* git checkout
* git switch
* git merge
* git cherry-pick

When work is complete:

* Stop after making code changes.
* Explain what changed.
* Suggest commit messages if useful.
* Wait for user approval before any git write operation.
