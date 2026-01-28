# Universal Skills Extension for Gemini CLI

为 Gemini CLI 提供 Universal Skills 访问能力。

## 安装

```bash
# 从本地路径安装
cd ~/universal-skills/gemini-extension/universal-skills
gemini extensions link .

# 或从 GitHub 安装
gemini extensions install https://github.com/ericforai/universal-skills.git
```

## 使用

在 Gemini CLI 中：

```
# 列出所有可用 skills
/universal-skills.list

# 获取特定 skill 内容
/universal-skills.get coding tdd-workflow

# 搜索 skills
/universal-skills.search "debugging"
```

## 可用 Skills

- **coding**: TDD, coding standards, patterns
- **debugging**: systematic, paranoid debugging
- **refactoring**: minimalist refactorer
- **workflow**: brainstorming, planning

## 目录结构

Skills 存储在 `~/universal-skills/categories/`，此扩展读取该目录。
