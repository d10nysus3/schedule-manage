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
        <Plus/>
      </el-icon>
    </div>

    <!-- 添加日程的对话框 -->
    <el-dialog
        v-model="showDialog"
        title="添加新日程"
        width="500px"
        :close-on-click-modal="false"
        @closed="handleDialogClosed"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="日程内容" required>
          <el-input
              v-model="form.content"
              type="textarea"
              :rows="3"
              placeholder="请输入日程内容"
          />
        </el-form-item>

        <el-form-item label="开始时间" required>
          <el-date-picker
              v-model="form.startTime"
              type="datetime"
              placeholder="选择开始时间"
          />
        </el-form-item>

        <el-form-item label="结束时间" required>
          <el-date-picker
              v-model="form.endTime"
              type="datetime"
              placeholder="选择结束时间"
              :disabled-date="disabledEndDate"
              @change="handleEndTimeChange"
          />
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option label="高" :value="3"></el-option>
            <el-option label="中" :value="2"></el-option>
            <el-option label="低" :value="1"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item
            label="所需资源"
        >
          <el-input v-model="form.resources"></el-input>
        </el-form-item>

        <el-form-item label="任务类型">
          <el-radio-group v-model="form.taskType" @change="handleTaskTypeChange">
            <el-radio label="personal">个人任务</el-radio>
            <el-radio label="group">群组任务</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
            label="选择群组"
            v-if="form.taskType === 'group'"
        >
          <el-select
              v-model="form.groupId"
              placeholder="请选择群组"
              @change="handleGroupChange"
          >
            <el-option
                v-for="group in userGroups"
                :key="group.groupID"
                :label="group.groupName"
                :value="group.groupID"
            />
          </el-select>
        </el-form-item>


      </el-form>

      <template #footer>
        <el-button style="width: 100px;background: #ad61fb; color: white;border: none"
                   @click="showSmartInput = true">
          <el-icon>
            <MagicStick/>
          </el-icon>
          智能添加
        </el-button>

        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog
        v-model="showSmartInput"
        title="智能输入"
        width="400px"
        :close-on-click-modal="false"
    >
      <div class="smart-input-container">
        <el-input
            v-model="smartInputText"
            type="textarea"
            :rows="4"
            placeholder="请输入日程描述，例如：今日中午13点在会议室开两小时会"
        />
        <div class="voice-recognition">
          <el-button
              circle
              :type="isRecording ? 'danger' : 'primary'"
              @click="toggleRecording"
              :loading="isProcessing"
          >
            <el-icon>
              <Microphone v-if="!isProcessing"/>
              <Loading v-else/>
            </el-icon>
          </el-button>
          <div class="status-text">{{ statusText }}</div>
          <div v-if="isRecording" class="recording-visualizer">
            <div
                v-for="(h, i) in barHeights"
                :key="i"
                class="bar"
                :style="{ height: `${h}px` }"
            ></div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSmartInput = false">取消</el-button>
        <el-button type="primary" @click="parseSmartInput">解析</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {Loading, MagicStick, Microphone, Plus} from '@element-plus/icons-vue'
import axios from '../plugins/axios'
import {ElMessage} from 'element-plus'

