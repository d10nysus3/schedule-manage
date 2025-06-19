<template>
  <div>
    <!-- 可拖动的悬浮按钮 -->
    <div
        class="floating-button"
        :class="{ dragging: isDragging }"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
        @mousedown="startDrag"
        @click="handleClick"
    >
      <el-icon :size="24" color="#fff">
        <VideoPause/>
      </el-icon>
    </div>

    <div
        v-if="isMinimized"
        class="clock-widget"
        :style="{ left: capsulePosition.x + 'px', top: capsulePosition.y + 'px' }"
        @dblclick="restoreTimer"
        @mousedown="startCapsuleDrag"
    >
      <div class="widget-header">
        <span class="widget-title">专注计时</span>
        <el-icon class="expand-icon" @click.stop="restoreTimer"><FullScreen /></el-icon>
      </div>
      <div class="widget-time">{{ currentTimeDisplay }}</div>
      <div class="widget-mode">{{ activeTab === 'countdown' ? '倒计时' : activeTab === 'stopwatch' ? '正计时' : '番茄钟' }}</div>
      <div class="widget-controls">
        <el-icon class="widget-icon" @click.stop="toggleTimer">
          <component :is="timers[activeTab].running ? VideoPause : VideoPlay" />
        </el-icon>
        <el-icon class="widget-icon" @click.stop="resetTimer"><RefreshRight /></el-icon>
      </div>
    </div>

    <!-- 专注计时设置对话框 -->
    <el-dialog
        v-model="showDialog"
        title="专注计时"
        width="400px"
        :close-on-click-modal="false"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon class="minimize-icon" @click="minimizeToCapsule"><Minus /></el-icon>
          <span>专注计时</span>

        </div>
      </template>
      <!-- 选项卡 -->
      <el-tabs v-model="activeTab" class="timer-tabs">
        <el-tab-pane label="倒计时" name="countdown">
          <div class="time-setting">
            <div class="time-input-group">
              <span class="label">专注时间:</span>
              <el-input-number
                  v-model="countdownMinutes"
                  :min="1"
                  :max="120"
                  controls-position="right"
                  @change="updateCountdownTime"
              />
              <span class="unit">分钟</span>
            </div>
            <div class="time-display">{{ formatTime(countdownTime) }}</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="正计时" name="stopwatch">
          <div class="time-display">{{ formatTime(stopwatchTime) }}</div>
        </el-tab-pane>

        <el-tab-pane label="番茄钟" name="pomodoro">
          <div class="pomodoro-settings"
               :class="{ 'break-time': timers.pomodoro.settings.isBreak }">
            <div class="setting-item">
              <span class="label">专注时长:</span>
              <el-input-number
                  v-model="pomodoroSettings.focusDuration"
                  :min="5"
                  :max="60"
                  controls-position="right"
              />
              <span class="unit">分钟</span>
            </div>
            <div class="setting-item">
              <span class="label">短休息:</span>
              <el-input-number
                  v-model="pomodoroSettings.shortBreak"
                  :min="1"
                  :max="15"
                  controls-position="right"
              />
              <span class="unit">分钟</span>
            </div>
            <div class="setting-item">
              <span class="label">长休息:</span>
              <el-input-number
                  v-model="pomodoroSettings.longBreak"
                  :min="5"
                  :max="30"
                  controls-position="right"
              />
              <span class="unit">分钟</span>
            </div>
            <div class="setting-item">
              <span class="label">轮次:</span>
              <el-input-number
                  v-model="pomodoroSettings.rounds"
                  :min="1"
                  :max="10"
                  controls-position="right"
              />
              <span class="unit">轮</span>
            </div>
            <div class="current-round">当前轮次: {{ pomodoroSettings.currentRound }}</div>
            <div class="time-display">{{ formatTime(pomodoroTime) }}</div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 控制按钮 -->
      <div class="control-buttons">
        <el-button
            type="primary"
            @click="toggleTimer"
            :icon="timers[activeTab].buttonIcon"
        >
          {{ timers[activeTab].buttonText }}
        </el-button>
        <el-button @click="resetTimer" :icon="RefreshRight">重置</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {VideoPause, VideoPlay, RefreshRight, Minus, FullScreen} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from '../plugins/axios';
// 新增最小化相关状态
const isMinimized = ref(false)
const capsulePosition = ref({ x: window.innerWidth - 220, y: 20 })
const capsuleDragStart = ref({ x: 0, y: 0 })
// 计算当前显示的时间
const currentTimeDisplay = computed(() => {
  if (activeTab.value === 'countdown') return formatTime(timers.value.countdown.time)
  if (activeTab.value === 'stopwatch') return formatTime(timers.value.stopwatch.time)
  if (activeTab.value === 'pomodoro') return formatTime(timers.value.pomodoro.time)
  return '00:00'
})
// 切换最小化状态
const minimizeToCapsule = () => {
  isMinimized.value = true
  showDialog.value = false
}
const restoreTimer = () => {
  isMinimized.value = false
  showDialog.value = true
}

