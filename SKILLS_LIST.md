# Universal Skills 完整列表

**最后更新:** 2026-01-28

**仓库:** https://github.com/ericforai/universal-skills

---

## 📊 统计

| 类别 | 数量 |
|------|------|
| architecture | 2 |
| coding | 6 |
| debugging | 3 |
| refactoring | 2 |
| tools | 0 |
| workflow | 4 |
| **总计** | **17** |

---

## 📁 详细列表

### 🏗️ architecture

| Skill | 说明 |
|-------|------|
| **architecture-defense** | 架构防御，依赖约束，模块清单。使用 dependency-cruiser、ArchUnit 进行运行时架构自省 |
| **strategic-compact** | 战略性上下文压缩 |

---

### 💻 coding

| Skill | 说明 |
|-------|------|
| **backend-patterns.md** | 后端开发模式指南 |
| **coding-standards.md** | 通用编码规范 |
| **frontend-patterns.md** | 前端开发模式指南 |
| **self-verifying-tests** | 自验证测试，替代传统的"点击检查"测试 |
| **tdd-workflow** | 测试驱动开发工作流 (80%+ 覆盖率) |
| **test-driven-development** | TDD 实践指南 |

---

### 🐛 debugging

| Skill | 说明 |
|-------|------|
| **paranoid-debugging** | 偏执型调试，用于生产关键代码的严格验证 |
| **root-cause-hunter** | 根因分析，定位"零号病人"代码 |
| **systematic-debugging** | 系统化调试方法论，处理任何 bug 或意外行为 |

---

### 🔧 refactoring

| Skill | 说明 |
|-------|------|
| **entropy-reduction** | 熵减，模块化设计，处理循环依赖和过度工程 |
| **minimalist-refactorer** | 极简重构，降低复杂度，代码简化 |

---

### 🛠️ tools

*(空 - 待添加)*

---

### 📋 workflow

| Skill | 说明 |
|-------|------|
| **brainstorming** | 头脑风暴，创意工作前置探索 |
| **continuous-learning** | 持续学习，自动从会话中提取可复用模式 |
| **verification-before-completion** | 完成前验证，证据优先于断言 |
| **writing-plans** | 编写实现计划，在写代码之前 |

---

## 🔍 使用方式

### Claude Code / Codex
```bash
# 直接引用技能
"使用 tdd-workflow 来实现这个功能"
"用 systematic-debugging 分析这个 bug"
```

### Gemini CLI
```bash
# 在项目目录中运行
gemini "使用 universal-skills 中的 paranoid-debugging"
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

*自动生成于 2026-01-28*
