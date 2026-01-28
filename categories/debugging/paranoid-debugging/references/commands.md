# Debugging Commands Quick Reference

## 前端

\`\`\`bash
npm run test:run              # 运行测试
npm run type-check            # 类型检查
npm run dev                   # 启动开发服务器
npx tsc --noEmit              # 静态类型检查
npx depcruise src/            # 依赖检查
\`\`\`

## 后端 (Java/Maven)

\`\`\`bash
mvn test                      # 运行测试
mvn test -Dtest=ClassName     # 运行特定测试类
mvn test -Dtest=ClassName#methodName  # 特定方法
mvn compile                   # 编译检查
mvn dependency:tree           # 依赖树
\`\`\`

## 数据库

\`\`\`bash
PGPASSWORD=postgres psql -h localhost -U postgres -d nexusarchive -c "SELECT ..."
\`\`\`

## Git

\`\`\`bash
git bisect start              # 开始二分定位
git bisect bad HEAD           # 标记当前版本为坏
git bisect good <commit>      # 标记已知好的版本
git log --oneline -10         # 查看最近提交
git diff                      # 查看变更
\`\`\`

## 进程/日志

\`\`\`bash
lsof -ti:19090                # 检查端口占用
docker logs nexus-backend-dev --tail 50  # 查看日志
docker ps                     # 容器状态
\`\`\`

## 网络

\`\`\`bash
curl -v http://localhost:19090/health  # 详细请求
curl -s http://localhost:19090/api/stats | jq .  # JSON 格式化
\`\`\`
