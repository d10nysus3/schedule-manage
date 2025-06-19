<template>
  <el-container style="height: 100vh">
    <el-main style="padding: 0; height: 100%">
      <div class="timebox" style="height: 100%">
        <div class="top-box">
          <div class="xl-title">
            <el-button
                type="primary"
                size="default"
                @click="openAddScheduleDialog"
                style="margin-left: 10px"
            >
              添加日程安排
            </el-button>
            <el-button-group style="margin-left: 20px">
              <el-button
                  :type="taskFilter === 'all' ? 'primary' : 'default'"
                  @click="taskFilter = 'all'"
              >
                全部任务
              </el-button>
              <el-button
                  :type="taskFilter === 'unfinished' ? 'primary' : 'default'"
                  @click="taskFilter = 'unfinished'"
              >
                未完成任务
              </el-button>
            </el-button-group>

          </div>
          <div class="time-controller">
            <el-date-picker
                v-model="selectedDate"
                placeholder="选择日期"
                @change="handleDateChange"
                style="width: 140px; margin: 0 6px"
            />
          </div>
        </div>
        <div class="chart-container">
          <div class="time-axis">
            <div
                v-for="time in visibleTimeSlots"
                :key="time"
                class="time-slot"
                :style="{ height: timeSlotHeight * 60 + 'px' }"
            >
              {{ time }}
            </div>
          </div>

          <div class="date-axis-container">
            <div class="date-axis">
              <div
                  v-for="(date, index) in currentWeekDates"
                  :key="index"
                  class="date-column"
              >
                <div class="date-header">
                  {{ date }}<br/>{{ days[index] }}
                </div>
                <div class="events-container">
                  <!-- 事件块 -->
                  <el-tooltip
                      v-for="(event, eventIndex) in getFilteredEventsForDate(date)"
                      :key="eventIndex"
                      placement="top"
                      :popper-options="{ className: 'event-tooltip' }"
                  >
                    <template #content>
                      <div class="event-details">
                        <div><strong>开始时间:</strong> {{ formatDateTime(event.startTime) }}</div>
                        <div><strong>结束时间:</strong> {{ formatDateTime(event.endTime) }}</div>
                        <div><strong>所需资源:</strong> {{ event.resource || "无" }}</div>
                        <div><strong>执行人:</strong> {{ event.executor || "无" }}</div>
                        <div><strong>状态:</strong> {{ event.state === 1 ? '已完成' : '未完成' }}</div>
                      </div>
                    </template>
                    <div
                        class="event-block"
                        :style="getEventStyle(event)"
                        @click="openEventDetail(event)"
                        @contextmenu.prevent="handleRightClick(event, $event)"
                    >
                      <div class="event-content">
                        {{ event.content }}
                        <span v-if="getOverlapCount(event) > 1" class="overlap-badge">
                          {{ getOverlapCount(event) }}
                        </span>
                      </div>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-main>

    <!-- 添加日程的对话框 -->
    <el-dialog title="添加日程" v-model="addScheduleVisible" width="30%">
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
              :disabled-date="disabledEndDate"
              @change="handleEndTimeChange"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="所需资源">
          <el-input v-model="newEventForm.resource" placeholder="请输入所需资源"></el-input>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newEventForm.priority" placeholder="请选择优先级">
            <el-option label="高" :value="3"></el-option>
            <el-option label="中" :value="2"></el-option>
            <el-option label="低" :value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="执行人">
          <el-select v-model="newEventForm.executor" placeholder="请选择执行人">
            <el-option
                v-for="member in groupMembers"
                :key="member"
                :label="member"
                :value="member"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addScheduleVisible = false">取消</el-button>
          <el-button type="primary" @click="addEvent">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 事件详情对话框 -->
    <el-dialog title="事件详情" v-model="eventDetailVisible" width="30%">
      <el-form :model="currentEvent" label-width="80px">
        <el-form-item label="事件内容">
          <el-input v-model="currentEvent.content"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
              v-model="currentEvent.startTime"
              type="datetime"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
              v-model="currentEvent.endTime"
              type="datetime"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="所需资源">
          <el-input v-model="currentEvent.resource"></el-input>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="currentEvent.priority">
            <el-option label="高" :value="3"></el-option>
            <el-option label="中" :value="2"></el-option>
            <el-option label="低" :value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="执行人">
          <el-select v-model="currentEvent.executor">
            <el-option
                v-for="member in groupMembers"
                :key="member"
                :label="member"
                :value="member"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="currentEvent.state">
            <el-radio :label=0>未完成</el-radio>
            <el-radio :label=1>已完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="eventDetailVisible = false">取消</el-button>
          <el-button type="primary" @click="updateEvent">保存</el-button>
          <el-button type="danger" @click="deleteEvent">删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div
        v-show="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
    >
      <div
          v-for="(event, index) in overlappingEvents"
          :key="index"
          class="context-menu-item"
          @click="switchToEvent(index)"
      >
        {{ event.content }}
      </div>
    </div>
  </el-container>
