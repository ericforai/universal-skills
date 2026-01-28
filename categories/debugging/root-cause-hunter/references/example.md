# 根因猎手 - 完整示例

## Bug 现象

**症状**：点击"预归档单据池"页面，选择"银行回单"类型后，列表为空，但数据库中明明有数据。

**复现步骤**：
1. 登录系统
2. 进入"预归档单据池"
3. 点击"银行回单"类型筛选
4. 列表显示为空

**环境**：
- 后端：Spring Boot 3.1.6
- 前端：React 19.2
- 数据库：PostgreSQL 14

---

## 1. 现场还原

### 症状素描
> 用户选择"银行回单"类型后，前端 API 返回空数组，但数据库中存在 `doc_type='BANK_RECEIPT'` 的记录。

### 边界划定
> - 全宗已分配（BR01）
> - 用户有查看权限
> - 其他类型（如"增值税发票"）显示正常

### 思维沙箱
> 需要获取：后端实际接收到的查询参数是什么？

---

## 2. 剥洋葱：逆向调用链

### Layer 3 (IO/数据层)

| 检查项 | 预期 | 实际 | 偏差 |
|--------|------|------|------|
| SQL 执行 | 查询 BANK_RECEIPT | 查询 BANK_SLIP | 类型代码不匹配！|
| 结果集 | 非空 | 空集 | 无匹配记录 |

### Layer 2 (核心逻辑层)

**调用链追踪**：
```
前端: fetchVouchers({ type: 'BANK_RECEIPT' })
   ↓
API: /api/vouchers?type=BANK_RECEIPT
   ↓
Controller: getVouchers(@RequestParam String type)
   ↓
Service: 类型转换 BANK_RECEIPT → BANK_SLIP (遗产代码!)
   ↓
Mapper: WHERE doc_type = 'BANK_SLIP'
   ↓
数据库: 无匹配记录 → 空结果
```

**分叉点**：`VoucherService.java:87` - getTypeAlias() 方法

### Layer 1 (入口/参数层)

| 参数 | 预期 | 实际 | 来源 |
|------|------|------|------|
| type | BANK_RECEIPT | BANK_RECEIPT | 前端传入 |
| 转换后 | BANK_RECEIPT | BANK_SLIP | getTypeAlias() |

---

## 3. 零号病人定位

### 第一行错误

```java
// VoucherService.java:87
private String normalizeType(String type) {
    // 🔴 问题：为了兼容旧版前端，强制转换新类型代码
    if ("BANK_RECEIPT".equals(type)) {
        return "BANK_SLIP";  // 这是万恶之源！
    }
    return type;
}
```

### 必然性解释

```
1. 前端发送 type=BANK_RECEIPT（新类型代码）
2. 后端 normalizeType() 强制转换为 BANK_SLIP（旧代码）
3. 数据库中实际存储的是 BANK_RECEIPT（新数据）
4. SQL: WHERE doc_type = 'BANK_SLIP' 找不到匹配
5. 返回空集

必然为空：因为新旧代码不匹配，查询永远找不到数据
```

### 状态变迁图

```
前端: type='BANK_RECEIPT'
         ↓
    normalizeType()
         ↓
    强制改写 → 'BANK_SLIP'
         ↓
    SQL: WHERE doc_type='BANK_SLIP'
         ↓
    数据库: doc_type='BANK_RECEIPT' (无匹配)
         ↓
    返回: []
```

---

## 4. 验证与修复

### 最小验证

```java
// 在 VoucherService.java:87 前添加
log.debug("Type normalization: input={}, output={}", type, normalizeType(type));
// 预期输出: Type normalization: input=BANK_RECEIPT, output=BANK_SLIP
// 如果确实是这个输出，假设确认
```

### 手术式修复

```diff
--- a/VoucherService.java
+++ b/VoucherService.java
@@ -84,9 +84,4 @@ public class VoucherService {
-    private String normalizeType(String type) {
-        // 遗留代码：为了兼容旧版前端
-        if ("BANK_RECEIPT".equals(type)) {
-            return "BANK_SLIP";
-        }
-        return type;
-    }
+    private String normalizeType(String type) {
+        // 移除强制转换，使用原值
+        return type;
+    }
```

### 防复发锁

```java
// 添加单元测试
@Test
void shouldNotTransformTypeCode() {
    assertEquals("BANK_RECEIPT", service.normalizeType("BANK_RECEIPT"));
    assertEquals("BANK_SLIP", service.normalizeType("BANK_SLIP"));
}

// 添加集成测试
@Test
void shouldFindVouchersByNewTypeCode() {
    List<Voucher> results = repository.findByType("BANK_RECEIPT");
    assertFalse(results.isEmpty(), "Should find vouchers with BANK_RECEIPT type");
}
```

---

## 5. 交付清单

| 检查项 | 状态 |
|--------|------|
| ☑ 零号病人已定位 | VoucherService.java:87 |
| ☑ 必然性已证明 | 类型代码强制转换导致查询失败 |
| ☑ 最小验证已执行 | 日志确认转换发生 |
| ☑ 修复 diff 已提供 | 移除强制转换逻辑 |
| ☑ 防复发测试已设计 | 单元测试 + 集成测试 |

---

## Verdict

**[PASS]**

**理由**：根因已定位到 VoucherService.java:87，类型代码强制转换导致查询与存储不一致。修复方案已验证，回归测试已覆盖。
