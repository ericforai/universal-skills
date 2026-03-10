#!/bin/bash
# Continuous Learning v2 - Foreground Observer Loop

set +e
unset CLAUDECODE

SLEEP_PID=""
USR1_FIRED=0

cleanup() {
  [ -n "$SLEEP_PID" ] && kill "$SLEEP_PID" 2>/dev/null
  if [ -f "$PID_FILE" ] && [ "$(cat "$PID_FILE" 2>/dev/null)" = "$$" ]; then
    rm -f "$PID_FILE"
  fi
  exit 0
}
trap cleanup TERM INT

analyze_observations() {
  if [ ! -f "$OBSERVATIONS_FILE" ]; then
    return
  fi

  obs_count=$(wc -l < "$OBSERVATIONS_FILE" 2>/dev/null || echo 0)
  if [ "$obs_count" -lt "$MIN_OBSERVATIONS" ]; then
    return
  fi

  echo "[$(date)] Analyzing $obs_count observations for project ${PROJECT_NAME}..." >> "$LOG_FILE"

  if command -v claude >/dev/null 2>&1; then
    exit_code=0
    observations_content=$(python3 - "$OBSERVATIONS_FILE" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
    text = path.read_text(encoding="utf-8")
except Exception as exc:
    print(f"<<READ_ERROR:{exc}>>")
    sys.exit(0)

# Keep prompt size bounded while still providing enough evidence.
print(text[:120000])
PY
)
    claude --model haiku --max-turns 8 --print \
      "Analyze these observations for project ${PROJECT_NAME}.
Goal: identify only clear repeated project-specific patterns from user corrections, error resolutions, repeated workflows, or tool preferences.
If and only if you find a pattern with 3+ occurrences, create or update exactly one instinct file in $INSTINCTS_DIR/<id>.md.
If there is no clear pattern, output a short explanation and create no file.

Observations content:
$observations_content

Every instinct file must use this exact format:

---
id: kebab-case-name
trigger: \"when <specific condition>\"
confidence: <0.3-0.85 based on frequency: 3-5 times=0.5, 6-10=0.7, 11+=0.85>
domain: <one of: code-style, testing, git, debugging, workflow, file-patterns>
source: session-observation
scope: project
project_id: ${PROJECT_ID}
project_name: ${PROJECT_NAME}
---

# Title

## Action
<what to do, one clear sentence>

## Evidence
- Observed N times in session <id>
- Pattern: <description>
- Last observed: <date>

Rules:
- Be conservative, only clear patterns with 3+ observations
- Use narrow, specific triggers
- Never include actual code snippets, only describe patterns
- If a similar instinct already exists in $INSTINCTS_DIR/, update it instead of creating a duplicate
- The YAML frontmatter (between --- markers) with id field is MANDATORY
- If a pattern seems universal (not project-specific), set scope to global instead of project
- Examples of global patterns: always validate user input, prefer explicit error handling
- Examples of project patterns: use React functional components, follow Django REST framework conventions" \
      >> "$LOG_FILE" 2>&1 || exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
      echo "[$(date)] Claude analysis failed (exit $exit_code)" >> "$LOG_FILE"
    fi
  else
    echo "[$(date)] claude CLI not found, skipping analysis" >> "$LOG_FILE"
  fi

  if [ -f "$OBSERVATIONS_FILE" ]; then
    archive_dir="${PROJECT_DIR}/observations.archive"
    mkdir -p "$archive_dir"
    mv "$OBSERVATIONS_FILE" "$archive_dir/processed-$(date +%Y%m%d-%H%M%S)-$$.jsonl" 2>/dev/null || true
  fi
}

on_usr1() {
  [ -n "$SLEEP_PID" ] && kill "$SLEEP_PID" 2>/dev/null
  SLEEP_PID=""
  USR1_FIRED=1
  analyze_observations
}
trap on_usr1 USR1

echo "$$" > "$PID_FILE"
echo "[$(date)] Observer started for ${PROJECT_NAME} (PID: $$)" >> "$LOG_FILE"

while true; do
  sleep "$OBSERVER_INTERVAL_SECONDS" &
  SLEEP_PID=$!
  wait $SLEEP_PID 2>/dev/null
  SLEEP_PID=""

  if [ "$USR1_FIRED" -eq 1 ]; then
    USR1_FIRED=0
  else
    analyze_observations
  fi
done
