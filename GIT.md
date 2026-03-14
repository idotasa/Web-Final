# Git – If commit is not working

If `git commit` fails, try the following.

## "Please tell me who you are" (name/email not set)

Configure your name and email once per machine:

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

Or only for this repo:

```bash
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

## Normal commit flow

```bash
# Stage all changes
git add .

# Or stage specific files
git add frontend/src/App.tsx

# Commit with a message
git commit -m "Your commit message"
```

## If you use Cursor/VS Code Source Control

1. Stage your changes (click **+** next to files or "Stage All").
2. Type a message in the message box.
3. Click the checkmark or press Ctrl+Enter (Cmd+Enter on Mac) to commit.

If it still fails, run `git commit -m "message"` in a terminal and read the error; the message usually says what to fix (e.g. set `user.email`).
