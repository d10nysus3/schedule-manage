<template>
  <div class="announcement-items">
    <div
        v-for="announcement in announcements"
        :key="announcement.id"
        class="announcement-item"
        :class="{
        active: selectedId === announcement.id,
        important: announcement.is_important
      }"
        @click="$emit('select', announcement)"
    >
      <div class="item-content">
        <div class="title">
          <span>{{ announcement.title }}</span>
          <el-tag
              v-if="announcement.is_important"
              type="danger"
              size="small">
            重要
          </el-tag>
        </div>
        <div class="meta">
          <span class="publisher">{{ announcement.username }}</span>
          <span class="time">{{ formatTime(announcement.last_modified) }}</span>
        </div>
      </div>
      <el-button
          v-if="canManage && announcement.username === currentUser"
          type="danger"
          size="small"
          circle
          @click.stop="$emit('delete', announcement.id)"
          class="delete-btn"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <div v-if="announcements.length === 0" class="empty-list">
      <el-empty description="暂无公告" />
    </div>
  </div>
</template>

<script>
import { Delete } from '@element-plus/icons-vue'

export default {
  props: {
    announcements: {
      type: Array,
      default: () => []
    },
    selectedId: {
      type: [Number, String],
      default: null
    },
    canManage: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentUser: localStorage.getItem('username') || ''
    }
  },
  methods: {
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  },
  components: {
    Delete
  }
}
</script>

<style scoped>
.announcement-items {
  height: 100%;
  overflow-y: auto;
}

.announcement-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.announcement-item:hover {
  background-color: #f5f7fa;
}

.announcement-item.active {
  background-color: #f0f7ff;
}

.announcement-item.unread {
  background-color: #f8fafc;
}

.announcement-item.important .title {
  font-weight: bold;
}

.item-content {
  flex: 1;
}

.title {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.publisher {
  color: #666;
}

.delete-btn {
  position: absolute;
  right: 10px;
  top: 10%;
  opacity: 0;
  transition: opacity 0.3s;
}

.announcement-item:hover .delete-btn {
  opacity: 1;
}

.empty-list {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(50vh - 64px);
}
</style>