// 胶囊拖动相关
const startCapsuleDrag = (e) => {
  capsuleDragStart.value = {
    x: e.clientX - capsulePosition.value.x,
    y: e.clientY - capsulePosition.value.y
  }
  document.addEventListener('mousemove', handleCapsuleDrag)
  document.addEventListener('mouseup', stopCapsuleDrag)
  e.preventDefault()
}
const handleCapsuleDrag = (e) => {
  capsulePosition.value = {
    x: e.clientX - capsuleDragStart.value.x,
    y: e.clientY - capsuleDragStart.value.y
  }
}

const checkCapsulePosition = () => {
  const maxX = window.innerWidth - 220
  const maxY = window.innerHeight - 50
  capsulePosition.value = {
    x: Math.max(0, Math.min(capsulePosition.value.x, maxX)),
    y: Math.max(0, Math.min(capsulePosition.value.y, maxY))
  }
}

const stopCapsuleDrag = () => {
  document.removeEventListener('mousemove', handleCapsuleDrag)
  document.removeEventListener('mouseup', stopCapsuleDrag)
  checkCapsulePosition()
}


const position = ref({ x: 160, y: window.innerHeight - 80 })
const isDragging = ref(false)
const dragStartPosition = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })
const justDragged = ref(false)
const showDialog = ref(false)

const activeTab = ref('countdown')

// 计时器数据
const timers = ref({
  countdown: {
    minutes: 25,
    time: 25 * 60,
    running: false,
    buttonText: '开始',
    buttonIcon: VideoPlay
  },
  stopwatch: {
    time: 0,
    running: false,
    buttonText: '开始',
    buttonIcon: VideoPlay
  },
  pomodoro: {
    settings: {
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      rounds: 4,
      currentRound: 1,
      isBreak: false
    },
    time: 25 * 60,
    running: false,
    buttonText: '开始',
    buttonIcon: VideoPlay
  }
})

let timer = null
let currentRunningTimer = null

// 格式化时间显示
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 更新倒计时时间
const updateCountdownTime = () => {
  timers.value.countdown.time = timers.value.countdown.minutes * 60
}

// 开始/暂停计时器
const toggleTimer = () => {
  const timerType = activeTab.value
  const timer = timers.value[timerType]

  if (timer.running) {
    // 暂停当前计时器
    timer.running = false
    timer.buttonText = '开始'
    timer.buttonIcon = VideoPlay
    stopTimer(timerType)

    if (currentRunningTimer === timerType) {
      currentRunningTimer = null
    }
  } else {
    if (currentRunningTimer) {
      const runningTimer = timers.value[currentRunningTimer]
      runningTimer.running = false
      runningTimer.buttonText = '开始'
      runningTimer.buttonIcon = VideoPlay
      stopTimer(currentRunningTimer)
    }

    timer.running = true
    timer.buttonText = '暂停'
    timer.buttonIcon = VideoPause
    currentRunningTimer = timerType
    startTimer(timerType)
  }
}

// 启动指定类型的计时器
const startTimer = (timerType) => {
  stopTimer()

  timer = setInterval(() => {
    const timerData = timers.value[timerType]

    if (timerType === 'countdown') {
      if (timerData.time > 0) {
        timerData.time--
      } else {
        stopTimer(timerType)
        timerData.running = false
        timerData.buttonText = '开始'
        timerData.buttonIcon = VideoPlay
        currentRunningTimer = null
        ElMessage.success('专注时间结束！')
      }
    } else if (timerType === 'stopwatch') {
      timerData.time++
    } else if (timerType === 'pomodoro') {
      if (timerData.time > 0) {
        timerData.time--
      } else {
        handlePomodoroPhaseChange(timerType)
      }
    }
  }, 1000)
}

// 处理番茄钟阶段变化
const handlePomodoroPhaseChange = (timerType) => {
  const pomodoro = timers.value[timerType]
  const settings = pomodoro.settings

  if (!settings.isBreak) {
    // 专注时间结束，进入休息
    if (settings.currentRound % settings.rounds === 0) {
      // 长休息
      pomodoro.time = settings.longBreak * 60
      ElMessage.success(`第 ${settings.currentRound} 轮专注完成，开始长休息`)
    } else {
      // 短休息
      pomodoro.time = settings.shortBreak * 60
      ElMessage.success(`第 ${settings.currentRound} 轮专注完成，开始短休息`)
    }
    settings.isBreak = true
  } else {
    // 休息结束，开始下一轮专注
    pomodoro.time = settings.focusDuration * 60
    settings.isBreak = false

    if (settings.currentRound >= settings.rounds) {
      settings.currentRound = 1
      ElMessage.success('所有轮次完成，开始新一轮番茄钟')
    } else {
      settings.currentRound++
      ElMessage.success(`休息结束，开始第 ${settings.currentRound} 轮专注`)
    }
  }
}

