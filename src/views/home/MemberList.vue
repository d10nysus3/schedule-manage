<template>
  <div class="group-info-container">
    <el-card class="group-info-card">
      <!-- Group Basic Info -->
      <div class="group-header">
        <h2>{{ groupInfo.groupName }}</h2>
        <el-tag type="success">群ID: {{ groupInfo.groupID }}</el-tag>
      </div>

      <el-divider/>

      <!-- Group Description -->
      <div class="group-description">
        <h3>群描述</h3>
        <div v-if="isEditingDescription">
          <el-input
              v-model="groupInfo.groupDescription"
              type="textarea"
              :rows="3"
              placeholder="请输入群描述"
          />
          <div class="edit-buttons">
            <el-button size="small" @click="saveDescription">保存</el-button>
            <el-button size="small" @click="cancelEditDescription">取消</el-button>
          </div>
        </div>
        <div v-else>
          <p>{{ groupInfo.groupDescription || '暂无描述' }}</p>
          <el-button
              v-if="canEditGroupInfo"
              size="small"
              type="text"
              @click="startEditDescription"
          >
            编辑描述
          </el-button>
        </div>
      </div>

      <el-divider/>

      <!-- Group Members -->
      <div class="group-members">
        <h3>群成员 ({{ members.length }})</h3>
        <div class="member-table-container">
          <el-table
              :data="members"
              style="width: 100%"
              @row-contextmenu="handleRightClick"
          >
            <el-table-column prop="memberName" label="群昵称" width="360px">
              <template #default="{ row }">
                <span>{{ row.memberName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="用户名" width="360px" />
            <el-table-column prop="permission" label="职位" width="135px">
              <template #default="{ row }">
                <span>{{ getPermissionText(row.permission) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 右键菜单 -->
      <div v-if="contextMenu.visible"
           class="context-menu"
           :style="{left: contextMenu.left + 'px', top: contextMenu.top + 'px'}"
           @click.stop>
        <div class="menu-item" @click="editMemberName" v-if="canEditCurrentMember">编辑昵称</div>
        <div class="menu-item" @click="editMemberPermission" v-if="canEditCurrentPermission">修改权限</div>
        <div class="menu-item" @click="removeMember(contextMenu.currentRow)" v-if="canRemoveCurrentMember">移出群聊</div>
        <div class="menu-divider" v-if="showDivider"></div>
        <div class="menu-item" @click="transferOwnershipDialog" v-if="isCurrentUserOwner">转让群主</div>
      </div>

      <!-- 转让群主对话框 -->
      <el-dialog
          v-model="transferDialogVisible"
          title="转让群主权限"
          width="30%"
      >
        <p>请选择新的群主：</p>
        <el-select
            v-model="newOwner"
            placeholder="选择新群主"
            style="width: 100%"
        >
          <el-option
              v-for="member in eligibleMembers"
              :key="member.username"
              :label="member.memberName"
              :value="member.username"
          />
        </el-select>
        <template #footer>
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="transferOwnership">确认转让</el-button>
        </template>
      </el-dialog>

      <!-- 编辑昵称对话框 -->
      <el-dialog
          v-model="editNameDialogVisible"
          title="编辑群昵称"
          width="30%"
      >
        <el-input v-model="editingName" placeholder="请输入新昵称"/>
        <template #footer>
          <el-button @click="editNameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMemberName">保存</el-button>
        </template>
      </el-dialog>

      <!-- 修改权限对话框 -->
      <el-dialog
          v-model="editPermissionDialogVisible"
          title="修改成员权限"
          width="30%"
      >
        <el-select v-model="editingPermission" placeholder="选择权限">
          <el-option label="群主" :value="2"/>
          <el-option label="管理员" :value="1"/>
          <el-option label="群员" :value="0"/>
        </el-select>
        <template #footer>
          <el-button @click="editPermissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMemberPermission">保存</el-button>
        </template>
      </el-dialog>

      <div class="leave-group">
        <el-button
            type="danger"
            @click="handleLeaveGroup"
        >
          退出群聊
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from '../../plugins/axios'
import {ElMessage, ElMessageBox} from 'element-plus'

export default {
  data() {
    return {
      groupInfo: [],
      members: [],
      currentUsername: localStorage.getItem('username') || '',
      currentUserPermission: parseInt(localStorage.getItem('permission') || '0'),
      isEditingDescription: false,
      originalDescription: '',

      // 右键菜单相关
      contextMenu: {
        visible: false,
        left: 0,
        top: 0,
        currentRow: null
      },

      // 对话框相关
      transferDialogVisible: false,
      newOwner: '',
      isLeavingAfterTransfer: false,
      editNameDialogVisible: false,
      editingName: '',
      editPermissionDialogVisible: false,
      editingPermission: 0
    }
  },
  computed: {
    canEditGroupInfo() {
      return this.currentUserPermission >= 1
    },
    canEditMemberInfo() {
      return this.currentUserPermission >= 1
    },
    canEditMemberPermission() {
      return this.currentUserPermission === 2
    },
    canRemoveMembers() {
      return this.currentUserPermission >= 1
    },
    eligibleMembers() {
      return this.members.filter(member =>
          member.username !== this.currentUsername &&
          member.permission !== 2
      )
    },
    // 是否可以编辑当前选中成员的昵称
    canEditCurrentMember() {
      if (!this.contextMenu.currentRow) return false
      return this.contextMenu.currentRow.username === this.currentUsername
    },
    // 是否可以修改当前选中成员的权限
    canEditCurrentPermission() {
      if (!this.contextMenu.currentRow) return false
      return this.currentUserPermission === 2 &&
          this.contextMenu.currentRow.username !== this.currentUsername &&
          this.contextMenu.currentRow.permission !== 2
    },
    // 是否可以移除当前选中成员
    canRemoveCurrentMember() {
      if (!this.contextMenu.currentRow) return false
      return this.currentUserPermission >= 1 &&
          this.contextMenu.currentRow.username !== this.currentUsername &&
          this.contextMenu.currentRow.permission !== 2
    },
    // 是否显示分割线
    showDivider() {
      return (this.canEditCurrentMember || this.canEditCurrentPermission || this.canRemoveCurrentMember) &&
          this.isCurrentUserOwner
    },
    // 当前用户是否是群主
    isCurrentUserOwner() {
      return this.currentUserPermission === 2
    }
  },
  mounted() {
    this.loadGroupInfo()
    this.loadGroupMembers()
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', this.closeContextMenu)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    // 右键点击处理
    handleRightClick(row, column, event) {
      event.preventDefault()
      this.contextMenu = {
        visible: true,
        left: event.clientX,
        top: event.clientY,
        currentRow: row
      }
    },
    closeContextMenu() {
      this.contextMenu.visible = false
    },

    // 编辑昵称
    editMemberName() {
      this.editingName = this.contextMenu.currentRow.memberName
      this.editNameDialogVisible = true
      this.closeContextMenu()
    },

    // 修改权限
    editMemberPermission() {
      this.editingPermission = this.contextMenu.currentRow.permission
      this.editPermissionDialogVisible = true
      this.closeContextMenu()
    },

    // 转让群主对话框
    transferOwnershipDialog() {
      this.transferDialogVisible = true
      this.closeContextMenu()
    },

    async saveMemberName() {
      try {
        const response = await axios.post(`updateMemberName/`, {
          memberName: this.editingName,
          username: this.contextMenu.currentRow.username,
          groupID: localStorage.getItem('groupID') || ''
        })
        if (response.data.success) {
          ElMessage.success('群昵称已更新')
          this.editNameDialogVisible = false
          await this.loadGroupMembers()
        }
      } catch (error) {
        ElMessage.error('更新群昵称失败')
        console.error(error)
      }
    },

    async saveMemberPermission() {
      try {
        const response = await axios.post(`updatePermission/`, {
          permission: this.editingPermission,
          username: this.contextMenu.currentRow.username,
          groupID: localStorage.getItem('groupID') || ''
        })
        if (response.data.success) {
          ElMessage.success('成员权限已更新')
          this.editPermissionDialogVisible = false
          await this.loadGroupMembers()
        }
      } catch (error) {
        ElMessage.error('更新成员权限失败')
        console.error(error)
      }
    },

    // 其他方法保持不变...
    async loadGroupInfo() {
      try {
        const response = await axios.post(`getTeamData/`, {
          groupID: localStorage.getItem('groupID') || '',
        })
        this.groupInfo = response.data.data[0]
      } catch (error) {
        ElMessage.error('加载群信息失败')
        console.error(error)
      }
    },
    async loadGroupMembers() {
      try {
        const response = await axios.post(`getTeamMember/`, {
          groupID: localStorage.getItem('groupID') || '',
        })
        this.members = response.data.data
      } catch (error) {
        ElMessage.error('加载群成员失败')
        console.error(error)
      }
    },
    getPermissionText(permission) {
      switch (permission) {
        case 2: return '群主'
        case 1: return '管理员'
        case 0: return '群员'
        default: return '未知'
      }
    },
    isGroupOwner(member) {
      return member.permission === 2
    },
    isCurrentUser(username) {
      return username === this.currentUsername
    },
    startEditDescription() {
      this.originalDescription = this.groupInfo.groupDescription
      this.isEditingDescription = true
    },
    cancelEditDescription() {
      this.groupInfo.groupDescription = this.originalDescription
      this.isEditingDescription = false
    },
    async saveDescription() {
      try {
        const response = await axios.post(`updateDescription/`, {
          groupID: localStorage.getItem('groupID'),
          groupDescription: this.groupInfo.groupDescription
        })
        if (response.data.success)
          ElMessage.success('群描述已更新')
        this.isEditingDescription = false
      } catch (error) {
        ElMessage.error('更新群描述失败')
        console.error(error)
      }
    },
    async removeMember(member) {
      await ElMessageBox.confirm(`确定要将 ${member.memberName} 移出群聊吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await axios.post(`deleteMember/`, {
            username: member.username,
            groupID: localStorage.getItem('groupID') || ''
          })
          if (response.data.success) {
            ElMessage.success('成员已移出群聊')
            await this.loadGroupMembers()
          } else {
            this.$message.error(response.data.message);
          }
        } catch (error) {
          ElMessage.error('移出成员失败')
        }
      }).catch(() => {})
    },
    confirmLeaveGroup() {
      ElMessageBox.confirm('确定要退出该群聊吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.leaveGroup()
      }).catch(() => {})
    },
    async leaveGroup() {
      try {
        const response = await axios.post(`deleteMember/`, {
          username: localStorage.getItem('username') || '',
          groupID: localStorage.getItem('groupID') || ''
        })
        if (response.data.success) {
          ElMessage.success('已退出群聊')
          this.$router.push('/groupView')
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        ElMessage.error('退出群聊失败')
        console.error(error)
      }
    },
    handleLeaveGroup() {
      if (this.currentUserPermission === 2) {
        this.transferDialogVisible = true
        this.isLeavingAfterTransfer = true
      } else {
        this.confirmLeaveGroup()
      }
    },
    async transferOwnership() {
      if (!this.newOwner) {
        ElMessage.warning('请选择新群主')
        return
      }
      try {
        const response = await axios.post('updatePermission/', {
          groupID: localStorage.getItem('groupID'),
          username: this.newOwner,
          permission: 2
        })

        if (response.data.success) {
          ElMessage.success('群主权限已转让')

          if (this.isLeavingAfterTransfer) {
            await this.leaveGroup()
          }

          await this.loadGroupMembers()
          this.transferDialogVisible = false
          this.newOwner = ''
          this.isLeavingAfterTransfer = false
        }
      } catch (error) {
        ElMessage.error('转让群主权限失败')
        console.error(error)
      }
    },
  }
}
</script>

<style scoped>
.group-info-container {
  padding: 20px;
}

.group-info-card {
  max-width: 900px;
  margin: 0 auto;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-description {
  margin-bottom: 20px;
}

.group-members {
  height: 310px;
}

.edit-buttons {
  margin-top: 10px;
  text-align: right;
}

.member-table-container {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.leave-group {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  border-top: 1px solid #eee;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
}

.menu-item {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-divider {
  height: 1px;
  margin: 5px 0;
  background-color: #ebeef5;
}

/* 滚动条样式 */
.member-table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.member-table-container::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.member-table-container::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}
</style>