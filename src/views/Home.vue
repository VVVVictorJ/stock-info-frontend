<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="home">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用股票信息系统</span>
        </div>
      </template>
      <div class="welcome-content">
        <p>选择下方功能模块开始使用</p>
      </div>
    </el-card>

    <div class="nav-grid">
      <el-card class="nav-item" @click="navigateTo('/catch-raise')" shadow="hover">
        <div class="nav-icon">📈</div>
        <div class="nav-title">涨跌捕捉</div>
        <div class="nav-desc">实时监控股票涨跌情况</div>
      </el-card>

      <el-card class="nav-item" @click="navigateTo('/stock')" shadow="hover">
        <div class="nav-icon">🔍</div>
        <div class="nav-title">单股查询</div>
        <div class="nav-desc">查询单只股票的详细信息</div>
      </el-card>

      <el-card class="nav-item" @click="navigateTo('/trade-date-query')" shadow="hover">
        <div class="nav-icon">📅</div>
        <div class="nav-title">交易日查询</div>
        <div class="nav-desc">查询指定交易日的股票数据</div>
      </el-card>

      <el-card class="nav-item" @click="navigateTo('/price-compare')" shadow="hover">
        <div class="nav-icon">📊</div>
        <div class="nav-title">价格对比</div>
        <div class="nav-desc">对比不同股票的价格走势</div>
      </el-card>

      <el-card class="nav-item" @click="navigateTo('/scheduler-manage')" shadow="hover">
        <div class="nav-icon">⏰</div>
        <div class="nav-title">定时任务管理</div>
        <div class="nav-desc">管理和监控定时任务</div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 18px;
}

.welcome-content {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #606266;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.nav-item {
  cursor: pointer;
  text-align: center;
  padding: 30px 20px;
  transition: all 0.3s;
  border-radius: 8px;
}

.nav-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.nav-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

.nav-desc {
  font-size: 14px;
  color: #909399;
}

@media (max-width: 768px) {
  .nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>


