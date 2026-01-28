# Example: Paranoid Debugging in Action

完整示例展示如何使用偏执型调试流程解决档案状态不一致问题。

## A. Snapshot

- **Expected**: 用户提交档案后，状态变为 "已归档"
- **Observed**: 状态有时变为 "已归档"，有时保持 "处理中"（偶发，约 30%）
- **Blast Radius**: 数据一致性（档案可能丢失）
- **Reproducibility**: 偶发
- **Evidence**:
  \`\`\`bash
  # 日志显示事务提交但状态未更新
  2025-01-07 10:23:15 INFO  Transaction committed for archive_id=12345
  2025-01-07 10:23:16 DEBUG  Status update: UPDATE archives SET status='ARCHIVED' WHERE id=12345

  # 数据库查询显示 status='PROCESSING'
  psql> SELECT id, status FROM archives WHERE id=12345;
  id    | status
  -------+------------
  12345 | PROCESSING
  \`\`\`

## B. First-Principles Decomposition

**Invariants**:
1. 事务内所有操作要么全部成功，要么全部回滚
2. 状态更新必须在事务提交前完成
3. 异步操作不能阻塞主事务
4. 查询看到的必须是已提交的状态

**Constraints**:
- PostgreSQL 隔离级别：READ_COMMITTED
- 并发提交可能存在（多用户同时操作）
- 状态更新通过异步队列
- 查询可能在异步执行前发生

**Minimal Checkable Claims**:
1. 状态更新语句在主事务内执行：待验证
2. 异步队列在事务提交前完成：待验证
3. 并发场景存在竞态条件：待验证

## C. Q→A Loop

**Round 1**:
- **Q**: 状态更新是否在主事务内执行？
- **A**: 需要验证代码
- **Test**: 检查 ArchiveService 代码
  \`\`\`bash
  grep -n "status.*update" nexusarchive-java/src/main/java/com/nexusarchive/service/impl/ArchiveServiceImpl.java
  \`\`\`
- **Result**: 状态更新通过 `@Async` 方法，不在主事务内
- **Decision**: 更换假设 — 检查异步队列执行顺序

**Round 2**:
- **Q**: 异步队列是否可能晚于查询执行？
- **A**: 是的，异步队列无顺序保证
- **Test**: 添加集成测试验证
  \`\`\`bash
  # 并发提交 10 个档案，检查最终状态
  npm run test:concurrent-archive
  \`\`\`
- **Result**: 测试显示 3/10 失败，status 未更新
- **Decision**: 开始修复 — 将状态更新移入主事务

## D. Fix Plan

- **Root Cause**: 异步状态更新在事务提交后执行，查询时可能尚未完成
- **Fix**: 将状态更新从异步队列移入主事务
- **Risk**: 事务时间增加 → 监控事务时长，必要时拆分
- **New Tests**:
  - 并发提交测试（10 个并发）
  - 状态一致性验证
  - 事务时长监控

## E. Ship Gate

- **Verdict**: [PASS]

- **理由**:
  - 新测试全部通过（100/100）✓
  - 并发测试验证无竞态 ✓
  - 事务时长在可接受范围（< 100ms）✓
  - 回归测试通过 ✓

- **交付物**:
  - [x] PR: #123
  - [x] 测试: ArchiveServiceConcurrencyTest.java
  - [x] 复现脚本: test_concurrent_archive.sh
  - [x] 监控: 添加 transaction_duration 指标
