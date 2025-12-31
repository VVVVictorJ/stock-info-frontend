# 交易日查询页面

## 页面路由
访问路径：`/trade-date-query`

## 功能特性

### 查询面板
- ✅ 日期选择器（默认今天）
- ✅ 每页条数选择器（20/50/100）
- ✅ 查询按钮（带 loading 状态）
- ✅ 错误提示（可关闭）
- ✅ 渐变紫色背景

### 结果面板
- ✅ 结果统计信息（总条数、当前页/总页数）
- ✅ 数据表格（Element Plus el-table）
- ✅ 所有数值列支持排序
- ✅ 涨跌幅颜色区分（绿涨红跌）
- ✅ 主力资金流入橙色高亮
- ✅ 前端分页器
- ✅ 斑马纹表格

## 布局特性

### 页面布局
- ✅ 页面高度占满视口（100vh）
- ✅ Flexbox 垂直布局
- ✅ 查询面板固定高度
- ✅ 结果面板占满剩余高度（flex: 1）
- ✅ 表格第一行是列名，固定在顶部
- ✅ 表格内容超长时可滚动
- ✅ 结果面板有合适的 padding

### 响应式设计
- ✅ 移动端友好布局
- ✅ 查询表单自适应

## 表格列

| 列名 | 字段 | 排序 | 对齐 | 特殊样式 |
|------|------|------|------|----------|
| 股票代码 | stock_code | ✅ | 左 | - |
| 股票名称 | stock_name | ✅ | 左 | - |
| 最新价 | latest_price | ✅ | 右 | 千分位 |
| 收盘价 | close_price | ✅ | 右 | 千分位 |
| 涨跌幅(%) | change_pct | ✅ | 右 | 绿涨红跌 |
| 量比 | volume_ratio | ✅ | 右 | 千分位 |
| 换手率(%) | turnover_rate | ✅ | 右 | 千分位 |
| 委比 | bid_ask_ratio | ✅ | 右 | 千分位 |
| 主力资金流入 | main_force_inflow | ✅ | 右 | 橙色高亮 |
| 创建时间 | created_at | ✅ | 左 | 格式化显示 |

## 使用方法

1. 访问页面 `/trade-date-query`
2. 选择交易日期（默认为今天）
3. 选择每页条数（可选，默认20条）
4. 点击"查询"按钮
5. 查看结果表格
6. 可点击表头进行排序
7. 使用底部分页器切换页面

## 技术实现

### 前端技术栈
- Vue 3 Composition API
- TypeScript
- Element Plus
- Axios

### 核心功能
- **日期选择**: Element Plus DatePicker，默认今天
- **数据查询**: POST 请求到 `/stock-trade-date-query`
- **前端分页**: 使用 computed 属性切分数据
- **表格排序**: Element Plus Table 的 sortable 属性
- **数值格式化**: toLocaleString，保留2位小数
- **日期格式化**: toLocaleString，中文格式

### 布局实现
```css
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.query-panel {
  flex-shrink: 0;
}

.result-panel {
  flex: 1;
  overflow: hidden;
}
```

## 配色方案

- **查询面板背景**: 紫色渐变 (#667eea → #764ba2)
- **结果面板背景**: 白色渐变
- **涨幅**: 绿色 (#67C23A)
- **跌幅**: 红色 (#F56C6C)
- **主力资金**: 橙色 (#E6A23C)

## 文件清单

- `src/types/tradeDateQuery.ts` - 类型定义
- `src/api/stock.ts` - API 接口（新增 fetchTradeDateQuery）
- `src/views/TradeDateQuery.vue` - 页面组件
- `src/router/index.ts` - 路由配置（新增路由）

## 验证清单

- ✅ 页面可正常访问
- ✅ 页面高度占满视口（100vh）
- ✅ 结果面板占满剩余高度
- ✅ 表格第一行是列名，固定在顶部
- ✅ 表格内容超长时可滚动
- ✅ 结果面板有合适的 padding
- ✅ 日期选择器默认今天
- ✅ 查询功能正常
- ✅ 表格数值列可排序
- ✅ 前端分页正常工作
- ✅ 涨跌幅颜色正确显示
- ✅ 界面整洁美观
- ✅ 响应式布局
- ✅ 无 TypeScript 错误

## 注意事项

1. 后端接口路径为：`POST /api/stock-trade-date-query`
2. 日期格式必须为：`YYYY-MM-DD`
3. 前端实现了完整的分页逻辑，无需后端分页
4. 表格使用 Element Plus 的固定高度模式，自动处理滚动

