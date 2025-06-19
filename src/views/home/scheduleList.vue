<template>
  <div class="task-dashboard">
    <h1 class="dashboard-title">任务清单</h1>

    <div class="cards-scroll-container" ref="cardsContainer">
      <div class="cards-wrapper" ref="cardsWrapper">
        <!-- 全部未完成任务卡片 -->
        <el-card class="task-card">
          <div slot="header" class="card-header">
            <span class="card-title">全部未完成任务</span>
            <el-badge :value="allTasks.filter(t => t.state === 0).length" class="badge"></el-badge>
          </div>
          <div class="task-list" ref="allTasksList">
            <div v-for="task in allTasks.filter(t => t.state === 0)" :key="'all-'+task.id" class="task-item">
              <div class="task-content">
                <div class="task-title">{{ task.scheduleContent }}</div>
                <div class="task-due-date">截止: {{ formatDateTime(task.endTime) }}</div>
              </div>
              <el-checkbox
                  :model-value="task.state === 1"
                  @change="toggleTaskState(task)"
              ></el-checkbox>
            </div>
            <div v-if="allTasks.length === 0" class="empty-tasks">暂无任务</div>
          </div>
        </el-card>

        <!-- 个人任务卡片 -->
        <el-card class="task-card">
          <div slot="header" class="card-header">
            <span class="card-title">我的任务</span>
            <el-badge :value="personalTasks.filter(t => t.state === 0).length" class="badge"></el-badge>
          </div>
          <div class="task-list" ref="personalTasksList">
            <div v-for="task in personalTasks.filter(t => t.state === 0)" :key="'personal-'+task.id" class="task-item">
              <div class="task-content">
                <div class="task-title">{{ task.scheduleContent }}</div>
                <div class="task-due-date">截止: {{ formatDateTime(task.endTime) }}</div>
              </div>
              <el-checkbox
                  :model-value="task.state === 1"
                  @change=" toggleTaskState(task)"
              ></el-checkbox>
            </div>
            <div v-if="personalTasks.length === 0" class="empty-tasks">暂无任务</div>
          </div>
        </el-card>

        <!-- 群组任务卡片 -->
        <el-card class="task-card" v-for="group in groupTasks" :key="'group-'+group.id">
          <div slot="header" class="card-header">
            <span class="card-title">{{ group.name }}</span>
            <el-badge :value="group.tasks.filter(t => t.state === 0).length" class="badge"></el-badge>
          </div>
          <div class="task-list" :ref="'groupTasksList'+group.id">
            <div v-for="task in group.tasks.filter(t => t.state === 0)" :key="'group-'+group.id+'-'+task.id" class="task-item">
              <div class="task-content">
                <div class="task-title">{{ task.scheduleContent }}</div>
                <div class="task-due-date">截止: {{ formatDateTime(task.endTime) }}</div>
              </div>
              <el-checkbox
                  :model-value="task.state === 1"
                  @change=" toggleTaskState(task)"
              ></el-checkbox>
            </div>
            <div v-if="group.tasks.length === 0" class="empty-tasks">暂无任务</div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 居中横向滚动条 -->
    <div class="scrollbar-center-container" v-show="showScrollbar">
      <div class="scrollbar-container" ref="scrollbar" @mousedown="onScrollbarClick">
        <div class="scrollbar-track">
          <div
              class="scrollbar-thumb"
              :style="{ width: this.thumbWidth + 'px', left: this.thumbPosition + 'px' }"
              @mousedown="startDrag"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "../../plugins/axios.js";

