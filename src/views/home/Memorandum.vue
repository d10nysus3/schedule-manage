<template>
  <div class="memo-container">
    <div class="memo-sidebar">
      <div class="memo-title-bar">
        <h2>备忘录</h2>
      </div>

      <div class="memo-search">
        <el-input
            v-model="searchQuery"
            placeholder="搜索备忘录..."
            clearable
            @clear="resetSearch"
            @keyup.enter="searchMemos"
            size="small"
            style="width: 100%; height: 100%"
        >
          <template #prefix>
            <el-icon>
              <Search/>
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 备忘录列表 -->
      <div class="memo-list">
        <!-- 置顶项 -->
        <template v-for="memo in memoList" :key="memo.id">
          <div v-if="memo.is_pinned" class="memo-item"
               :class="{ active: activeMemoId === memo.id }"
               @click="selectMemo(memo)">
            <div class="memo-title">{{ memo.title || '无标题备忘录' }}</div>
            <div class="memo-time">{{ formatTime(memo.updated_at) }}</div>
            <el-button type="danger" size="small"
                       @click.stop="deleteMemo(memo.id)"
                       class="delete-btn">
              <el-icon>
                <Delete/>
              </el-icon>
            </el-button>
          </div>
        </template>

        <!-- 分隔线 -->
        <div v-if="hasPinnedMemos" class="memo-divider">
          <el-divider/>
        </div>

        <!-- 非置顶项 -->
        <template v-for="memo in memoList" :key="memo.id">
          <div v-if="!memo.is_pinned" class="memo-item"
               :class="{ active: activeMemoId === memo.id }"
               @click="selectMemo(memo)">
            <div class="memo-title">{{ memo.title || '无标题备忘录' }}</div>
            <div class="memo-time">{{ formatTime(memo.updated_at) }}</div>
            <el-button type="danger" size="small"
                       @click.stop="deleteMemo(memo.id)"
                       class="delete-btn">
              <el-icon>
                <Delete/>
              </el-icon>
            </el-button>
          </div>
        </template>
      </div>

      <!-- 分隔线 + 新建按钮 -->
      <el-divider/>
      <div class="memo-actions">
        <el-button type="primary" @click="addNewMemo" size="small" style="width: 100%;height: 100%">
          <el-icon>
            <Plus/>
          </el-icon>
          新建备忘录
        </el-button>
      </div>
    </div>


    <div class="memo-editor">
      <template v-if="activeMemo">
        <div class="editor-header">
          <el-input
              v-model="activeMemo.title"
              placeholder="输入标题"
              class="title-input"
          />
          <div class="editor-tools">
            <el-switch
                v-model="activeMemo.is_pinned"
                active-text="置顶"
                @change="updateMemo"
            />
            <el-button type="primary" @click="updateMemo" style="margin-left: 10px">保存</el-button>
          </div>
        </div>
        <el-divider/>
        <div class="editor-content paper-texture">
          <el-input
              v-model="activeMemo.content"
              type="textarea"
              :rows="20"
              placeholder="开始记录..."
              resize="none"
              @blur="updateMemo"
              class="paper-textured-input"
          />
        </div>
      </template>
      <div v-else class="empty-editor">
        <el-empty description="请选择或新建备忘录"/>
      </div>
    </div>
  </div>
</template>

<script>
import {Plus, Delete, Search} from '@element-plus/icons-vue'
import {ElMessage} from 'element-plus'
import axios from '../../plugins/axios'

