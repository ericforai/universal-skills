# 🎯 Universal Skills 技能收集汇总报告

> 生成时间: 2025-03-09
> 目的: 将 Universal Skills 设为唯一技能中心

---

## 📊 统计概览

| 位置 | 技能数量 | 状态 |
|------|:--------:|------|
| Claude Code (~/.claude/skills/) | 30 | 🟢 |
| Codex (~/.codex/skills/) | 29 | 🟢 |
| Universal Skills (categories/) | 29 | 🟡 待同步 |

---

## 🆕 新增技能（1个）

### product-analysis
- **来源**: Claude Code
- **类别**: `workflow/`
- **描述**: 产品经理专用技能 - 竞品分析、RICE评分、Kano模型、用户画像、PRD撰写
- **建议路径**: `categories/workflow/product-analysis/`

---

## 🔄 需要更新的技能（5个）

以下技能在 Claude Code 中有更新版本：

| 技能 | Claude 版本 | Universal 版本 | 状态 |
|------|-------------|----------------|------|
| self-verifying-tests | 2026-03-07 | 2026-02-12 | ⚠️ 需同步 |
| minimalist-refactorer | 2026-03-07 | 2026-02-12 | ⚠️ 需同步 |
| entropy-reduction | 2026-03-07 | 2026-02-12 | ⚠️ 需同步 |
| root-cause-hunter | 2026-03-07 | 2026-02-12 | ⚠️ 需同步 |
| architecture-defense | 2026-03-07 | 2026-02-12 | ⚠️ 需同步 |

---

## ✅ 已同步技能（23个）

### architecture/
- architecture-defense ⚠️ 有更新

### coding/
- tdd-workflow ✅
- test-driven-development ✅
- self-verifying-tests ⚠️ 有更新

### debugging/
- systematic-debugging ✅
- paranoid-debugging ✅
- root-cause-hunter ⚠️ 有更新

### refactoring/
- entropy-reduction ⚠️ 有更新
- minimalist-refactorer ⚠️ 有更新

### security-review/
- security-review ✅

### ui-ux/
- frontend-design ✅
- ui-ux-pro-max ✅

### workflow/
- brainstorming ✅
- writing-plans ✅
- executing-plans ✅
- standard-workflow ✅
- verification-before-completion ✅
- skill-creator ✅
- skill-installer ✅
- using-git-worktrees ✅
- using-superpowers ✅
- subagent-driven-development ✅
- dispatching-parallel-agents ✅
- receiving-code-review ✅
- requesting-code-review ✅
- finishing-a-development-branch ✅

---

## 📋 执行清单

### 步骤 1: 导入新增技能
```bash
cp -r ~/.claude/skills/product-analysis ~/universal-skills/categories/workflow/
```

### 步骤 2: 同步更新的技能
```bash
# self-verifying-tests
cp -r ~/.claude/skills/coding/self-verifying-tests ~/universal-skills/categories/coding/

# minimalist-refactorer
cp -r ~/.claude/skills/refactoring/minimalist-refactorer ~/universal-skills/categories/refactoring/

# entropy-reduction
cp -r ~/.claude/skills/refactoring/entropy-reduction ~/universal-skills/categories/refactoring/

# root-cause-hunter
cp -r ~/.claude/skills/debugging/root-cause-hunter ~/universal-skills/categories/debugging/

# architecture-defense
cp -r ~/.claude/skills/architecture/architecture-defense ~/universal-skills/categories/architecture/
```

### 步骤 3: 运行同步脚本
```bash
cd ~/universal-skills
./sync.sh
```

### 步骤 4: 提交到 git
```bash
git add -A
git commit -m "feat: sync skills from Claude Code - add product-analysis and update 5 skills"
git push
```

---

## 📝 同步后状态

执行以上步骤后，Universal Skills 将包含 **30 个技能**，成为唯一真实来源。

后续工作流：
```
1. 在 universal-skills/categories/ 中编辑技能
2. 运行 ./sync.sh
3. 各工具自动获取更新
```
