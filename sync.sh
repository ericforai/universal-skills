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

    # 清空并重新创建目标目录
    rm -rf "$target"
    mkdir -p "$target"

    # 复制所有 universal-skills 到 Codex
    local skill_count=0

    # 遍历所有 categories 下的 skills (包含 SKILL.md 的目录)
    # 注意: 不使用结尾的 / 以复制整个目录
    for skill_dir in "$UNIVERSAL_SKILLS/categories"/*/*; do
        if [ -d "$skill_dir" ] && [ -f "$skill_dir/SKILL.md" ]; then
            local skill_name="$(basename "$skill_dir")"
            # 使用 rsync 或 cp 来复制整个目录
            cp -r "$skill_dir" "$target/$skill_name"
            skill_count=$((skill_count + 1))
            log "  → $skill_name"
        fi
    done

    # 处理顶层 skills (如 security-review)
    for skill_dir in "$UNIVERSAL_SKILLS/categories"/*; do
        if [ -d "$skill_dir" ] && [ -f "$skill_dir/SKILL.md" ]; then
            local skill_name="$(basename "$skill_dir")"
            # 避免重复复制
            if [ ! -d "$target/$skill_name" ]; then
                cp -r "$skill_dir" "$target/$skill_name"
                skill_count=$((skill_count + 1))
                log "  → $skill_name"
            fi
        fi
    done

    success "Codex skills 已同步 ($skill_count 个技能)"
}

# 同步到项目级 skills（为 Gemini/Gemini in projects）
sync_projects() {
    local synced_count=0

    # 需要同步的项目列表
    local projects=(
        "$HOME/clawd"
        "$HOME/clawd-work"
        "$HOME/nexusarchive"
        "$HOME/everything-claude-code"
        "$HOME/JLAF"
        "$HOME/PLM"
        "$HOME/zhitoujianli"
        "$HOME/liujie"
    )

    for project_dir in "${projects[@]}"; do
        if [ ! -d "$project_dir" ]; then
            continue
        fi

        local project_name="$(basename "$project_dir")"
        local skills_dir="$project_dir/skills"

        # 检查项目是否有 skills 目录
        if [ ! -d "$skills_dir" ]; then
            continue
        fi

        # 创建 universal-skills symlink
        local symlink="$skills_dir/universal-skills"

        # 删除旧的 symlink 或文件
        if [ -L "$symlink" ]; then
            rm -f "$symlink"
        elif [ -e "$symlink" ]; then
            warn "$project_name: universal-skills 是目录，跳过"
            continue
        fi

        # 创建 symlink
        ln -sf "$UNIVERSAL_SKILLS/categories" "$symlink"
        log "✓ $project_name: universal-skills symlink 已创建"
        synced_count=$((synced_count + 1))
    done

    if [ $synced_count -gt 0 ]; then
        success "已同步 $synced_count 个项目的 universal-skills symlink"
    else
        log "未找到需要同步的项目"
    fi
}

# 同步到 Gemini
sync_gemini() {
    if ! command -v gemini &> /dev/null; then
        warn "Gemini CLI 未安装，跳过"
        return
    fi

    local extension_dir="$UNIVERSAL_SKILLS/gemini-extension/universal-skills"

    # 确保 gemini-extension.json 存在
    if [ ! -f "$extension_dir/gemini-extension.json" ]; then
        warn "Gemini extension 配置缺失，跳过"
        return
    fi

    # 检查是否已安装
    if gemini extensions list 2>/dev/null | grep -q "universal-skills"; then
        log "Gemini extension 已安装"
    else
        log "安装 Gemini extension..."
        echo "Y" | gemini extensions link "$extension_dir" > /dev/null 2>&1 || true
    fi

    success "Gemini extension 已就绪"
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
echo "已同步的工具："
echo "  ✓ Claude Code (~/.claude/skills/)"
echo "  ✓ Codex (~/.codex/skills/)"
echo "  ✓ Gemini CLI (extension + project symlinks)"
echo "  ✓ 项目级 (clawd, nexusarchive, etc.)"
