# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal Skills is a unified AI coding skills repository that synchronizes across multiple AI development tools:
- **Claude Code** (`~/.claude/skills/`)
- **Codex** (`~/.codex/skills/`)
- **Gemini CLI** (via MCP extension and project symlinks)

Skills are modular, self-contained folders that extend AI capabilities with specialized knowledge, workflows, and tool integrations.

## Commands

### Sync Skills to All Tools
```bash
./sync.sh
```

This script:
1. Copies `categories/` contents to `~/.claude/skills/`
2. Copies each skill (with `SKILL.md`) to `~/.codex/skills/`
3. Creates symlinks in configured projects (`clawd`, `nexusarchive`, etc.)
4. Manages Gemini extension and MCP configuration

**Run after:** Adding new skills, modifying existing skills, or pulling updates.

### Test a Skill's Search Function (ui-ux-pro-max)
```bash
python3 categories/ui-ux/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
python3 categories/ui-ux/ui-ux-pro-max/scripts/search.py "<query>" --design-system [-p "Project Name"]
```

### Initialize a New Skill
```bash
python3 categories/.system/skill-creator/scripts/init_skill.py <skill-name>
```

## Directory Structure

```
categories/
├── .system/              # Meta-tools (skill-creator, skill-installer)
├── architecture/         # Architecture patterns (defense, strategic planning)
├── coding/              # Development patterns (TDD, standards, patterns)
├── debugging/           # Debugging methodologies (systematic, root-cause)
├── refactoring/         # Refactoring practices (entropy reduction)
├── security-review/     # Security review checklist
├── ui-ux/              # Frontend design (frontend-design, ui-ux-pro-max)
└── workflow/           # Development workflows (brainstorming, plans, TDD)

local/                  # Local overrides (gitignored)
skills/                 # Legacy directory (deprecated, use categories/)
```

## Skill Anatomy

Every skill follows this structure:

```
skill-name/
├── SKILL.md                    # Required: Frontmatter + instructions
│   ├── YAML frontmatter        # name, description (triggers)
│   └── Markdown body           # Instructions loaded after trigger
├── skill-metadata.yml          # Optional: Platform compatibility, triggers
├── agents/
│   └── openai.yaml            # Recommended: UI metadata for skill lists
├── scripts/                    # Optional: Executable code (Python/Bash)
├── references/                 # Optional: Documentation to load as needed
└── data/                       # Optional: Data files (CSV, JSON, etc.)
```

### SKILL.md Frontmatter (Required)

```yaml
---
name: skill-name
description: Use when [clear trigger conditions]. Describe what the skill does.
---
```

**Critical:** The `description` field determines when AI tools invoke the skill. Be explicit about trigger conditions.

### Optional Resources

- **`scripts/`** - Executable code for tasks requiring deterministic reliability or repeated rewriting
- **`references/`** - Documentation loaded into context as needed
- **`data/`** - Structured data files (CSV, JSON) for skill operations
- **`skill-metadata.yml`** - Platform compatibility, tool dependencies, trigger keywords

## Skill Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `architecture/` | System design, constraints | architecture-defense |
| `coding/` | Development patterns | tdd-workflow, self-verifying-tests |
| `debugging/` | Debugging methodologies | systematic-debugging, root-cause-hunter |
| `refactoring/` | Code cleanup | entropy-reduction, minimalist-refactorer |
| `ui-ux/` | Frontend design | ui-ux-pro-max, frontend-design |
| `workflow/` | Process management | brainstorming, writing-plans, skill-creator |

## Local Overrides

The `local/` directory allows per-machine skill customization:

1. Create `local/<skill-name>/SKILL.md`
2. It will override the version in `categories/`
3. `local/` is gitignored

## Key Architectural Patterns

### ui-ux-pro-max

Contains Python-based search engine with BM25 ranking:
- **Data files:** `styles.csv`, `colors.csv`, `typography.csv`, `ux-guidelines.csv`
- **Scripts:** `search.py`, `design_system.py`, `core.py`
- **Usage:** Search across 50+ styles, 97 palettes, 57 fonts, 99 UX guidelines

### self-verifying-tests

Manifest-driven test generation with cross-layer validation:
- **Generators:** `manifest-scanner.ts`, `playwright-generator.ts`
- **Validators:** `shadow-inspector.ts`, `doc-integrity.ts`
- **Four layers:** Manifest-driven, Shadow Inspector (UI/DB), FSM state testing, Doc-code integrity

### skill-creator

Meta-tool for creating new skills with:
- `init_skill.py` - Scaffold new skill structure
- `generate_openai_yaml.py` - Generate agents/openai.yaml metadata
- `quick_validate.py` - Validate skill structure

## Adding New Skills

1. Create skill directory in appropriate `categories/` subdirectory
2. Add `SKILL.md` with clear frontmatter (`name`, `description`)
3. (Optional) Add `skill-metadata.yml` for platform compatibility
4. (Optional) Create `agents/openai.yaml` for UI metadata
5. Run `./sync.sh` to propagate to all tools
6. Commit and push

## Sync Script Details

The `sync.sh` script handles:
- **Claude Code:** Full copy of `categories/` to `~/.claude/skills/`
- **Codex:** Flat copy of all skills (deduplicated by name) to `~/.codex/skills/`
- **Projects:** Creates `universal-skills` symlinks in configured projects
- **Backups:** Stores backups in `.backup/` before overwriting

## File Naming Conventions

- Skills: `kebab-case` directory names
- SKILL.md: Always exactly `SKILL.md` (uppercase)
- Scripts: `snake_case.py` for Python
- Data files: `kebab-case.csv` for structured data
