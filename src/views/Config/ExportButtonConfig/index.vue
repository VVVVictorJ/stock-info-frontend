<template>
  <div class="page-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>导出按钮配置</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button>
        </div>
      </template>

      <el-table :data="configs" v-loading="loading" stripe style="width: 100%">
        <el-table-column label="所属页面" width="120">
          <template #default="{ row }">
            {{ row.page_key === 'trade-date-query' ? '交易日查询' : row.page_key === 'track-data' ? '追踪数据' : row.page_key }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="按钮名称" min-width="120" />
        <el-table-column label="绑定板块" min-width="240">
          <template #default="{ row }">
            <div class="plate-tags">
              <el-tag
                v-for="code in row.plate_codes"
                :key="code"
                size="small"
                class="plate-tag"
                effect="light"
              >
                {{ getPlateName(code) }}
              </el-tag>
              <span v-if="!row.plate_codes.length" class="empty-text">未配置</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该配置吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="所属页面" required>
          <el-select v-model="form.page_key" placeholder="选择页面" style="width: 100%">
            <el-option label="交易日查询" value="trade-date-query" />
            <el-option label="追踪数据" value="track-data" />
          </el-select>
        </el-form-item>
        <el-form-item label="按钮名称" required>
          <el-input v-model="form.name" placeholder="例如：昨日涨停" />
        </el-form-item>
        <el-form-item label="绑定板块" required>
          <el-select
            v-model="form.plate_codes"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择板块（可多选）"
            style="width: 100%"
          >
            <el-option
              v-for="plate in plateOptions"
              :key="plate.plate_code"
              :label="plate.name"
              :value="plate.plate_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  fetchExportButtonConfigs,
  createExportButtonConfig,
  updateExportButtonConfig,
  deleteExportButtonConfig,
} from '@/api/exportButtonConfig'
import { fetchStockPlatesList } from '@/api/stock'
import type { ExportButtonConfigItem, CreateExportButtonConfigRequest } from '@/types/exportButtonConfig'
import type { StockPlateListItem } from '@/types/stockPlate'

const configs = ref<ExportButtonConfigItem[]>([])
const plateOptions = ref<StockPlateListItem[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const form = ref<CreateExportButtonConfigRequest>({
  page_key: '',
  name: '',
  plate_codes: [],
  sort_order: 0,
})

function getPlateName(code: string): string {
  const plate = plateOptions.value.find((p) => p.plate_code === code)
  return plate ? plate.name : code
}

function formatDateTime(dt: string): string {
  if (!dt) return '-'
  return dt.replace('T', ' ').substring(0, 19)
}

async function loadData() {
  loading.value = true
  try {
    // #region agent log
    fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'ExportButtonConfig/index.vue:130',message:'loadData entry',data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const [configRes, plateRes] = await Promise.all([
      fetchExportButtonConfigs(),
      fetchStockPlatesList(),
    ])
    // #region agent log
    fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'ExportButtonConfig/index.vue:137',message:'loadData success',data:{configCount:configRes?.length,plateCount:plateRes?.length,plateResType:typeof plateRes,isArray:Array.isArray(plateRes),firstPlate:plateRes?.[0]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    configs.value = configRes
    plateOptions.value = plateRes
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7672/ingest/011d9284-7d9e-4eb5-bf6b-c54e4138f97a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'004cd7'},body:JSON.stringify({sessionId:'004cd7',location:'ExportButtonConfig/index.vue:140',message:'loadData error',data:{error:err?.message,status:err?.status},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    ElMessage.error(err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  form.value = { page_key: '', name: '', plate_codes: [], sort_order: 0 }
  dialogVisible.value = true
}

function handleEdit(row: ExportButtonConfigItem) {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    page_key: row.page_key,
    name: row.name,
    plate_codes: [...row.plate_codes],
    sort_order: row.sort_order,
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入按钮名称')
    return
  }
  if (form.value.plate_codes.length === 0) {
    ElMessage.warning('请选择至少一个板块')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && editingId.value !== null) {
      await updateExportButtonConfig(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createExportButtonConfig(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (err: any) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: ExportButtonConfigItem) {
  try {
    await deleteExportButtonConfig(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (err: any) {
    ElMessage.error(err?.message || '删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container {
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
  overflow: auto;
  background: linear-gradient(to bottom, #f5f7fa 0%, #e8eaf0 100%);
}

.config-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.plate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.plate-tag {
  margin: 2px 0;
}

.empty-text {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