</template>

<script>
import axios from "../../plugins/axios.js";

export default {
  data() {
    return {
      days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      timeSlots: this.generateTimeSlots(),
      visibleTimeSlots: this.generateVisibleTimeSlots(),
      timeSlotHeight: 1,
      currentWeekDates: [],
      selectedDate: new Date(),
      addScheduleVisible: false,
      eventDetailVisible: false,
      taskFilter: "all",
      newEventForm: {
        content: null,
        startTime: null,
        endTime: null,
        resource: null,
        priority: null,
        executor: null
      },
      currentEvent: {},
      groupMembers: ["张三", "李四", "王五", "赵六"],
      events: [],

      contextMenuVisible: false,
      contextMenuLeft: 0,
      contextMenuTop: 0,
      overlappingEvents: []
    };
  },
  mounted() {
    this.generateCurrentWeekDates();
    this.getGroupMembers();
    this.getGroupEvents();
    document.addEventListener('click', this.closeContextMenu);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeContextMenu);
  },
  methods: {
    generateTimeSlots() {
      const slots = [];
      for (let hour = 8; hour <= 19; hour++) {
        for (let minute = 0; minute < 60; minute++) {
          slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
        }
      }
      return slots;
    },

    async getGroupMembers() {
      try {
        const response = await axios.post("getGroupMembers/", {
              groupID: localStorage.getItem("groupID"),
            }
        );
        if (response.data.success) {
          this.groupMembers = response.data.groupMembers;
        } else {
          this.groupMembers = [];
        }
      } catch (error) {
        this.$message.error("群组成员请求失败");
      }
    },

    async getGroupEvents() {
      try {
        const response = await axios.post("getGroupEvents/", {
              groupID: localStorage.getItem("groupID"),
            }
        );
        if (response.data.success) {
          this.events = response.data.groupInfo;
        } else {
          this.events = [];
        }
      } catch (error) {
        this.$message.error("群组信息请求失败");
      }
    },

    generateVisibleTimeSlots() {
      const slots = [];
      for (let hour = 8; hour <= 19; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
      }
      return slots;
    },

    generateCurrentWeekDates() {
      const startOfWeek = new Date(this.selectedDate);
      if (startOfWeek.getDay() === 0) {
        startOfWeek.setDate(startOfWeek.getDate() - 6);
      } else {
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      }

      this.currentWeekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        this.currentWeekDates.push(
            `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
                .getDate()
                .toString()
                .padStart(2, "0")}`
        );
      }
    },

    handleDateChange(date) {
      this.selectedDate = date;
      this.generateCurrentWeekDates();
    },

    getEventsForDate(date) {
      if (this.events) {
        return this.events.filter((event) => {
          const eventDate = event.startTime.split("T")[0];
          return eventDate === date;
        });
      }
      return [];
    },

    getFilteredEventsForDate(date) {
      const events = this.getEventsForDate(date);
      if (this.taskFilter === 'unfinished') {
        return events.filter(event => event.state !== 1);
      }
      return events;
    },

    formatDateTime(dateTime) {
      return `${dateTime.split("T")[0]} ${dateTime.split("T")[1].split("Z")[0].slice(0, 5)}`;
    },

    getEventStyle(event) {
      const startTime = event.startTime.split("T")[1].split("Z")[0].slice(0, 5);
      const endTime = event.endTime.split("T")[1].split("Z")[0].slice(0, 5);
      const startIndex = this.timeSlots.findIndex((slot) => slot === startTime);
      const endIndex = this.timeSlots.findIndex((slot) => slot === endTime);
      const startOffset = this.timeSlots.findIndex((slot) => slot === "08:00");

      const top = (startIndex - startOffset) * this.timeSlotHeight;
      const height = (endIndex - startIndex) * this.timeSlotHeight;

      let backgroundColor;
      if (event.state === 1) {
        backgroundColor = "rgba(182,178,178,0.34)";
      } else {
        switch (event.priority) {
          case 3:
            backgroundColor = "#ff4d4f";
            break;
          case 2:
            backgroundColor = "#ffa940";
            break;
          case 1:
            backgroundColor = "#73d13d";
            break;
          default:
            backgroundColor = "#409eff";
        }
      }

      return {
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor,
      };
    },

    getOverlapCount(event) {
      const startTime = new Date(event.startTime).getTime();
      const endTime = new Date(event.endTime).getTime();

      const eventsToCheck = this.taskFilter === 'unfinished'
          ? this.events.filter(e => e.state !== 1)
          : this.events;

      const overlapCount = eventsToCheck.filter(e => {

        if (e.id === event.id) return false;

        if (this.taskFilter === 'unfinished' && e.state === 1) return false;

        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();

        return (
            (eStart >= startTime && eStart < endTime) ||
            (eEnd > startTime && eEnd <= endTime) ||
            (eStart <= startTime && eEnd >= endTime)
        );
      }).length;

      return overlapCount > 0 ? overlapCount + 1 : 0;
    },

    openAddScheduleDialog() {
      this.addScheduleVisible = true;
    },

    disabledEndDate(time) {
      const { startTime } = this.newEventForm;
      if (!startTime) return false;

      const start = new Date(startTime);
      const end = new Date(time);

      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      return endDate.getTime() < startDate.getTime();
    },

    handleEndTimeChange(value) {
      const { startTime } = this.newEventForm;
      if (!startTime || !value) return;

      const start = new Date(startTime);
      const end = new Date(value);


      const isSameDay =
          start.getFullYear() === end.getFullYear() &&
          start.getMonth() === end.getMonth() &&
          start.getDate() === end.getDate();

      if (isSameDay && end.getTime() <= start.getTime()) {

        const adjustedEndTime = new Date(start.getTime() + 30 * 60 * 1000);
        this.newEventForm.endTime = adjustedEndTime;
        this.$message.warning('结束时间必须晚于开始时间，已自动调整为30分钟后');
      }
    },

    async addEvent() {
      this.addScheduleVisible = false;
      try {
        const response = await axios.post("addSchedule/", {
              groupID: localStorage.getItem("groupID"),
              content: this.newEventForm.content,
              startTime: this.newEventForm.startTime.getTime()/1000,
              endTime: this.newEventForm.endTime.getTime()/1000,
              resource: this.newEventForm.resource,
              priority: this.newEventForm.priority,
              executor: this.newEventForm.executor,
              class:"team"
            }
        );
        if (response.data.success) {
          await this.getGroupEvents();
          this.$message.success("日程添加成功");
        } else if (response.data.conflict) {
          this.$confirm("检测到事件冲突，是否应用智能调节？", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          })
              .then(async () => {
                const adjustResponse = await axios.post("adjustSchedule/", {
                  groupID: localStorage.getItem("groupID"),
                  content: this.newEventForm.content,
                  startTime: this.newEventForm.startTime.getTime()/1000,
                  endTime: this.newEventForm.endTime.getTime()/1000,
                  resource: this.newEventForm.resource,
                  executor: this.newEventForm.executor,
                  priority: this.newEventForm.priority,
                  class:"team"
                });

                if (adjustResponse.data.success) {
                  this.$message.success("日程调整成功");
                  await this.getGroupEvents();
                } else {
                  this.$message.error("日程调整失败");
                }
              })
              .catch(() => {
                this.$message.info("已取消调整");
              });
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        this.$message.error("请求失败，请稍后重试");
      }
    },

    openEventDetail(event) {
      const formatTime = (utcString) => {
        if (!utcString) return '未设置';
        try {
          return utcString.replace('T', ' ').replace('Z', '');
        } catch (e) {
          return utcString;
        }
      };
      this.currentEvent = JSON.parse(JSON.stringify(event));
      this.currentEvent.startTime =new Date(formatTime(event.startTime));
      this.currentEvent.endTime = new Date(formatTime(event.endTime));

      this.eventDetailVisible = true;
    },

    async updateEvent() {
      try {
        console.log(this.currentEvent);
        const response = await axios.post("updateTeamSchedule/", {
          id: this.currentEvent.id,
          content: this.currentEvent.content,
          startTime: this.currentEvent.startTime.getTime()/1000,
          endTime: this.currentEvent.endTime.getTime()/1000,
          resource: this.currentEvent.resource,
          priority: this.currentEvent.priority,
          executor: this.currentEvent.executor,
          state: this.currentEvent.state,
        });
        console.log(response.data);
        if (response.data.success) {
          this.$message.success("事件更新成功");
          await this.getGroupEvents();
          this.eventDetailVisible = false;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        this.$message.error("更新失败，请稍后重试");
      }
    },

    async deleteEvent() {
      try {
        const response = await axios.post("deleteSchedule/", {
          id: this.currentEvent.id,
          class: "team"
        });

        if (response.data.success) {
          this.$message.success("事件删除成功");
          await this.getGroupEvents();
          this.eventDetailVisible = false;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        this.$message.error("删除失败，请稍后重试");
      }
    },

    handleRightClick(event, e) {
      const overlapping = this.events.filter(e => {
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        const eventStart = new Date(event.startTime).getTime();
        const eventEnd = new Date(event.endTime).getTime();
        return (
            e.id !== event.id &&
            ((eStart >= eventStart && eStart < eventEnd) ||
                (eEnd > eventStart && eEnd <= eventEnd) ||
                (eStart <= eventStart && eEnd >= eventEnd))
        );
      });

      if (overlapping.length > 0) {
        this.overlappingEvents = [event, ...overlapping];
        this.contextMenuLeft = e.clientX;
        this.contextMenuTop = e.clientY;
        this.contextMenuVisible = true;
      }
    },

    switchToEvent(index) {
      this.openEventDetail(this.overlappingEvents[index]);
      this.closeContextMenu();
    },

    closeContextMenu() {
      this.contextMenuVisible = false;
    }
  },
};
</script>

<style scoped>
.timebox {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.top-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-container {
  display: flex;
  height: calc(100%);
  overflow: hidden;
}

.time-axis {
  margin-top: 20px;
  width: 60px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding-top: 30px;
}

.time-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #ddd;
}

.date-axis-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.date-axis {
  display: flex;
  height: 100%;
}

.date-column {
  flex: 1;
  border-right: 1px solid #ddd;
}

.date-header {
  text-align: center;
  padding: 8px;
  background: #f5f5f5;
  font-size: 12px;
  color: #333;
}

.events-container {
  position: relative;
  height: 100%;
  padding-top: 50px;
}

.event-block {
  position: absolute;
  left: 10px;
  right: 10px;
  color: white;
  padding: 4px;
  font-size: 12px;
  border-radius: 4px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.event-content {
  text-align: center;
  position: relative;
}

.overlap-badge {
  position: absolute;
  top: -20px;
  right: -8px;
  background-color: #fff;
  color: #333;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
}

.context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 2000;
  padding: 5px 0;
}

.context-menu-item {
  padding: 8px 20px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}
.event-tooltip {
  max-width: 200px;
  font-size: 12px;
}

.event-details div {
  margin-bottom: 4px;
}
</style>
