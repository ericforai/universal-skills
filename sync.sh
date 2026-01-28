#!/bin/bash
# Universal Skills 同步脚本
# 用于将 ~/universal-skills 同步到各 AI Coding 工具

set -e

UNIVERSAL_SKILLS="$HOME/universal-skills"
BACKUP_DIR="$UNIVERSAL_SKILLS/.backup"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 创建备份
backup() {
    local dir="$1"
    if [ -d "$dir" ] && [ ! -L "$dir" ]; then
        mkdir -p "$BACKUP_DIR"
        local backup_name="$(basename "$dir")-$(date +%Y%m%d-%H%M%S)"
        log "备份 $dir 到 $BACKUP_DIR/$backup_name"
        cp -R "$dir" "$BACKUP_DIR/$backup_name"
    fi
}

# 同步到 Claude Code
sync_claude() {
    local target="$HOME/.claude/skills"

    if [ -d "$target" ]; then
        backup "$target"
        rm -rf "$target"
    fi

    mkdir -p "$(dirname "$target")"
    ln -sf "$UNIVERSAL_SKILLS/categories/coding" "$target/coding"
    ln -sf "$UNIVERSAL_SKILLS/categories/debugging" "$target/debugging"
    ln -sf "$UNIVERSAL_SKILLS/categories/refactoring" "$target/refactoring"
    ln -sf "$UNIVERSAL_SKILLS/categories/architecture" "$target/architecture"
    ln -sf "$UNIVERSAL_SKILLS/categories/tools" "$target/tools"
    ln -sf "$UNIVERSAL_SKILLS/categories/workflow" "$target/workflow"

    # 复制 markdown 文件（顶级）
    find "$UNIVERSAL_SKILLS/categories" -name "*.md" -maxdepth 2 -exec cp {} "$target/" \; 2>/dev/null || true

    success "Claude Code skills 已同步"
}

# 同步到 Codex
sync_codex() {
    local target="$HOME/.codex/skills"

    if [ -d "$target" ]; then
        backup "$target"
        rm -rf "$target"
    fi

    mkdir -p "$target"
    ln -sf "$UNIVERSAL_SKILLS/categories/coding/tdd-workflow" "$target/tdd-workflow"
    ln -sf "$UNIVERSAL_SKILLS/categories/debugging/systematic-debugging" "$target/systematic-debugging"
    ln -sf "$UNIVERSAL_SKILLS/categories/refactoring/minimalist-refactorer" "$target/minimalist-refactorer"

    success "Codex skills 已同步"
}

# 同步到项目级 .claude/skills
sync_projects() {
    # 扫描用户目录下的项目
    for project_dir in "$HOME"/*; do
        if [ -d "$project_dir/.claude/skills" ]; then
            log "发现项目: $(basename "$project_dir")"
            # 可选：同步到项目级 skills
        fi
    done
}

# 创建本地覆盖目录
mkdir -p "$UNIVERSAL_SKILLS/local"

log "开始同步 Universal Skills..."
echo ""

sync_claude
sync_codex
sync_projects

echo ""
success "同步完成！"
echo ""
echo "提示："
echo "  - 本地自定义技能放在: $UNIVERSAL_SKILLS/local/"
echo "  - 备份位置: $BACKUP_DIR"
echo "  - 重启 AI Coding 工具以加载新 skills"
