<template>
  <ResultCard title="分析结果">
    <template #header-right>
      <span v-if="hasData && result" class="result-meta">
        耗时 {{ ((result.duration_ms || 0) / 1000).toFixed(1) }}s
        &nbsp;|&nbsp;
        模型 {{ result.model_name }}
      </span>
    </template>

    <div v-if="loading" class="loading-container" v-loading="true" element-loading-text="AI 正在分析中，请耐心等待（约10-30秒）...">
    </div>

    <div v-else-if="!hasData" class="empty-container">
      <el-empty description="选择股票后点击「开始分析」" />
    </div>

    <div v-else-if="result && result.status === 'failed'" class="error-container">
      <el-result icon="error" title="分析失败" :sub-title="result.error_message || '未知错误'" />
    </div>

    <div v-else-if="result && analysisData" class="result-content">
      <!-- 概览卡片 -->
      <div class="section overview-section">
        <div class="section-title">概览</div>
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-label">股票</div>
            <div class="card-value">{{ analysisData.overview.stock_name }}</div>
          </div>
          <div class="overview-card">
            <div class="card-label">信号数量</div>
            <div class="card-value">{{ analysisData.overview.signal_count }} 个</div>
          </div>
          <div class="overview-card">
            <div class="card-label">分析周期</div>
            <div class="card-value">{{ analysisData.overview.analysis_period }}</div>
          </div>
          <div class="overview-card">
            <div class="card-label">历史数据</div>
            <div class="card-value">
              {{ analysisData.overview.data_completeness.history_trading_days }} 交易日
              <el-tag
                :type="analysisData.overview.data_completeness.is_sufficient ? 'success' : 'warning'"
                size="small"
                class="sufficiency-tag"
              >
                {{ analysisData.overview.data_completeness.is_sufficient ? '充足' : '不足' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 信号评估表格 -->
      <div class="section signal-section">
        <div class="section-title">信号评估</div>
        <el-table :data="analysisData.signal_evaluations" stripe border style="width: 100%">
          <el-table-column label="#" width="50" align="center" :resizable="true">
            <template #default="{ row }">
              {{ row.signal_index }}
            </template>
          </el-table-column>
          <el-table-column prop="datetime" label="信号时间" min-width="160" :resizable="true" />
          <el-table-column label="涨跌幅(%)" min-width="90" align="right" :resizable="true">
            <template #default="{ row }">
              <span :class="row.indicators.change_pct >= 0 ? 'text-red' : 'text-green'">
                {{ row.indicators.change_pct.toFixed(2) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="量比" min-width="70" align="right" :resizable="true">
            <template #default="{ row }">
              {{ row.indicators.volume_ratio.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="换手率(%)" min-width="90" align="right" :resizable="true">
            <template #default="{ row }">
              {{ row.indicators.turnover_rate.toFixed(2) }}%
            </template>
          </el-table-column>
          <el-table-column label="委买委卖比" min-width="110" align="right" :resizable="true">
            <template #default="{ row }">
              {{ row.indicators.bid_ask_ratio.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="trend_phase" label="趋势阶段" min-width="100" :resizable="true" />
          <el-table-column prop="time_quality" label="信号强度" min-width="80" align="center" :resizable="true" />
          <el-table-column label="有效性" min-width="70" align="center" :resizable="true">
            <template #default="{ row }">
              <el-tag :type="row.is_valid ? 'success' : 'danger'" size="small">
                {{ row.is_valid ? '有效' : '无效' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="kline_pattern" label="K线形态" min-width="110" :resizable="true" />
          <el-table-column label="评级" min-width="70" align="center" :resizable="true">
            <template #default="{ row }">
              <el-tag :type="getRatingType(row.rating)" size="default" effect="dark" class="rating-tag">
                {{ row.rating }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="评级理由" min-width="280" :resizable="true">
            <template #default="{ row }">
              <div class="cell-wrap">{{ row.rating_reason }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作建议" min-width="160" :resizable="true">
            <template #default="{ row }">
              <div class="cell-wrap">{{ row.action_suggestion }}</div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 当前趋势诊断 -->
      <div class="section diagnosis-section">
        <div class="section-title">当前趋势诊断</div>
        <div class="diagnosis-cards">
          <div class="diagnosis-card">
            <div class="card-label">当前状态</div>
            <div class="card-value status-value">{{ analysisData.current_diagnosis.status }}</div>
          </div>
          <div class="diagnosis-card">
            <div class="card-label">支撑位</div>
            <div class="card-value text-green">{{ analysisData.current_diagnosis.support_level }}</div>
          </div>
          <div class="diagnosis-card">
            <div class="card-label">压力位</div>
            <div class="card-value text-red">{{ analysisData.current_diagnosis.resistance_level }}</div>
          </div>
          <div class="diagnosis-card">
            <div class="card-label">5日均线</div>
            <div class="card-value">{{ analysisData.current_diagnosis.ma5 }}</div>
          </div>
          <div class="diagnosis-card">
            <div class="card-label">20日均线</div>
            <div class="card-value">{{ analysisData.current_diagnosis.ma20 }}</div>
          </div>
          <div class="diagnosis-card">
            <div class="card-label">新信号</div>
            <div class="card-value">
              <el-tag :type="analysisData.current_diagnosis.has_new_signal ? 'success' : 'info'" size="small">
                {{ analysisData.current_diagnosis.has_new_signal ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
          <div class="diagnosis-card action-card">
            <div class="card-label">操作建议</div>
            <div class="card-value action-value">{{ analysisData.current_diagnosis.action_suggestion }}</div>
          </div>
        </div>
      </div>

      <!-- 风险提示 -->
      <div class="section risk-section">
        <div class="section-title">风险提示</div>
        <div class="risk-list">
          <el-alert
            v-for="(warning, idx) in analysisData.risk_warnings"
            :key="idx"
            :title="warning"
            type="warning"
            show-icon
            :closable="false"
            class="risk-item"
          />
        </div>
      </div>
    </div>

    <!-- response_json 为空但有 raw_response 时显示原始文本 -->
    <div v-else-if="result && !analysisData && result.status === 'completed'" class="raw-response-container">
      <el-alert title="AI 返回了非标准格式，以下为原始响应" type="info" :closable="false" class="raw-alert" />
      <pre class="raw-text">{{ result.response_json || '无响应内容' }}</pre>
    </div>
  </ResultCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResultCard from '@/component/common/ResultCard.vue'
import type { TrendPredictionResponse, AiAnalysisResult } from '@/types/aiAnalysis'

const props = defineProps<{
  result: TrendPredictionResponse | null
  loading: boolean
  hasData: boolean
}>()

// 解析 response_json 为强类型
const analysisData = computed<AiAnalysisResult | null>(() => {
  if (!props.result?.response_json) return null
  const json = props.result.response_json
  // 检查是否包含必要字段
  if (json.overview && json.signal_evaluations && json.current_diagnosis && json.risk_warnings) {
    return json as AiAnalysisResult
  }
  return null
})

function getRatingType(rating: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  switch (rating) {
    case 'A': return 'success'
    case 'B': return ''
    case 'C': return 'warning'
    case 'D': return 'danger'
    case 'F': return 'danger'
    default: return 'info'
  }
}
</script>

<style scoped>
.loading-container {
  flex: 1;
  min-height: 300px;
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-meta {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.result-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 章节通用样式 */
.section {
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.overview-card,
.diagnosis-card {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.card-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sufficiency-tag {
  margin-left: 4px;
}

/* 信号评估 */
.signal-section {
  overflow: visible;
}

.rating-tag {
  font-size: 14px;
  font-weight: 700;
  min-width: 28px;
  text-align: center;
}

.cell-wrap {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  padding: 4px 0;
}

/* 当前趋势诊断 */
.diagnosis-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.action-card {
  grid-column: 1 / -1;
}

.status-value {
  color: #409eff;
}

.action-value {
  color: #e6a23c;
}

/* 风险提示 */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-item {
  margin: 0;
}

/* 原始响应 */
.raw-response-container {
  flex: 1;
  overflow-y: auto;
}

.raw-alert {
  margin-bottom: 12px;
}

.raw-text {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
  max-height: 500px;
}

/* 文本颜色 */
.text-red {
  color: #f56c6c;
  font-weight: 600;
}

.text-green {
  color: #67c23a;
  font-weight: 600;
}
</style>
