# 📝 股票数据查询页面开发 Prompt 模板

> 本模板整理自实际开发经验，包含功能描述、技术实现要点、常见 Bug 及解决方案。

---

## 一、功能需求描述

### 1.1 页面结构

```
创建一个数据查询页面，包含：

1. **查询面板**（固定高度，不滚动）
   - 日期选择器（默认今天）
   - 每页条数选择器（20/50/100）
   - 查询按钮
   - 错误提示区域

2. **结果面板**（占用剩余空间）
   - 标题栏：显示"查询结果"、筛选输入框、统计信息
   - 数据表格：支持排序、斑马纹、表头固定
   - 分页器：始终可见在底部

3. **布局要求**
   - 整个页面不出现滚动条
   - 只有表格内容区域可以滚动
   - 分页器始终可见，无需滚动页面即可翻页
```

### 1.2 功能点

```
1. **后端分页**
   - 点击翻页时请求后端对应页数据
   - 改变每页条数时重置到第1页并重新请求

2. **前端筛选（股票代码）**
   - 输入时自动加载全量数据进行筛选
   - 显示筛选后的记录数
   - 清空筛选后恢复分页显示

3. **数据展示**
   - 数值列右对齐，支持排序
   - 涨跌幅：正数红色，负数绿色（中国股市习惯）
   - 涨跌状态：前端根据 latest_price 和 close_price 计算
   - 日期时间格式化显示

4. **交互体验**
   - 查询时显示 loading 状态
   - 错误时显示友好提示
   - 支持清空筛选
```

---

## 二、技术实现要点

### 2.1 布局实现（关键！）

```css
/* 核心原则：建立完整的高度传递链 */

/* 1. 全局禁止滚动 */
html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

/* 2. 根容器固定视口高度 */
.common-layout {
  height: 100vh;
  overflow: hidden;
}

/* 3. 主内容区继承高度 */
.layout-main {
  height: 100%;
  overflow: hidden;
  padding: 0;
}

/* 4. 页面容器 */
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 5. 查询面板固定高度 */
.query-panel {
  flex-shrink: 0;
}

/* 6. 结果面板占用剩余空间 */
.result-panel {
  flex: 1;
  min-height: 0;      /* 关键！允许缩小 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 7. 表格容器 */
.table-container {
  flex: 1;
  min-height: 0;      /* 关键！ */
  overflow: hidden;
}

/* 8. 分页器固定底部 */
.pagination-container {
  flex-shrink: 0;     /* 不压缩 */
}

/* 9. Element Plus 表格样式覆盖 */
.table-container :deep(.el-table) {
  height: 100%;
}
.table-container :deep(.el-table__body-wrapper) {
  overflow-y: auto !important;
}
```

**布局结构图：**

```
html/body/#app (100%, overflow: hidden)
└─ common-layout (100vh, overflow: hidden)
   └─ layout-root (100%, overflow: hidden)
      ├─ layout-header (60px, flex-shrink: 0)
      └─ el-container (calc(100% - 60px), overflow: hidden)
         ├─ layout-aside (侧边栏)
         └─ layout-main (100%, overflow: hidden)
            └─ page-container (100%, overflow: hidden)
               ├─ query-panel (flex-shrink: 0)
               └─ result-panel (flex: 1, overflow: hidden)
                  ├─ el-card__header (flex-shrink: 0)
                  └─ el-card__body (flex: 1, overflow: hidden)
                     └─ table-wrapper (flex: 1, overflow: hidden)
                        ├─ table-container (flex: 1)
                        │  └─ el-table (height: 100%)
                        │     ├─ header (fixed)
                        │     └─ body (滚动) ← 只有这里可以滚动
                        └─ pagination-container (flex-shrink: 0) ← 始终可见
```

### 2.2 分页实现

```typescript
// 后端分页模式
const currentPage = ref(1)
const currentPageSize = ref(20)

// 直接显示后端返回的数据
const tableData = computed(() => responseData.value?.data || [])

// 使用后端返回的 total
const totalRecords = computed(() => responseData.value?.total || 0)

// 翻页时重新请求后端
async function handleCurrentChange(page: number) {
  currentPage.value = page
  await handleQuery()  // 重新请求后端
}

// 改变每页条数时重新请求
async function handleSizeChange(size: number) {
  currentPageSize.value = size
  currentPage.value = 1
  await handleQuery()
}

// 初始查询（点击查询按钮）
async function handleInitialQuery() {
  currentPage.value = 1
  currentPageSize.value = pageSize.value
  filterKeyword.value = ''  // 清空筛选
  allData.value = []        // 清空缓存
  await handleQuery()
}
```

