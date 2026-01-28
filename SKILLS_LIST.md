# Universal Skills 完整列表

**最后更新:** 2026-01-28 14:15

**仓库:** https://github.com/ericforai/universal-skills

---

## 📊 统计

| 类别 | 数量 |
|------|:----:|
| architecture | 2 |
| coding | 6 |
| debugging | 3 |
| refactoring | 2 |
| security | 1 |
| ui-ux | 1 |
| workflow | 4 |
| **总计** | **19** |

---

## 📁 详细列表

### 🏗️ architecture

| Skill | 说明 |
|-------|------|
| **architecture-defense** | 架构防御，依赖约束，模块清单。使用 dependency-cruiser、ArchUnit |
| **strategic-compact** | 战略性上下文压缩 |

---

### 💻 coding

| Skill | 说明 |
|-------|------|
| **backend-patterns.md** | 后端开发模式指南 |
| **coding-standards.md** | 通用编码规范 |
| **frontend-patterns.md** | 前端开发模式指南 |
| **self-verifying-tests** | 自验证测试，替代传统"点击检查" |
| **tdd-workflow** | 测试驱动开发工作流 (80%+ 覆盖率) |
| **test-driven-development** | TDD 实践指南 |

---

### 🐛 debugging

| Skill | 说明 |
|-------|------|
| **paranoid-debugging** | 偏执型调试，生产关键代码的严格验证 |
| **root-cause-hunter** | 根因分析，定位"零号病人"代码 |
| **systematic-debugging** | 系统化调试方法论 |

---

### 🔧 refactoring

| Skill | 说明 |
|-------|------|
| **entropy-reduction** | 熵减，模块化设计，处理循环依赖 |
| **minimalist-refactorer** | 极简重构，降低复杂度 |

---

### 🔒 security

| Skill | 说明 |
|-------|------|
| **security-review** | 安全审查，处理认证、用户输入、API、密钥等 |

---

### 🎨 ui-ux

| Skill | 说明 |
|-------|------|
| **frontend-design** | 创建高质量前端界面，避免通用 AI 美学 |

---

### 📋 workflow

| Skill | 说明 |
|-------|------|
| **brainstorming** | 头脑风暴，创意工作前置探索 |
| **continuous-learning** | 持续学习，提取可复用模式 |
| **verification-before-completion** | 完成前验证 |
| **writing-plans** | 编写实现计划 |

---

## 🔍 使用方式

### Claude Code / Codex
```bash
"使用 frontend-design 创建这个页面"
"用 security-review 审查这段代码"
```

### Gemini CLI
```bash
gemini "使用 universal-skills 中的 security-review"
```

### 各工具路径
| 工具 | Skills 位置 |
|------|-------------|
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |
| Gemini | 项目 `skills/universal-skills/` symlink |

---

## 📝 添加新 Skill

1. 放到 `~/universal-skills/categories/` 对应目录
2. 提交并推送
3. 运行 `./sync.sh` 同步

---

## 📦 Everything Claude Code Skills 来源

以下 4 个 skills 来自 `everything-claude-code` 项目：

| Skill | 原位置 | 当前状态 |
|-------|--------|----------|
| **continuous-learning** | `skills/continuous-learning/` | ✅ 已同步 |
| **security-review** | `skills/security-review/` | ✅ 已添加 |
| **strategic-compact** | `skills/strategic-compact/` | ✅ 已同步 |
| **tdd-workflow** | `skills/tdd-workflow/` | ✅ 已同步 |

---

*自动生成于 2026-01-28*
