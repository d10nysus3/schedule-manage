<template>
  <el-container style="height: 100%">
    <el-main>
      <FullCalendar
          ref="calendar"
          :options="calendarOptions"
      />
    </el-main>

    <!-- 事件详情弹窗 -->
    <el-dialog
        title="事件详情"
        v-model="eventDetailDialogVisible"
        width="30%"
    >
      <el-form label-width="100px">
        <el-form-item label="事件内容">
          <el-input v-model="selectedEvent.title"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
              v-model="selectedEvent.start"
              type="datetime"
              placeholder="选择开始时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
              v-model="selectedEvent.end"
              type="datetime"
              placeholder="选择结束时间"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="selectedEvent.extendedProps.priority" placeholder="请选择优先级">
            <el-option label="低" :value="1"></el-option>
            <el-option label="中" :value="2"></el-option>
            <el-option label="高" :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="selectedEvent.extendedProps.state" placeholder="请选择状态">
            <el-option label="未开始" :value="0"></el-option>
            <el-option label="已完成" :value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所用资源">
          <el-input v-model="selectedEvent.extendedProps.resources"></el-input>
        </el-form-item>
        <el-form-item v-if="selectedEvent.extendedProps.class === 'team'" label="所属群组">
          <el-input v-model="selectedEvent.extendedProps.groupName" disabled></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="eventDetailDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteEvent">删除</el-button>
        <el-button type="primary" @click="saveEventChanges">保存</el-button>
      </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script>
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElButton, ElSelect, ElOption} from 'element-plus';
import axios from "../../plugins/axios.js";

export default {
  components: {
    FullCalendar,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElDatePicker,
    ElButton,
    ElSelect,
    ElOption
  },
  data() {
    return {
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        locale: "zh-cn",
        initialView: "dayGridMonth",
        editable: true,
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        eventBackgroundColor: "green",
        eventTextColor: "black",
        events: [],
        dateClick: this.handleDateClick,
        eventClick: this.handleEventClick,
      },
      selectedEvent: {
        id: null,
        title: "",
        start: null,
        end: null,
        extendedProps: {
          priority: 1,
          state: 0,
          resources: "",
          class: ""
        },
      },
      eventDetailDialogVisible: false,
    };
  },
  mounted() {
    this.getEventList();
  },
  methods: {
    handleDateClick(arg) {
      this.$refs.calendar.getApi().changeView("timeGridDay", arg.dateStr);
    },
    handleEventClick(info) {
      this.selectedEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        extendedProps: {
          priority: info.event.extendedProps.priority || 1,
          state: info.event.extendedProps.state || 0,
          resources: info.event.extendedProps.resources || "",
          class: info.event.extendedProps.class || "",
          groupName: info.event.extendedProps.groupName || ""
        }
      };
      this.eventDetailDialogVisible = true;
    },
    async getEventList() {
      try {
        const response = await axios.post("getSchedule/", {
          username: localStorage.getItem("username")
        });

        if (response.data.success) {
          const events = response.data.events.map(event => {
            const formatTime = (utcString) => {
              if (!utcString) return '未设置';
              try {
                return utcString.replace('T', ' ').replace('Z', '');
              } catch (e) {
                return utcString;
              }
            };

            let backgroundColor;
            switch (event.priority) {
              case 1:
                backgroundColor = '#30d14c';
                break;
              case 2:
                backgroundColor = '#f8d486';
                break;
              case 3:
                backgroundColor = '#d81717';
                break;
              default:
                backgroundColor = '#30d14c';
                break;
            }
            switch (event.state) {
              case 1:
                backgroundColor = '#939392';
                break;
              default:
                break;
            }

            return {
              id: event.id,
              title: event.content,
              start: formatTime(event.startTime),
              end: formatTime(event.endTime),
              backgroundColor: backgroundColor,
              extendedProps: {
                priority: event.priority,
                resources: event.resource,
                state: event.state || 0,
                class: event.class,
                groupName: event.groupName || ""
              }
            };
          });
          this.calendarOptions.events = events;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("获取事件列表失败:", error);
        this.$message.error("请求失败，请稍后重试");
      }
    },
    async saveEventChanges() {
      try {
        const eventData = {
          id: this.selectedEvent.id,
          content: this.selectedEvent.title,
          startTime: this.selectedEvent.start.getTime() / 1000,
          endTime: this.selectedEvent.end.getTime() / 1000,
          priority: this.selectedEvent.extendedProps.priority,
          state: this.selectedEvent.extendedProps.state,
          resource: this.selectedEvent.extendedProps.resources,
          class: this.selectedEvent.extendedProps.class,
          username: localStorage.getItem("username")
        };

        const response = await axios.post("updateSchedule/", eventData);

        if (response.data.success) {
          this.$message.success("事件更新成功");
          await this.getEventList();
          this.eventDetailDialogVisible = false;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("更新事件失败:", error);
        this.$message.error("更新事件失败，请稍后重试");
      }
    },
    async deleteEvent() {
      try {
        if (!this.selectedEvent.id) {
          this.$message.error("无法删除，事件ID不存在");
          return;
        }

        const response = await axios.post("deleteSchedule/", {
          id: this.selectedEvent.id,
          class: this.selectedEvent.extendedProps.class
        });

        if (response.data.success) {
          this.$message.success("事件删除成功");
          await this.getEventList();
          this.eventDetailDialogVisible = false;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("删除事件失败:", error);
        this.$message.error("删除事件失败，请稍后重试");
      }
    }
  },
};
</script>

<style scoped>
:deep(.fc) {
  background-color: #fafafb !important;
}

:deep(.fc-header-toolbar) {
  background-color: #fafafb !important;
}

:deep(.fc-event) {
  background-color: #bddac2 !important;
  border-color: #bddac2 !important;
  color: #333 !important;
}

:deep(.fc-day-today) {
  background-color: #bddac2 !important;
}

:deep(.fc-toolbar-title) {
  font-size: 40px !important;
  font-weight: bold !important;
}

:deep(.fc-timeGridWeek-view .fc-timegrid-event),
:deep(.fc-timeGridDay-view .fc-timegrid-event) {
  font-size: 15px !important;
  font-weight: bold !important;
}
</style>