// 停止指定类型的计时器
const stopTimer = (type = null) => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 重置计时器
const resetTimer = () => {
  const timerType = activeTab.value
  const timerData = timers.value[timerType]

  // 如果正在运行，先停止
  if (timerData.running) {
    stopTimer(timerType)
    currentRunningTimer = null
  }

  timerData.running = false
  timerData.buttonText = '开始'
  timerData.buttonIcon = VideoPlay

  if (timerType === 'countdown') {
    timerData.time = timerData.minutes * 60
  } else if (timerType === 'stopwatch') {
    timerData.time = 0
  } else if (timerType === 'pomodoro') {
    timerData.time = timerData.settings.focusDuration * 60
    timerData.settings.currentRound = 1
    timerData.settings.isBreak = false
  }
}

// 计算属性，用于模板中显示当前时间
const countdownTime = computed(() => timers.value.countdown.time)
const stopwatchTime = computed(() => timers.value.stopwatch.time)
const pomodoroTime = computed(() => timers.value.pomodoro.time)
const pomodoroSettings = computed(() => timers.value.pomodoro.settings)
const countdownMinutes = computed({
  get: () => timers.value.countdown.minutes,
  set: (val) => {
    timers.value.countdown.minutes = val
    updateCountdownTime()
  }
})
// 拖动相关方法
const startDrag = (e) => {
  isDragging.value = true
  startPos.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  dragStartPosition.value = {x: e.clientX, y: e.clientY}
  e.preventDefault()
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - startPos.value.x,
    y: e.clientY - startPos.value.y
  }
}

const stopDrag = (e) => {
  if (!isDragging.value) return

  const dx = Math.abs(e.clientX - dragStartPosition.value.x)
  const dy = Math.abs(e.clientY - dragStartPosition.value.y)
  const isActualDrag = dx > 5 || dy > 5

  isDragging.value = false
  checkPosition()

  if (isActualDrag) {
    justDragged.value = true
    setTimeout(() => {
      justDragged.value = false
    }, 100)
    e.preventDefault()
    e.stopPropagation()
  }
}

const handleClick = (e) => {
  if (justDragged.value || isDragging.value) {
    e.preventDefault()
    e.stopPropagation()
    return
  }
  showDialog.value = true
}

const checkPosition = () => {
  const maxX = window.innerWidth - 50
  const maxY = window.innerHeight - 50
  position.value = {
    x: Math.max(0, Math.min(position.value.x, maxX)),
    y: Math.max(0, Math.min(position.value.y, maxY))
  }
}


// 生命周期钩子
onMounted(() => {
  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('resize', checkPosition)
  window.addEventListener('resize', checkCapsulePosition)
  updateCountdownTime()
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('resize', checkPosition)
  window.removeEventListener('resize', checkCapsulePosition)
})
</script>

<style scoped>
.clock-capsule {
  position: fixed;
  display: flex;
  align-items: center;
  background-color: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: move;
  z-index: 9999;
  user-select: none;
}

.capsule-time {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
}
.clock-widget {
  position: fixed;
  width: 180px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  cursor: move;
  z-index: 9999;
  user-select: none;
  border: 1px solid #ebeef5;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.widget-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.widget-time {
  font-family: 'Roboto Mono', monospace;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #303133;
  margin: 8px 0;
}

.widget-mode {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-bottom: 12px;
}

.widget-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.widget-icon {
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  background-color: #f5f7fa;
  color: #606266;
  transition: all 0.2s;
}

.widget-icon:hover {
  background-color: #e4e7ed;
  transform: scale(1.1);
}

.expand-icon {
  cursor: pointer;
  color: #606266;
  transition: transform 0.2s;
}

.expand-icon:hover {
  transform: scale(1.1);
  color: #409eff;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 16px;
}


.minimize-icon {
  cursor: pointer;
  padding: 6px;
  margin-right: 10px;
  border-radius: 50%;
  background-color: #f2f6fc;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.minimize-icon:hover {
  background-color: #e0ebf9;
  transform: scale(1.1);
}

.capsule-time {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
}

.expand-icon {
  cursor: pointer;
  transition: transform 0.2s;
}

.expand-icon:hover {
  transform: scale(1.1);
}
.floating-button {
  position: fixed;
  width: 50px;
  height: 50px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: move;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  transition: transform 0.2s, box-shadow 0.2s;
}

.floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.floating-button:active {
  cursor: grabbing;
}

.timer-tabs {
  margin-bottom: 20px;
}

.time-setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-input-group .label {
  font-size: 14px;
  color: #606266;
}

.time-input-group .unit {
  font-size: 14px;
  color: #606266;
}

.time-display {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  font-family: monospace;
}

.pomodoro-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: background-color 0.3s ease;
}
.pomodoro-settings.break-time {
  background-color: #f0f9eb;
  border-radius: 8px;
  padding: 15px;
}
.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pomodoro-settings.break-time .time-display {
  color: #67c23a;
  font-weight: bold;
}
.pomodoro-settings.break-time .current-round {
  color: #67c23a;
}
.setting-item .label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.setting-item .unit {
  font-size: 14px;
  color: #606266;
}

.current-round {
  text-align: center;
  margin: 15px 0;
  font-size: 16px;
  color: #409eff;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style>