export default {
  name: 'TaskDashboard',
  data() {
    return {
      allTasks: [],
      personalTasks: [],
      groupTasks: [],
      userGroups: [],
      currentUser: localStorage.getItem('username') || '',
      thumbWidth: 100,
      thumbPosition: 0,
      isDragging: false,
      startX: 0,
      startLeft: 0,
      isMouseDown: false,
      startScrollX: 0,
      showScrollbar: false,
      isVerticalScrolling: false,
      currentVerticalScrollElement: null,
      startScrollY: 0,
      startMouseY: 0,
      isHorizontalScrolling: false
    }
  },
  mounted() {
    this.loadData();
    this.setupEventListeners();
  },
  beforeDestroy() {
    this.cleanupEventListeners();
  },
  methods: {
    async loadData() {
      if (!this.currentUser) {
        this.$message.error('用户未登录');
        return;
      }

      try {
        // 获取全部任务
        const allRes = await axios.post('all_tasks/', {
          username: this.currentUser
        });
        this.allTasks = allRes.data.data;

        // 获取个人任务
        const personalRes = await axios.post('personal_tasks/', {
          username: this.currentUser
        });
        this.personalTasks = personalRes.data.data;

        // 获取用户群组
        const groupsRes = await axios.post('user_groups/', {
          username: this.currentUser
        });
        this.userGroups = groupsRes.data.data;

        // 获取每个群组的任务
        for (const group of this.userGroups) {
          const groupRes = await axios.post('group_tasks/', {
            group_id: group.groupID,
            username: this.currentUser
          });
          if (groupRes.data.success) {
            this.groupTasks.push({
              id: group.groupID,
              name: group.groupName,
              tasks: groupRes.data.data
            });
          }
        }

        await this.$nextTick(() => {
          this.calculateThumbWidth();
          this.setupTaskListScroll();
        });
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$message.error('加载任务数据失败');
      }
    },

    formatDateTime(utcString) {
      if (!utcString) return '未设置';
      try {
        return utcString.replace('T', ' ').replace('Z', '');
      } catch (e) {
        return utcString;
      }
    },
    async toggleTaskState(task) {
      try {
        const newState = task.state === 1 ? 0 : 1;
        task.state = newState;

        const response = await axios.post('updateScheduleState/', {
          id: task.id,
          class: task.groupID ? 'team' : 'personal',
          state: newState
        });

        if (!response.data.success) {
          task.state = newState === 1 ? 0 : 1;
          this.$message.error(response.data.message || '更新状态失败');
        } else {
          const allTaskIndex = this.allTasks.findIndex(t => t.id === task.id);
          if (allTaskIndex !== -1) {
            this.allTasks[allTaskIndex].state = newState;
          }

          const personalTaskIndex = this.personalTasks.findIndex(t => t.id === task.id);
          if (personalTaskIndex !== -1) {
            this.personalTasks[personalTaskIndex].state = newState;
          }

          // 更新groupTasks中的状态
          for (const group of this.groupTasks) {
            const groupTaskIndex = group.tasks.findIndex(t => t.id === task.id);
            if (groupTaskIndex !== -1) {
              group.tasks[groupTaskIndex].state = newState;
              break;
            }
          }
        }
      } catch (error) {
        console.error('更新任务状态失败:', error);
        task.state = newState === 1 ? 0 : 1;
        this.$message.error('更新状态失败，请稍后重试');
      }
    },

    setupEventListeners() {
      window.addEventListener('resize', this.handleResize);
      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.stopDrag);

      // 修改为监听卡片容器的鼠标移动
      this.$refs.cardsContainer.addEventListener('mousemove', this.handleContainerMouseMove);
      this.$refs.cardsContainer.addEventListener('mousedown', this.handleContainerMouseDown);
      this.$refs.cardsContainer.addEventListener('mouseup', this.handleContainerMouseUp);

      // 添加鼠标滚轮事件
      this.$refs.cardsContainer.addEventListener('wheel', this.handleWheel, {passive: false});
    }
    ,

    cleanupEventListeners() {
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mouseup', this.stopDrag);

      this.$refs.cardsContainer.removeEventListener('mousemove', this.handleContainerMouseMove);
      this.$refs.cardsContainer.removeEventListener('mousedown', this.handleContainerMouseDown);
      this.$refs.cardsContainer.removeEventListener('mouseup', this.handleContainerMouseUp);
      this.$refs.cardsContainer.removeEventListener('wheel', this.handleWheel);
    }
    ,

    setupTaskListScroll() {

      const lists = [
        this.$refs.allTasksList,
        this.$refs.personalTasksList,
        ...Object.values(this.$refs).filter(ref => ref && ref.className === 'task-list')
      ];

      lists.forEach(list => {
        if (list) {
          list.addEventListener('mousedown', this.handleTaskListMouseDown);
        }
      });
    }
    ,

    handleContainerMouseDown(e) {
      // 检查是否点击在卡片上
      const card = e.target.closest('.task-card');
      const taskList = e.target.closest('.task-list');

      if (card || taskList) {
        // 如果在卡片或任务列表上，则准备垂直滚动
        this.isVerticalScrolling = true;
        this.currentVerticalScrollElement = taskList;
        this.startMouseY = e.clientY;
        this.startScrollY = taskList.scrollTop;
        taskList.style.cursor = 'grabbing';
      } else {
        // 否则准备水平滚动
        this.isHorizontalScrolling = true;
        this.startX = e.pageX;
        this.startScrollX = this.$refs.cardsWrapper.scrollLeft;
        this.$refs.cardsWrapper.style.cursor = 'grabbing';
      }
      e.preventDefault();
    }
    ,
    handleContainerMouseMove(e) {
      // 垂直滚动处理
      if (this.isVerticalScrolling && this.currentVerticalScrollElement) {
        const dy = e.clientY - this.startMouseY;
        this.currentVerticalScrollElement.scrollTop = this.startScrollY - dy;
        return;
      }

      // 水平滚动处理
      if (this.isHorizontalScrolling) {
        const walk = (e.pageX - this.startX) * 1.5;
        this.$refs.cardsWrapper.scrollLeft = this.startScrollX - walk;
        this.updateScrollBar();
      }
    }
    ,
    handleContainerMouseUp() {
      // 重置垂直滚动状态
      if (this.isVerticalScrolling && this.currentVerticalScrollElement) {
        this.currentVerticalScrollElement.style.cursor = '';
      }

      // 重置水平滚动状态
      if (this.isHorizontalScrolling) {
        this.$refs.cardsWrapper.style.cursor = '';
      }

      this.isVerticalScrolling = false;
      this.currentVerticalScrollElement = null;
      this.isHorizontalScrolling = false;
    }
    ,

    startHorizontalScroll(e) {
      this.isHorizontalScrolling = true;
      this.startX = e.pageX;
      this.startScrollX = this.$refs.cardsWrapper.scrollLeft;
      this.$refs.cardsWrapper.style.cursor = 'grabbing';
      e.preventDefault();
    }
    ,

    handleTaskListMouseDown(e) {
      this.isVerticalScrolling = true;
      this.currentVerticalScrollElement = e.currentTarget;
      this.startMouseY = e.clientY;
      this.startScrollY = e.currentTarget.scrollTop;
      e.currentTarget.style.cursor = 'grabbing';
      e.preventDefault();
      e.stopPropagation();
    }
    ,

    handleDocumentMouseMove(e) {
      // 处理垂直滚动
      if (this.isVerticalScrolling && this.currentVerticalScrollElement) {
        const dy = e.clientY - this.startMouseY;
        this.currentVerticalScrollElement.scrollTop = this.startScrollY - dy;
        return;
      }

      // 处理水平滚动
      if (this.isHorizontalScrolling) {
        const walk = (e.pageX - this.startX) * 1.5;
        this.$refs.cardsWrapper.scrollLeft = this.startScrollX - walk;
        this.updateScrollBar();
      }
    }
    ,

    handleDocumentMouseUp() {
      if (this.isVerticalScrolling && this.currentVerticalScrollElement) {
        this.currentVerticalScrollElement.style.cursor = 'grab';
      }

      if (this.isHorizontalScrolling) {
        this.$refs.cardsWrapper.style.cursor = 'grab';
      }

      this.isVerticalScrolling = false;
      this.currentVerticalScrollElement = null;
      this.isHorizontalScrolling = false;
    }
    ,

    calculateThumbWidth() {
      if (!this.$refs.cardsWrapper) return;

      const wrapper = this.$refs.cardsWrapper;
      const containerWidth = wrapper.clientWidth;
      const contentWidth = wrapper.scrollWidth;

      this.showScrollbar = contentWidth > containerWidth;

      if (this.showScrollbar) {
        const scrollbarWidth = this.$refs.scrollbar ? this.$refs.scrollbar.clientWidth : containerWidth * 0.5;

        const calculatedWidth = Math.max(
            50,
            Math.min(
                (containerWidth / contentWidth) * scrollbarWidth,
                scrollbarWidth * 0.8
            )
        );

        this.thumbWidth = Math.floor(calculatedWidth);
        this.updateScrollBar();
      }
    }
    ,

    updateScrollBar() {
      if (!this.showScrollbar || !this.$refs.cardsWrapper || !this.$refs.scrollbar) return;

      const wrapper = this.$refs.cardsWrapper;
      const scrollLeft = wrapper.scrollLeft;
      const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      const scrollbarWidth = this.$refs.scrollbar.clientWidth;

      if (maxScroll > 0) {
        this.thumbPosition = (scrollLeft / maxScroll) * (scrollbarWidth - this.thumbWidth);
      } else {
        this.thumbPosition = 0;
      }
    }
    ,

    startDrag(e) {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startLeft = this.thumbPosition;
      e.preventDefault();
      e.stopPropagation();
    }
    ,

    onScrollbarClick(e) {
      if (e.target === this.$refs.scrollbar || e.target.classList.contains('scrollbar-track')) {
        const scrollbar = this.$refs.scrollbar;
        const clickX = e.clientX - scrollbar.getBoundingClientRect().left;
        const scrollbarWidth = scrollbar.clientWidth;
        const wrapper = this.$refs.cardsWrapper;
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

        const newPosition = Math.min(
            Math.max(0, clickX - this.thumbWidth / 2),
            scrollbarWidth - this.thumbWidth
        );

        this.thumbPosition = newPosition;
        wrapper.scrollLeft = (newPosition / (scrollbarWidth - this.thumbWidth)) * maxScroll;
      }
    }
    ,

    handleDragMove(e) {
      if (this.isDragging) {
        const dx = e.clientX - this.startX;
        const scrollbarWidth = this.$refs.scrollbar.clientWidth;
        const newPosition = Math.min(
            Math.max(0, this.startLeft + dx),
            scrollbarWidth - this.thumbWidth
        );
        this.thumbPosition = newPosition;
        const wrapper = this.$refs.cardsWrapper;
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        wrapper.scrollLeft = (newPosition / (scrollbarWidth - this.thumbWidth)) * maxScroll;
      }
    }
    ,

    stopDrag() {
      this.isDragging = false;
    }
    ,

    handleWheel(e) {

      const card = e.target.closest('.task-card');
      const taskList = e.target.closest('.task-list');

      if (card || taskList) {

        e.preventDefault();
        const delta = Math.sign(e.deltaY) * 80;
        taskList.scrollTop += delta;
      } else {

        e.preventDefault();
        const wrapper = this.$refs.cardsWrapper;
        const delta = Math.sign(e.deltaY);
        const scrollStep = 50;
        let newScrollLeft = wrapper.scrollLeft + (delta * scrollStep);

        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));

        wrapper.scrollLeft = newScrollLeft;
        this.updateScrollBar();
      }
    }
    ,

    handleResize() {
      this.calculateThumbWidth();
    }
  },
  watch: {
    groupTasks() {
      this.$nextTick(() => {
        this.calculateThumbWidth();
        this.setupTaskListScroll();
      });
    }
  }
}
</script>

