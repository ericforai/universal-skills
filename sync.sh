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

    if [ -d "$target" ] && [ ! -L "$target" ]; then
        backup "$target"
        rm -rf "$target"
    fi

    # 重新创建目标目录
    mkdir -p "$target"

    # 复制整个 categories 内容到 target
    cp -r "$UNIVERSAL_SKILLS/categories"/* "$target/"

    success "Claude Code skills 已同步"
}

# 同步到 Codex
sync_codex() {
    local target="$HOME/.codex/skills"

    if [ -d "$target" ] && [ ! -L "$target" ]; then
        backup "$target"
    fi

    mkdir -p "$target"

    # 复制 Codex 兼容的 skills
    [ -d "$UNIVERSAL_SKILLS/categories/coding/tdd-workflow" ] && cp -r "$UNIVERSAL_SKILLS/categories/coding/tdd-workflow" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/coding/test-driven-development" ] && cp -r "$UNIVERSAL_SKILLS/categories/coding/test-driven-development" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/debugging/systematic-debugging" ] && cp -r "$UNIVERSAL_SKILLS/categories/debugging/systematic-debugging" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/refactoring/minimalist-refactorer" ] && cp -r "$UNIVERSAL_SKILLS/categories/refactoring/minimalist-refactorer" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/workflow/brainstorming" ] && cp -r "$UNIVERSAL_SKILLS/categories/workflow/brainstorming" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/workflow/writing-plans" ] && cp -r "$UNIVERSAL_SKILLS/categories/workflow/writing-plans" "$target/"
    [ -d "$UNIVERSAL_SKILLS/categories/workflow/verification-before-completion" ] && cp -r "$UNIVERSAL_SKILLS/categories/workflow/verification-before-completion" "$target/"

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

# 同步到 Gemini
sync_gemini() {
    if ! command -v gemini &> /dev/null; then
        warn "Gemini CLI 未安装，跳过"
        return
    fi

    local extension_dir="$UNIVERSAL_SKILLS/gemini-extension/universal-skills"

    if [ ! -d "$extension_dir" ]; then
        warn "Gemini extension 目录不存在，跳过"
        return
    fi

    # 检查是否已安装
    if gemini extensions list 2>/dev/null | grep -q "universal-skills"; then
        log "Gemini extension 已安装，更新中..."
        # gemini extensions update universal-skills 2>/dev/null || true
    else
        log "安装 Gemini extension..."
        # gemini extensions link "$extension_dir" 2>/dev/null || warn "Gemini extension 安装失败（需手动执行）"
    fi

    success "Gemini extension 准备就绪（运行 gemini extensions link $extension_dir 手动安装）"
}

# 同步到 Antigravity (通过 MCP)
sync_antigravity() {
    local mcp_config="$HOME/.gemini/mcp_config.json"

    if [ ! -f "$mcp_config" ]; then
        # 创建 MCP 配置目录
        mkdir -p "$(dirname "$mcp_config")"
        echo '{}' > "$mcp_config"
    fi

    # Antigravity 使用 annotations/brain 机制，不直接同步 skills
    # 这里只确保 MCP 配置存在，便于未来集成
    success "Antigravity MCP 配置已准备"
}

# 创建本地覆盖目录
mkdir -p "$UNIVERSAL_SKILLS/local"

log "开始同步 Universal Skills..."
echo ""

sync_claude
sync_codex
sync_gemini
sync_antigravity
sync_projects

echo ""
success "同步完成！"
echo ""
echo "提示："
echo "  - 本地自定义技能放在: $UNIVERSAL_SKILLS/local/"
echo "  - 备份位置: $BACKUP_DIR"
echo "  - 重启 AI Coding 工具以加载新 skills"
echo ""
echo "手动安装 Gemini extension:"
echo "  gemini extensions link $UNIVERSAL_SKILLS/gemini-extension/universal-skills"
