# NotebookLM Skill - API Reference

Detailed API documentation for all scripts and commands.

## Table of Contents

- [run.py Wrapper](#runpy-wrapper)
- [auth_manager.py](#auth_managerpy)
- [notebook_manager.py](#notebook_managerpy)
- [ask_question.py](#ask_questionpy)
- [cleanup_manager.py](#cleanup_managerpy)

---

## run.py Wrapper

The `run.py` wrapper is the **ONLY** way to execute scripts. It handles virtual environment setup automatically.

### Usage

```bash
python scripts/run.py <script_name> [args...]
```

### What It Does

1. Checks for `.venv` directory
2. Creates virtual environment if missing
3. Installs dependencies from `requirements.txt`
4. Executes the script with correct Python interpreter

### Example

```bash
# Correct
python scripts/run.py notebook_manager.py list

# Wrong (will fail)
python scripts/notebook_manager.py list
```

---

## auth_manager.py

Manages Google authentication for NotebookLM access.

### Commands

#### `status`

Check current authentication status.

```bash
python scripts/run.py auth_manager.py status
```

**Output:**
```
✓ Authenticated as: user@gmail.com
  Since: 2025-03-09T18:30:00
```

or

```
✗ Not authenticated

Run: python scripts/run.py auth_manager.py setup
```

#### `setup`

Initial authentication setup. Opens a browser window for manual Google login.

```bash
python scripts/run.py auth_manager.py setup
```

**What happens:**
1. Opens a browser window (visible)
2. Navigates to Google login
3. User manually completes OAuth flow
4. Saves authentication state

**Important:** Browser MUST be visible for manual login.

#### `reauth`

Re-authenticate with Google.

```bash
python scripts/run.py auth_manager.py reauth
```

Use when authentication expires or you want to switch accounts.

#### `clear`

Remove saved authentication credentials.

```bash
python scripts/run.py auth_manager.py clear
```

---

## notebook_manager.py

Manages the local library of NotebookLM notebooks.

### Commands

#### `add`

Add a new notebook to the library.

```bash
python scripts/run.py notebook_manager.py add \
  --url "https://notebooklm.google.com/notebook/ABC123" \
  --name "Project Documentation" \
  --description "Technical docs for my project" \
  --topics "docs,technical,project"
```

**Required parameters:**
- `--url` - Full NotebookLM URL
- `--name` - Display name
- `--description` - What the notebook contains
- `--topics` - Comma-separated topic tags

**Smart Add (discover content first):**

```bash
# Step 1: Discover content
python scripts/run.py ask_question.py \
  --question "What topics are covered in this notebook?" \
  --notebook-url "https://..."

# Step 2: Add with discovered info
python scripts/run.py notebook_manager.py add \
  --url "https://..." \
  --name "[Discovered name]" \
  --description "[Discovered description]" \
  --topics "[Discovered topics]"
```

#### `list`

List all notebooks in the library.

```bash
python scripts/run.py notebook_manager.py list
```

**Output:**
```
Notebooks (2):
============================================================

[abc123xyz] (active)
  Name: Project Documentation
  Description: Technical docs for my project
  Topics: docs, technical, project
  URL: https://notebooklm.google.com/notebook/abc123xyz

[def456uvw]
  Name: Research Notes
  Description: Academic research sources
  Topics: research, academic
  URL: https://notebooklm.google.com/notebook/def456uvw
```

#### `search`

Search notebooks by name, description, or topics.

```bash
python scripts/run.py notebook_manager.py search --query "docs"
```

**Output:**
```
Results for 'docs' (1 found):
============================================================

[abc123xyz]
  Name: Project Documentation
  Topics: docs, technical, project
```

#### `activate`

Set a notebook as the default for queries.

```bash
python scripts/run.py notebook_manager.py activate --id abc123xyz
```

After activation, you can query without specifying `--notebook-id`.

#### `remove`

Remove a notebook from the library.

```bash
python scripts/run.py notebook_manager.py remove --id abc123xyz
```

#### `stats`

Show library statistics.

```bash
python scripts/run.py notebook_manager.py stats
```

**Output:**
```
Library Statistics:
========================================
Total notebooks: 5

Top topics:
  docs: 3
  research: 2
  technical: 2
```

---

## ask_question.py

Ask questions to NotebookLM notebooks.

### Commands

#### Basic query

Ask a question using the active notebook:

```bash
python scripts/run.py ask_question.py --question "What is the main topic?"
```

#### Query specific notebook

```bash
python scripts/run.py ask_question.py \
  --question "Summarize the key points" \
  --notebook-id abc123xyz
```

#### Query with URL directly

```bash
python scripts/run.py ask_question.py \
  --question "What does this say about X?" \
  --notebook-url "https://notebooklm.google.com/notebook/abc123xyz"
```

#### Debug mode

Show the browser window:

```bash
python scripts/run.py ask_question.py \
  --question "..." \
  --show-browser
```

### Follow-Up Pattern

Every NotebookLM answer ends with:

> **EXTREMELY IMPORTANT: Is that ALL you need to know?**

**Required behavior:**

1. **STOP** - Don't immediately respond to user
2. **ANALYZE** - Did the answer fully address the question?
3. **IDENTIFY GAPS** - What information is missing?
4. **ASK FOLLOW-UP** - If gaps exist, ask another question
5. **REPEAT** - Continue until complete
6. **SYNTHESIZE** - Combine all answers for the user

---

## cleanup_manager.py

Clean up temporary data and browser state.

### Commands

#### Preview cleanup

See what would be deleted:

```bash
python scripts/run.py cleanup_manager.py
```

**Output:**
```
Cleanup Preview:
============================================================

Browser state: 2.3 MB
  /path/to/data/browser_state

Cache files: 156.0 KB
  temp.cache

Total to clean: 2.5 MB

✓ Notebook library will be preserved
```

#### Execute cleanup

Actually delete files:

```bash
python scripts/run.py cleanup_manager.py --confirm
```

#### Cleanup everything (including library)

```bash
python scripts/run.py cleanup_manager.py --confirm --no-preserve-library
```

**Warning:** This removes your notebook library. Use only for full reset.

---

## Data Files

### `data/library.json`

Stores notebook metadata:

```json
{
  "abc123xyz": {
    "id": "abc123xyz",
    "url": "https://notebooklm.google.com/notebook/abc123xyz",
    "name": "Project Documentation",
    "description": "Technical docs",
    "topics": ["docs", "technical"],
    "added_at": "2025-03-09T18:30:00"
  }
}
```

### `data/auth_info.json`

Stores authentication state:

```json
{
  "authenticated": true,
  "email": "user@gmail.com",
  "timestamp": "2025-03-09T18:30:00"
}
```

### `data/active_notebook.txt`

Contains the ID of the currently active notebook:

```
abc123xyz
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (invalid input, file not found, etc.) |