export default {
  components: {Plus, Delete, Search},
  data() {
    return {
      memoList: [],
      activeMemoId: null,
      activeMemo: null,
      nextId: 1,
      searchQuery: '',
    }
  },
  computed: {
    hasPinnedMemos() {
      return this.memoList.some(memo => memo.is_pinned)
    }
  },
  mounted() {
    this.loadMemos()
  },
  methods: {
    async loadMemos() {
      try {
        const response = await axios.post('get_memos/', {
          username: localStorage.getItem('username')
        })
        this.memoList = response.data.data
        if (this.memoList.length > 0 && !this.activeMemoId) {
          this.selectMemo(this.memoList[0])
        }
      } catch (error) {
        ElMessage.error('加载备忘录失败')
        console.error(error)
      }
    },
    selectMemo(memo) {
      this.activeMemoId = memo.id
      this.activeMemo = {...memo}
    },
    async updateMemo() {
      if (!this.activeMemo) return
      try {
        const response = await axios.post(`update_memo/`, {
          id: this.activeMemoId,
          username: localStorage.getItem('username'),
          is_pinned: this.activeMemo.is_pinned,
          title: this.activeMemo.title,
          content: this.activeMemo.content
        })
        if (response.data.success) {
          await this.loadMemos()
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        ElMessage.error('更新失败')
        console.error(error)
      }
    },
    async addNewMemo() {
      try {
        const response = await axios.post('add_memo/', {
          username: localStorage.getItem('username'),
          title: '',
          content: '',
          is_pinned: false
        })
        this.memoList.unshift(response.data.data)
        this.selectMemo(response.data.data)
        console.log(this.memoList)
        await this.loadMemos()
      } catch (error) {
        ElMessage.error('创建失败')
        console.error(error)
      }
    },

    deleteMemo(id) {
      this.$confirm('确定删除这个备忘录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await axios.post(`delete_memos/`, {
            id: id
          })
          if (response.data.success) {
            await this.loadMemos()
          } else {
            this.$message.error(response.data.message);
          }
        } catch (error) {

        }
      }).catch(() => {
      })
    },
    formatTime(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    async searchMemos() {
      if (!this.searchQuery.trim()) {
        await this.loadMemos()
        return
      }

      try {
        const response = await axios.post('search_memos/', {
          username: localStorage.getItem('username'),
          query: this.searchQuery
        })
        this.memoList = response.data.data
      } catch (error) {
        ElMessage.error('搜索失败')
        console.error(error)
      }
    },
    resetSearch() {
      this.searchQuery = ''
      this.loadMemos()
    },
  }
}
</script>

<style scoped>
.memo-container {
  display: flex;
  height: 100%;
}

.memo-sidebar {
  width: 280px;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}

.memo-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
}
.memo-title-bar {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.memo-title-bar h2 {
  margin: 0;
  font-size: 18px;
}

.memo-search {
  flex: 0 0 40px;
  padding: 0;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
}

.memo-actions {
  padding: 10px 15px;
  border-top: 1px solid #e6e6e6;
}

.memo-header h2 {
  margin: 0;
  font-size: 18px;
}

.memo-list {
  flex: 1;
  overflow-y: auto;
}

.memo-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
  transition: background-color 0.3s;
}

.memo-item:hover {
  background-color: #f9f9f9;
}

.memo-item.active {
  background-color: #f0f7ff;
}

.memo-title {
  font-weight: 500;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memo-time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.memo-item:hover .delete-btn {
  opacity: 1;
}

.memo-editor {
  flex: 1;
  padding: 20px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.title-input {
  flex: 1;
  margin-right: 15px;
}

.editor-tools {
  display: flex;
}

.editor-content {
  flex: 1;
}

.empty-editor {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.paper-texture {
  background: #f5f5f5;
  background-image: linear-gradient(#e8e8e8 1px, transparent 1px),
  linear-gradient(90deg, #e8e8e8 1px, transparent 1px),
  linear-gradient(rgba(255, 255, 255, .3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, .3) 1px, transparent 1px);
  background-size: 100% 24px,
  24px 100%,
  100px 100px,
  100px 100px;
  background-position: 0 0, 0 0, 0 0, 0 0;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) inset;
}

.paper-textured-input {
  background: transparent !important;
  border: none !important;
  font-family: "Ma Shan Zheng", "Segoe Print", cursive, sans-serif;
  line-height: 24px;
  padding: 0 10px;
}

.paper-textured-input :deep(.el-textarea__inner) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #333;
  font-size: 16px;
  min-height: calc(100vh - 220px) !important;
}

.memo-divider {
  padding: 0 15px;
  background-color: #f5f7fa;
}

.memo-sidebar .el-divider {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.memo-actions {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  height: 50px;
}

</style>