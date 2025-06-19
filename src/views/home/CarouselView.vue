<template>
  <el-container style="height: 100%">
    <el-main>
      <div class="carousel-container">
        <el-carousel
            ref="carousel"
            :interval="0"
            type="card"
            arrow="never"
            :initial-index="initialIndex"
            @change="handleCarouselChange"
        >
          <el-carousel-item
              v-for="(day, index) in scheduleData"
              :key="index"
              :class="{ 'inactive-item': activeIndex !== index }"
          >
            <div class="schedule-card">
              <el-button
                  class="add-event-button"
                  @click="openAddEventDialog(day.date)"
              >
                <el-icon>
                  <Plus/>
                </el-icon>
              </el-button>

              <!-- 日期 -->
              <div class="date">{{ day.date }}</div>

              <!-- 分割条 -->
              <hr class="divider"/>

              <!-- 事件列表 -->
              <div class="events">
                <div v-if="day.events.length === 0" class="empty-state">
                  <img
                      src="../../assets/empty.png"
                      alt="icon"
                      style="width: 80px; height: 80px"
                  />
                  <div class="empty-text">暂无日程，点击右上角添加</div>
                </div>

                <div
                    v-for="(event, i) in day.events"
                    v-else
                    :key="i"
                    class="event-item"
                    :class="{ 'completed': event.state }"
                >
                  <div
                      class="circle-button"
                      :class="{ 'completed': event.state }"
                      @click="toggleEventStatus(event)"
                  >
                    <el-icon v-if="event.state === 1">
                      <Check/>
                    </el-icon>
                  </div>

                  <div class="event-content">
                    <div class="event-title">{{ event.content }}</div>
                    <div class="event-time">{{ event.startTime }} - {{ event.endTime }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>

        <div class="custom-controls">
          <el-button
              class="control-button"
              @click="prevSlide"
              :icon="ArrowLeft"
          ></el-button>
          <el-button
              class="control-button"
              @click="nextSlide"
              :icon="ArrowRight"
          ></el-button>
        </div>
      </div>
    </el-main>

    <!-- 添加日程的对话框 -->
    <el-dialog title="添加日程" v-model="addEventDialogVisible" width="30%">
      <el-form :model="newEventForm" label-width="80px">
        <el-form-item label="事件内容">
          <el-input
              v-model="newEventForm.content"
              placeholder="请输入内容"
          ></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
              v-model="newEventForm.startTime"
              type="datetime"
              placeholder="选择开始时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
              v-model="newEventForm.endTime"
              type="datetime"
              placeholder="选择结束时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="所需资源">
          <el-input v-model="newEventForm.resource"></el-input>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newEventForm.priority" placeholder="请选择优先级">
            <el-option label="高" :value="3"></el-option>
            <el-option label="中" :value="2"></el-option>
            <el-option label="低" :value="1"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addEventDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addEvent">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script>
import {ArrowLeft, ArrowRight, Plus, Check, Calendar} from "@element-plus/icons-vue";
import {ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElButton, ElIcon} from "element-plus";
import axios from "../../plugins/axios.js";

export default {
  computed: {
    ArrowRight() {
      return ArrowRight;
    },
    ArrowLeft() {
      return ArrowLeft;
    },
  },
  components: {Calendar, Check, Plus, ElIcon},
  data() {
    const today = new Date().toISOString().split("T")[0];
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    const scheduleData = [];
    for (let i = -15; i < 15; i++) {
      const date = new Date(year, month, day + i);
      const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      scheduleData.push({
        date: formattedDate,
        events: [],
      });
    }

    const initialIndex = scheduleData.findIndex((day) => day.date === today);

    return {
      scheduleData,
      initialIndex,
      addEventDialogVisible: false,
      newEventForm: {
        content: "",
        startTime: null,
        endTime: null,
        resource: "",
      },
      activeIndex: initialIndex,
    };
  },
  mounted() {
    this.getEventList();
  },
  methods: {
    prevSlide() {
      this.$refs.carousel.prev();
    },
    nextSlide() {
      this.$refs.carousel.next();
    },
    openAddEventDialog(date) {
      this.newEventForm.date = date;
      this.newEventForm.startTime = new Date();
      this.newEventForm.endTime = null;
      this.newEventForm.content = "";
      this.newEventForm.resource = "";
      this.addEventDialogVisible = true;
    },
    async getEventList() {
      try {
        const response = await axios.post("getSchedule/", {
          username: localStorage.getItem("username")
        });

        if (response.data.success) {
          this.scheduleData.forEach(day => {
            day.events = [];
          });
          response.data.events.forEach(event => {
            const eventDate = event.startTime.toString().split('T')[0];
            const day = this.scheduleData.find(d => d.date === eventDate);
            if (day) {
              day.events.push({
                id: event.id,
                content: event.content,
                startTime: event.startTime.toString().split('T')[1].split('Z')[0].slice(0, 5),
                endTime: event.endTime.toString().split('T')[1].split('Z')[0].slice(0, 5),
                state: event.state || 0,
                class: event.class,
                resource: event.resource,
                groupName: event.groupName,
                priority: event.priority
              });
            }
          });
          this.$forceUpdate();
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("获取事件列表失败:", error);
        this.$message.error("请求失败，请稍后重试");
      }
    },
    async addEvent() {
      this.addScheduleVisible = false;
      try {
        const response = await axios.post("addSchedule/", {
              content: this.newEventForm.content,
              startTime: this.newEventForm.startTime.getTime() / 1000,
              endTime: this.newEventForm.endTime.getTime() / 1000,
              resource: this.newEventForm.resource,
              priority: this.newEventForm.priority,
              executor: localStorage.getItem("username"),
              class: "personal"
            }
        );
        if (response.data.success) {
          await this.getEventList()
          this.$message.success("日程添加成功");
        } else if (response.data.conflict) {
          this.$confirm("检测到事件冲突，是否应用智能调节？", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }).then(async () => {
            const adjustResponse = await axios.post("adjustSchedule/", {
              content: this.newEventForm.content,
              startTime: this.newEventForm.startTime.getTime() / 1000,
              endTime: this.newEventForm.endTime.getTime() / 1000,
              resource: this.newEventForm.resource,
              executor: localStorage.getItem("username"),
              priority: this.newEventForm.priority,
              class: "personal"
            });

            if (adjustResponse.data.success) {
              this.$message.success("日程调整成功");
              await this.getEventList()
            } else {
              this.$message.error("日程调整失败");
            }
          }).catch(() => {
            this.$message.info("已取消调整");
          });
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        this.$message.error("请求失败，请稍后重试");
      }
    },

    async toggleEventStatus(event) {
      if (event.state === 0)
        try {
          const response = await axios.post('updateScheduleState/', {
            id: event.id,
            class: event.class,
            state: 1
          })
          if (response.data.success) {
            await this.getEventList()
          }
        } catch (error) {
          this.$message.error("请求失败，请稍后重试");
        }
      else {
        try {
          const response = await axios.post('updateScheduleState/', {
            id: event.id,
            class: event.class,
            state: 0
          })
          if (response.data.success) {
            await this.getEventList()
          }
        } catch (error) {
          this.$message.error("请求失败，请稍后重试");
        }
      }

    },

    getDateRange(startDate, endDate) {
      const dates = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    },

    formatTime(date) {
      if (!date) return "";
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${month}-${day} ${hours}:${minutes}`;
    },
    handleCarouselChange(index) {
      this.activeIndex = index;
    },
  },
}
;
</script>

<style>
.carousel-container {
  background-color: #fafafb;
  width: 95%;
  padding: 20px;
  height: 90%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.el-carousel {
  width: 90% !important;
  margin: 0 auto !important;
  height: 90% !important;
}

.el-carousel__indicators {
  display: none !important;
}

.el-carousel__container {
  height: 100% !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.el-carousel__item {
  width: 45% !important;
  margin: 0 10px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  height: 100% !important;
}

.el-carousel__item.inactive-item {
  opacity: 0.4; /* 调暗非激活项 */
}

.schedule-card {
  background-color: #fff !important;
  border-radius: 30px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  transition: box-shadow 0.3s ease !important;
  padding: 16px !important;
  width: 90% !important;
  height: 90% !important;
  position: relative !important;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.add-event-button {
  position: absolute !important;
  top: 10px !important;
  right: 10px !important;
  background-color: transparent !important;
  border: none !important;
  font-size: 18px !important;
  color: #409eff !important;
  cursor: pointer !important;
}

.date {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #409eff;
}

.divider {
  border: 0;
  border-top: 1px solid #e8ecec;
  margin: 12px 0;
  width: 100%;
}

.events {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  flex: 1;
  justify-content: flex-start;
  align-items: flex-start;
}

.events:empty {
  justify-content: center;
  align-items: center;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  width: 100%;
}

.event-item.completed {
  background-color: #f5f5f5;
  opacity: 0.6;
}

.event-content {
  flex: 1;
}

.event-title {
  font-size: 16px;
  color: #333;
}

.event-time {
  font-size: 14px;
  color: #666;
}

.custom-controls {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.control-button {
  background-color: transparent !important;
  border: none !important;
  color: #409eff !important;
  font-size: 24px !important;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-container:hover .control-button {
  opacity: 1;
}

.circle-button {
  width: 20px;
  height: 20px;
  border: 2px solid #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.circle-button.completed {
  background-color: #409eff;
  border-color: #409eff;
}

.circle-button.completed .el-icon {
  color: white;
  font-size: 12px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #909399;
}

.empty-state .el-icon {
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  text-align: center;
}
</style>