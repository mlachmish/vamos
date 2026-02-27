# Playbook — Project Knowledge Base

You are working on the **Padel Score** project. The playbook at `playbook/` is the single source of truth for all decisions, plans, and definitions.

## Your Job

When the user invokes `/playbook`, help them interact with the playbook. Interpret the user's argument (`$ARGUMENTS`) and do the right thing:

### No arguments or "status"
- Read all playbook files and give a concise summary of the current project state, what's been decided, and what's still open.

### "update <file> <description of changes>"
- Read the specified playbook file, apply the described changes, and confirm what was updated.
- Example: `/playbook update features add serve tracking to MVP`

### "decide <topic>"
- Help the user think through a decision, then add it to `decisions.md` with proper numbering, date, reasoning.
- Example: `/playbook decide should we use golden point by default?`

### "add <file> <content>"
- Add new content to the specified playbook file.
- Example: `/playbook add features offline mode support`

### "review"
- Read all playbook files and check for inconsistencies, gaps, or things that need decisions. Report findings.

### "diff"
- Show what has changed in the playbook since the last commit (use git diff if available).

### Any other argument
- Interpret the intent and act accordingly. When in doubt, read the relevant playbook files first, then help.

## Important Rules
1. Always read the relevant playbook file(s) BEFORE making changes.
2. Keep the playbook concise and well-structured — no fluff.
3. When adding decisions, use the next number in sequence and include today's date.
4. After any update, briefly confirm what changed.
5. The playbook files are: `overview.md`, `features.md`, `scoring-rules.md`, `architecture.md`, `data-model.md`, `ui-ux.md`, `decisions.md`.

User's request: $ARGUMENTS