export default {
  components: {Loading, Microphone, MagicStick, Plus},
  data() {
    return {
      position: {x: 40, y: window.innerHeight - 80},
      dragStartPosition: {x: 0, y: 0},
      justDragged: false,
      isDragging: false,
      startPos: {x: 0, y: 0},
      showDialog: false,
      showSmartInput: false,
      smartInputText: '',
      form: {
        content: '',
        startTime: '',
        endTime: '',
        priority: 1,
        resources: [],
        taskType: 'personal',
        groupId: ''
      },
      resourceOptions: ['会议室', '投影仪', '电脑', '资料', '其他'],
      userGroups: [],
      isRecording: false,
      isProcessing: false,
      statusText: '点击开始录音',
      audioContext: null,
      analyser: null,
      audioStream: null,
      audioFilePath: null,
      barHeights: [10, 10, 10, 10, 10],
      startRecordingInterval: null,
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.handleDrag)
    window.addEventListener('mouseup', this.stopDrag)
    window.addEventListener('resize', this.checkPosition)
    this.loadUserGroups()
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.handleDrag)
    window.removeEventListener('mouseup', this.stopDrag)
    window.removeEventListener('resize', this.checkPosition)
    this.cleanup()
  },
  methods: {
    startDrag(e) {
      this.isDragging = true
      this.startPos = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y
      }
      this.dragStartPosition = {x: e.clientX, y: e.clientY}
      e.preventDefault()
    },
    handleDrag(e) {
      if (!this.isDragging) return
      this.position = {
        x: e.clientX - this.startPos.x,
        y: e.clientY - this.startPos.y
      }
    },
    stopDrag(e) {
      if (!this.isDragging) return

      const dx = Math.abs(e.clientX - this.dragStartPosition.x)
      const dy = Math.abs(e.clientY - this.dragStartPosition.y)
      const isActualDrag = dx > 5 || dy > 5

      this.isDragging = false
      this.checkPosition()

      if (isActualDrag) {
        this.justDragged = true
        setTimeout(() => {
          this.justDragged = false
        }, 100)
        e.preventDefault()
        e.stopPropagation()
      }
    },
    handleClick(e) {
      if (this.justDragged || this.isDragging) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      this.showDialog = true
    },
    checkPosition() {
      const maxX = window.innerWidth - 50
      const maxY = window.innerHeight - 50
      this.position = {
        x: Math.max(0, Math.min(this.position.x, maxX)),
        y: Math.max(0, Math.min(this.position.y, maxY))
      }
    },
    disabledEndDate(time) {
      const { startTime } = this.form;
      if (!startTime) return false;

      const start = new Date(startTime);
      const end = new Date(time);

      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      return endDate.getTime() < startDate.getTime();
    },

    handleEndTimeChange(value) {
      const { startTime } = this.form;
      if (!startTime || !value) return;

      const start = new Date(startTime);
      const end = new Date(value);


      const isSameDay =
          start.getFullYear() === end.getFullYear() &&
          start.getMonth() === end.getMonth() &&
          start.getDate() === end.getDate();

      if (isSameDay && end.getTime() <= start.getTime()) {

        const adjustedEndTime = new Date(start.getTime() + 30 * 60 * 1000);
        this.form.endTime = adjustedEndTime;
        this.$message.warning('结束时间必须晚于开始时间，已自动调整为30分钟后');
      }
    },
    async loadUserGroups() {
      try {
        const response = await axios.post('user_groups/', {
          username: localStorage.getItem('username') || ''
        })
        this.userGroups = response.data.data || []
      } catch (error) {
        console.error('加载群组失败:', error)
        ElMessage.error('加载群组信息失败')
      }
    },
    handleTaskTypeChange(val) {
      if (val === 'personal') {
        this.form.groupId = ''
      }
    },
    handleGroupChange(val) {
      this.form.resources = []
    },
    async submitForm() {
      if (!this.form.content) {
        ElMessage.error('请填写日程内容');
        return;
      }

      if (!this.form.startTime) {
        ElMessage.error('请选择开始时间');
        return;
      }

      if (!this.form.endTime) {
        ElMessage.error('请选择结束时间');
        return;
      }

      if (new Date(this.form.endTime) <= new Date(this.form.startTime)) {
        ElMessage.error('结束时间必须晚于开始时间');
        return;
      }

      if (this.form.taskType === 'group' && !this.form.groupId) {
        ElMessage.error('请选择群组');
        return;
      }

      try {
        let response;
        const payload = {
          content: this.form.content,
          startTime: new Date(this.form.startTime).getTime() / 1000,
          endTime: new Date(this.form.endTime).getTime() / 1000,
          resource: this.form.resources,
          priority: this.form.priority,
          executor: localStorage.getItem("username"),
          class: this.form.taskType === 'personal' ? 'personal' : 'team'
        };

        if (this.form.taskType === 'group') {
          payload.groupID = this.form.groupId;
        }

        response = await axios.post("addSchedule/", payload);

        if (response.data.success) {
          this.$emit('schedule-added');
          ElMessage.success('日程添加成功');
          this.showDialog = false;
        } else if (response.data.conflict) {
          this.$confirm(
              "检测到事件冲突，是否应用智能调节？",
              "提示",
              {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
              }
          ).then(async () => {
            const adjustResponse = await axios.post("adjustSchedule/", payload);
            if (adjustResponse.data.success) {
              this.$message.success("日程调整成功");
              this.$emit('schedule-added');
            } else {
              this.$message.error("日程调整失败");
            }
          }).catch(() => {
            this.$message.info("已取消调整");
          });
        } else {
          ElMessage.error(response.data.message || '添加日程失败');
        }
      } catch (error) {
        console.error('添加日程失败:', error);
        ElMessage.error('添加日程失败: ' + (error.response?.data?.message || error.message));
      }
    },

    resetForm() {
      this.form = {
        content: '',
        startTime: '',
        endTime: '',
        priority: 3,
        resources: [],
        taskType: 'personal',
        groupId: ''
      }
    },
    handleDialogClosed() {
      this.resetForm();
    },
    async parseSmartInput() {
      try {
        const response = await axios.post('smart_input/', {
          text: this.smartInputText,
          username: localStorage.getItem('username') || ''
        })
        if (response.data.success) {
          this.form = response.data.data
          this.showSmartInput = false
        } else {
          console.error(response.data.message)
        }
      } catch (error) {
        console.error('解析失败', error)
        ElMessage.error('解析失败')
      }
    },

    async toggleRecording() {
      if (this.isRecording) {
        await this.stopRecording()
      } else {
        await this.startRecording()
      }
    },

    async startRecording() {
      try {
        this.audioFilePath = await window.electronAPI.startRecording()
        console.log(this.audioFilePath)
        this.isRecording = true
        ElMessage.success('录音已开始')
        this.startRecordingInterval = setInterval(() => {
          this.barHeights = this.barHeights.map(() => Math.random() * 30 + 5)
        }, 100)
      } catch (error) {
        ElMessage.error(`录音启动失败: ${error.message}`)
      }
    },

    async stopRecording() {
      try {
        const success = await window.electronAPI.stopRecording()
        if (success && this.audioFilePath) {
          await this.sendAudioPathToBackend(this.audioFilePath)
          ElMessage.success('录音文件已发送')
        }
      } catch (error) {
        ElMessage.error(`录音停止失败: ${error.message}`)
      } finally {
        this.isRecording = false
        this.audioFilePath = null
        clearInterval(this.startRecordingInterval)
        this.startRecordingInterval = null
      }
    },

    async sendAudioPathToBackend(filePath) {
      try {
        const response = await axios.post('audio_path_upload/', {
          audio_path: filePath,
        })

        if (response.data.success) {
          this.smartInputText = response.data.data[0]
        } else {
          throw new Error(response.data.message || '处理失败')
        }
      } catch (error) {
        console.error('发送音频路径失败:', error)
        throw error
      }
    },

    getRandomHeight() {
      return Math.random() * 30 + 5
    },

    cleanup() {
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop())
      }
      if (this.audioContext) {
        this.audioContext.close()
      }

      this.isRecording = false
      this.isProcessing = false
      this.statusText = '点击开始录音'
      this.audioContext = null
      this.analyser = null
      this.audioStream = null
    },

  },

}
</script>

<style scoped>
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

.smart-input-container {
  position: relative;
}

.voice-recognition {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.status-text {
  font-size: 12px;
  color: #666;
  min-height: 18px;
}

.recording-visualizer {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 50px;
  gap: 3px;
}

.recording-visualizer .bar {
  width: 6px;
  background: #409eff;
  border-radius: 3px;
  transition: height 0.1s;
}

</style>