<style scoped>
.task-dashboard {
  padding: 20px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  margin-bottom: 20px;
  margin-top: -10px;
  color: #303133;
  font-size: 24px;
}

.cards-scroll-container {
  flex: 1;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.cards-wrapper {
  display: flex;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  height: 100%;
  cursor: grab;
}

.cards-wrapper::-webkit-scrollbar {
  display: none;
}

.cards-wrapper:active {
  cursor: grabbing;
}

.task-card {
  min-width: 320px;
  height: calc(100% - 20px);
  margin-right: 20px;
  flex-shrink: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: grab;
  user-select: none;
}

.card-header:active {
  cursor: grabbing;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.badge {
  margin-left: 10px;
}
:deep(.el-card__body){
  height: 100% !important;
}
.task-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(85% - 20px);
  /*overflow-y: auto;*/
  padding: 10px;
  cursor: grab;
  overscroll-behavior: contain;
  overflow: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.task-list {
  overflow-y: auto;
  cursor: grab;
}

.task-list::-webkit-scrollbar {
  display: none;
}

.task-list:active {
  cursor: grabbing;
}

.task-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.task-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.task-list:active {
  cursor: grabbing;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.task-item:last-child {
  border-bottom: none;
}

.task-content {
  flex: 1;
  margin-right: 10px;
}

.task-title {
  font-size: 14px;
  margin-bottom: 4px;
  color: #606266;
}

.task-due-date {
  font-size: 12px;
  color: #909399;
}

.empty-tasks {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.scrollbar-center-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
}

.scrollbar-container {
  height: 16px;
  width: 50%;
  min-width: 200px;
  max-width: 600px;
  padding: 4px 0;
  cursor: pointer;
}

.scrollbar-track {
  height: 8px;
  background-color: #e4e7ed;
  border-radius: 4px;
  position: relative;
}

.scrollbar-thumb {
  position: absolute;
  height: 8px;
  background-color: #c0c4cc;
  border-radius: 4px;
  cursor: grab;
  transition: background-color 0.2s, width 0.2s;
}

.scrollbar-thumb:hover {
  background-color: #a8abb2;
  height: 10px;
  margin-top: -1px;
}

.scrollbar-thumb:active {
  cursor: grabbing;
  background-color: #8d9199;
}
</style>