### 2.3 全量数据筛选（绕过后端 page_size 限制）

```typescript
const allData = ref<DataItem[]>([])
const isLoadingAll = ref(false)

// 分批次加载全量数据（后端限制 page_size <= 100）
async function loadAllData() {
  if (!queryDate.value || !responseData.value) return
  
  const totalRecordsCount = responseData.value.total
  if (totalRecordsCount === 0) return
  
  isLoadingAll.value = true
  const batchSize = 100
  const totalPages = Math.ceil(totalRecordsCount / batchSize)
  const allResults: DataItem[] = []
  
  try {
    for (let page = 1; page <= totalPages; page++) {
      const res = await fetchData({
        trade_date: queryDate.value,
        page: page,
        page_size: batchSize,
      })
      allResults.push(...res.data)
    }
    allData.value = allResults
  } catch (err) {
    console.error('Failed to fetch all data for filtering:', err)
  } finally {
    isLoadingAll.value = false
  }
}

// 监听筛选输入
watch(filterKeyword, async (newVal) => {
  if (newVal.trim() && responseData.value && queryDate.value) {
    if (allData.value.length === 0) {
      await loadAllData()
    }
  }
})

// 筛选逻辑
const filteredData = computed(() => {
  if (!filterKeyword.value.trim()) {
    // 无筛选时显示当前页数据
    return responseData.value?.data || []
  }
  // 有筛选时从全量数据筛选
  const dataSource = allData.value.length > 0 ? allData.value : (responseData.value?.data || [])
  const keyword = filterKeyword.value.trim().toLowerCase()
  return dataSource.filter(item => 
    item.stock_code.toLowerCase().includes(keyword)
  )
})

// 筛选后的总数
const filteredTotal = computed(() => {
  if (!filterKeyword.value.trim()) {
    return responseData.value?.total || 0
  }
  return filteredData.value.length
})
```

### 2.4 前端计算列

```typescript
// 涨跌状态计算
function getPriceTrend(row: DataItem): string {
  if (!row.close_price) return '→ 持平'
  
  const latestPrice = Number(row.latest_price)
  const closePrice = Number(row.close_price)
  
  if (isNaN(latestPrice) || isNaN(closePrice)) return '→ 持平'
  
  if (latestPrice > closePrice) return '↓ 下跌'
  if (latestPrice < closePrice) return '↑ 上涨'
  return '→ 持平'
}

// 涨跌状态样式
function getPriceTrendClass(row: DataItem): string {
  const trend = getPriceTrend(row)
  if (trend.includes('上涨')) return 'trend-up'
  if (trend.includes('下跌')) return 'trend-down'
  return 'trend-flat'
}

// 涨跌幅颜色（中国习惯：红涨绿跌）
function getChangeClass(value: string | number): string {
  const num = Number(value)
  if (isNaN(num)) return ''
  if (num > 0) return 'positive'  // 红色
  if (num < 0) return 'negative'  // 绿色
  return ''
}
```

```css
/* 中国股市习惯：红涨绿跌 */
.positive {
  color: #f56c6c;
  font-weight: 600;
}

.negative {
  color: #67c23a;
  font-weight: 600;
}

.trend-up {
  color: #f56c6c;
  font-weight: 600;
}

.trend-down {
  color: #67c23a;
  font-weight: 600;
}

.trend-flat {
  color: #909399;
}
```

---

## 三、常见 Bug 及解决方案

### Bug 1：分页器无法点击

**症状**：分页按钮显示禁用状态（鼠标悬停显示禁止图标）

**原因**：
- `totalRecords` 使用了当前页数据长度而不是后端返回的 `total`
- 前端对后端已分页的数据又做了切片

**解决**：
```typescript
// ❌ 错误
const totalRecords = computed(() => responseData.value?.data?.length || 0)
const tableData = computed(() => {
  const start = (page - 1) * pageSize
  return responseData.value.data.slice(start, start + pageSize)  // 错误！二次切片
})

// ✅ 正确
const totalRecords = computed(() => responseData.value?.total || 0)
const tableData = computed(() => responseData.value?.data || [])  // 直接使用
```

---

### Bug 2：整个页面出现滚动条

**症状**：需要滚动页面才能看到分页器

**原因**：高度传递链断裂，某个容器缺少 `min-height: 0`

**解决**：
```css
/* 所有 flex: 1 的容器都需要 */
.flex-container {
  flex: 1;
  min-height: 0;      /* 关键！允许 flex 子元素缩小 */
  overflow: hidden;
}

/* 同时确保父容器有固定高度 */
.parent {
  height: 100%;       /* 或 height: 100vh */
  overflow: hidden;
}
```

