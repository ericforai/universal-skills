# Debug Report Template

使用此模板记录调试过程和结果。

\`\`\`markdown
## Debug Report: [Issue Title]

### A. Snapshot
- **Expected**: [描述期望行为]
- **Observed**: [描述实际行为]
- **Blast Radius**: [选择: 数据/安全/性能/成本/合规]
- **Reproducibility**: [100% / 偶发 / 未知]
- **Evidence**:
  \`\`\`bash
  # 复现命令/日志/栈信息
  \`\`\`

### B. First-Principles Decomposition
**Invariants**:
1. [不变量 1]
2. [不变量 2]

**Constraints**:
- [约束 1]
- [约束 2]

**Minimal Checkable Claims**:
1. [可验证命题 1]: 真/假
2. [可验证命题 2]: 真/假

### C. Q→A Loop

**Round 1**:
- **Q**: [最关键的不确定性问题]
- **A**: [基于现有证据的回答]
- **Test**: [验证命令/步骤]
- **Result**: [实际输出]
- **Decision**: [继续深挖/更换假设/开始修复]

### D. Fix Plan
- **Root Cause**: [因果链描述：A → B → C]
- **Fix**: [最小修复方案]
- **Risk**: [潜在风险 + 防护措施]
- **New Tests**: [需要添加的测试列表]

### E. Ship Gate
- **Verdict**: [PASS/FAIL]
- **理由**: [引用具体证据]
- **交付物**:
  - [ ] 复现脚本
  - [ ] PR/commit
  - [ ] 测试用例
  - [ ] 风险说明
\`\`\`
