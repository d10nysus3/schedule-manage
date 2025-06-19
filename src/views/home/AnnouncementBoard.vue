<template>
  <div class="announcement-container">
    <!-- 公告列表 -->
    <div class="announcement-list">
      <div class="header">
        <h2>公告栏</h2>
        <el-button
            v-if="canPublish"
            type="primary"
            size="small"
            @click="showPublishDialog">
          发布公告
        </el-button>
      </div>

      <el-divider />

      <div class="search-bar">
        <el-input
            v-model="searchQuery"
            placeholder="搜索公告..."
            clearable
            @clear="resetSearch"
            @keyup.enter="searchAnnouncements"
            size="small"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <announcement-list
          :announcements="filteredAnnouncements"
          @select="selectAnnouncement"
          @delete="deleteAnnouncement"
          :can-manage="canPublish"
      />
    </div>

    <!-- 公告详情 -->
    <div class="announcement-detail">
      <template v-if="selectedAnnouncement">
        <div class="detail-header">
          <h3>{{ selectedAnnouncement.title }}</h3>
          <div class="meta">
            <span class="author">发布人: {{ selectedAnnouncement.username }}</span>
            <span class="time">发布时间: {{ formatTime(selectedAnnouncement.last_modified) }}</span>
            <el-tag
                v-if="selectedAnnouncement.is_important"
                type="danger"
                size="small">
              重要
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="detail-content" v-html="selectedAnnouncement.content"></div>

        <div class="detail-footer">
          <el-button
              v-if="canPublish && selectedAnnouncement.username === currentUser"
              type="primary"
              size="small"
              @click="showEditDialog">
            编辑公告
          </el-button>
        </div>
      </template>

      <div v-else class="empty-detail">
        <el-empty description="请选择公告查看详情" />
      </div>
    </div>

    <!-- 发布/编辑公告对话框 -->
    <el-dialog
        :title="isEditing ? '编辑公告' : '发布公告'"
        v-model="dialogVisible"
        width="60%">
      <el-form :model="announcementForm" label-width="80px">
        <el-form-item label="公告标题" required>
          <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="公告内容" required>
          <el-input
              v-model="announcementForm.content"
              type="textarea"
              :rows="8"
              placeholder="请输入公告内容"
              resize="none"
          />
        </el-form-item>

        <el-form-item label="重要公告">
          <el-switch v-model="announcementForm.is_important" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAnnouncement">
          {{ isEditing ? '更新公告' : '发布公告' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Search } from '@element-plus/icons-vue'
import AnnouncementList from './AnnouncementList.vue'
import axios from '../../plugins/axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  components: {
    Search,
    AnnouncementList
  },
  data() {
    return {
      announcements: [],
      selectedAnnouncement: null,
      selectedAnnouncementId: null,
      searchQuery: '',
      dialogVisible: false,
      isEditing: false,
      announcementForm: {
        id: null,
        title: '',
        content: '',
        is_important: false
      },
      currentUser: localStorage.getItem('username') || '',
      userPermission: parseInt(localStorage.getItem('permission') || '0')
    }
  },
  computed: {
    canPublish() {
      console.log(this.userPermission)
      return this.userPermission >= 1
    },
    filteredAnnouncements() {
      return this.announcements.filter(ann =>
          ann.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          ann.content.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
  },
  mounted() {
    this.loadAnnouncements()
  },
  methods: {
    async loadAnnouncements() {
      try {
        const response = await axios.post('get_team_announcement/',{
          groupID:localStorage.getItem('groupID'),
        })
        this.announcements = response.data.data
        if (this.announcements.length > 0 && !this.selectedAnnouncement) {
          this.selectAnnouncement(this.announcements[0])
        }

      } catch (error) {
        ElMessage.error('加载公告失败')
        console.error(error)
      }
    },
    selectAnnouncement(announcement) {
      this.selectedAnnouncement = announcement
      this.selectedAnnouncementId = announcement.id
    },
    showPublishDialog() {
      this.isEditing = false
      this.announcementForm = {
        id: null,
        title: '',
        content: '',
        is_important: false,
        username:this.currentUser,
        groupID: localStorage.getItem('groupID'),
      }
      this.dialogVisible = true
    },
    showEditDialog() {
      this.isEditing = true
      this.announcementForm = {
        id: this.selectedAnnouncement.id,
        title: this.selectedAnnouncement.title,
        content: this.selectedAnnouncement.content,
        is_important: this.selectedAnnouncement.is_important,
        username:this.currentUser,
        groupID: localStorage.getItem('groupID'),
      }
      this.dialogVisible = true
    },
    async submitAnnouncement() {
      try {
        if (this.isEditing) {
          const response = await axios.post(`update_team_announcement/`, this.announcementForm)
          if (response.data.success) {
            ElMessage.success('公告更新成功')
            await this.loadAnnouncements()
          }
        } else {
          const response = await axios.post('add_team_announcement/', this.announcementForm)
          if (response.data.success) {
            ElMessage.success('公告发布成功')
            await this.loadAnnouncements()
          }
        }
        this.dialogVisible = false
      } catch (error) {
        ElMessage.error(this.isEditing ? '更新公告失败' : '发布公告失败')
        console.error(error)
      }
    },
    async deleteAnnouncement(id) {
      try {
        await ElMessageBox.confirm('确定删除此公告吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await axios.post(`delete_team_announcement/`,{
          id:id
        })
        if (response.data.success) {
          ElMessage.success('公告删除成功')
          await this.loadAnnouncements()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除公告失败')
          console.error(error)
        }
      }
    },
    searchAnnouncements() {
    },
    resetSearch() {
      this.searchQuery = ''
      this.loadMemos()
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.announcement-container {
  display: flex;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.announcement-list {
  width: 320px;
  border-right: 1px solid #e6e6e6;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-bar {
  margin-bottom: 15px;
}

.announcement-detail {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 15px;
}

.detail-header h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.author {
  font-weight: bold;
}

.detail-content {
  line-height: 1.8;
  font-size: 15px;
}

.detail-content :deep(p) {
  margin: 10px 0;
}

.detail-footer {
  margin-top: 20px;
  text-align: right;
}

.empty-detail {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>