**调试技巧**：
```javascript
// 在控制台检查高度链
let el = document.querySelector('.table-container');
while (el) {
  console.log(el.className, getComputedStyle(el).height);
  el = el.parentElement;
}
```

---

### Bug 3：搜索只能搜索当前页

**症状**：输入股票代码只能在当前页筛选，翻页后才能搜索到其他数据

**原因**：后端 `page_size` 有限制（如最大 100），请求全量数据失败

**解决**：分批次加载数据
```typescript
// 分批次请求，每次 100 条（符合后端限制）
const batchSize = 100
const totalPages = Math.ceil(totalRecordsCount / batchSize)

for (let page = 1; page <= totalPages; page++) {
  const res = await fetchData({ page, page_size: batchSize })
  allResults.push(...res.data)
}
```

---

### Bug 4：时区导致跨日数据

**症状**：查询 2025-12-29 出现 2025-12-30 00:04:32 的数据

**原因**：SQL 使用 `timestamp::date` 转换时使用数据库默认时区（通常是 UTC），而数据是北京时间

**解决**：
```sql
-- ❌ 错误（使用默认时区 UTC）
AND created_at::date = trade_date

-- ✅ 正确（使用北京时区）
AND (created_at AT TIME ZONE 'Asia/Shanghai')::date = trade_date
```

---

## 四、开发 Checklist

```
□ 布局
  □ App.vue 设置 html, body, #app { height: 100%; overflow: hidden }
  □ 根容器 height: 100vh
  □ 页面容器 height: 100%; display: flex; flex-direction: column
  □ 查询面板 flex-shrink: 0
  □ 结果面板 flex: 1; min-height: 0; overflow: hidden
  □ 表格容器 flex: 1; min-height: 0
  □ 分页器容器 flex-shrink: 0
  □ 表格设置 height="100%"

□ 分页
  □ 使用后端返回的 total 作为总记录数
  □ 翻页时调用 handleQuery() 重新请求后端
  □ 不要对后端返回的数据再做前端切片
  □ 初始查询时重置页码和清空缓存

□ 筛选
  □ 考虑后端 page_size 限制（如最大 100）
  □ 分批次加载全量数据
  □ 重新查询时清空 allData 缓存
  □ 无筛选时显示当前页，有筛选时显示筛选结果

□ 数据展示
  □ 涨跌颜色：红涨绿跌（中国股市习惯）
  □ 数值格式化（保留小数位）
  □ 日期时间格式化（使用 toLocaleString）
  □ 计算列在前端计算（如涨跌状态）

□ 时区
  □ 后端 SQL 使用 AT TIME ZONE 'Asia/Shanghai'
  □ 前端显示时注意时区转换
  □ 确保数据库查询结果与直接 SQL 查询一致
```

---

## 五、参考文件

```
前端：
- src/views/TradeDateQuery.vue          # 页面组件（完整示例）
- src/types/tradeDateQuery.ts           # TypeScript 类型定义
- src/api/stock.ts                      # API 调用封装
- src/App.vue                           # 全局布局设置
- docs/layout-principle.md              # 布局原理详细文档

后端：
- src/handler/stock_trade_date_query.rs       # HTTP 请求处理
- src/repositories/stock_trade_date_query.rs  # 数据库查询
- src/api_models/stock_trade_date_query.rs    # 请求/响应模型
```

---

## 六、快速开始模板

### 6.1 页面组件结构

```vue
<template>
  <div class="page-container">
    <!-- 查询面板 -->
    <el-card class="query-panel">
      <template #header>查询条件</template>
      <div class="query-form">
        <el-date-picker v-model="queryDate" type="date" />
        <el-select v-model="pageSize">
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
          <el-option label="100条/页" :value="100" />
        </el-select>
        <el-button type="primary" @click="handleInitialQuery">查询</el-button>
      </div>
    </el-card>

    <!-- 结果面板 -->
    <el-card class="result-panel">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <div class="header-right">
            <el-input v-model="filterKeyword" placeholder="筛选" clearable />
            <span>共 {{ filteredTotal }} 条</span>
          </div>
        </div>
      </template>
      
      <div class="table-wrapper">
        <div class="table-container">
          <el-table :data="tableData" stripe height="100%">
            <!-- 表格列定义 -->
          </el-table>
        </div>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="currentPageSize"
            :total="totalRecords"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>
```

---

**更新日期**：2025-12-31

**维护者**：开发团队

