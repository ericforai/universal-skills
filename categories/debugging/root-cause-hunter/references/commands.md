# 根因猎手 - 命令速查

## Java/Spring Boot

### 日志追踪
```bash
# 查看最近日志
tail -f logs/application.log

# 搜索特定异常
grep -A 10 "NullPointerException" logs/application.log

# 查看特定请求的完整链路
grep "requestId=xxx" logs/application.log
```

### 数据库检查
```sql
-- 检查数据一致性
SELECT * FROM table WHERE id = 'xxx';

-- 检查外键引用
SELECT * FROM child WHERE parent_id NOT IN (SELECT id FROM parent);
```

### JVM 状态
```bash
# 线程dump
jstack <pid> > thread_dump.txt

# 堆dump
jmap -dump:format=b,file=heap.bin <pid>
```

---

## React/TypeScript

### 组件状态调试
```javascript
// 在关键位置添加
console.log('[DEBUG ComponentName]', { propName, stateValue });

// 使用 React DevTools
// 浏览器扩展 → React → 选中组件查看 props/state
```

### 网络请求追踪
```javascript
// 在 axios interceptor 中添加
axios.interceptors.request.use(config => {
  console.log('[API Request]', config.method, config.url, config.data);
  return config;
});

axios.interceptors.response.use(
  response => console.log('[API Response]', response.status, response.data),
  error => console.error('[API Error]', error.config.url, error.response?.data)
);
```

---

## 数据库通用

### PostgreSQL
```sql
-- 查看锁等待
SELECT * FROM pg_stat_activity WHERE wait_event = 'Lock';

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- 检查表大小
SELECT pg_size_pretty(pg_total_relation_size('table_name'));
```

---

## 网络/抓包

```bash
# 检查端口监听
netstat -tulpn | grep <port>

# 抓包分析
tcpdump -i any -nn 'tcp port 8080' -w capture.pcap

# 检查 DNS 解析
nslookup <hostname>
dig <hostname>
```

---

## Git 操作

```bash
# 查找引入 bug 的提交
git bisect start
git bisect bad HEAD
git bisect good <good-commit-hash>
# Git 会自动定位到问题提交

# 查看特定行的历史
git log -p --all -S 'problematic_string'
```

---

## 缓存检查

### Redis
```bash
# 检查 key 是否存在
redis-cli GET <key>

# 查看所有匹配的 key
redis-cli KEYS "*pattern*"

# 清空特定 key
redis-cli DEL <key>
```
