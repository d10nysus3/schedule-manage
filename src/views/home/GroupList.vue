<template>
  <el-container style="height: 100vh">
    <el-main style="padding: 20px">
      <div class="group-list-container">
        <el-button type="primary" @click="openCreateGroupDialog" style="margin-bottom: 20px">
          创建群组
        </el-button>

        <el-button type="success" @click="openJoinGroupDialog" style="margin-bottom: 20px; margin-left: 10px">
          加入群组
        </el-button>

        <!-- 群组列表 -->
        <el-table
            :data="groupList"
            style="width: 100%"
            stripe
            v-if="groupList.length > 0"
            @row-mouse-enter="handleMouseEnter"
        >
          <el-table-column prop="groupName" label="群组名称" width="200">
            <template #default="scope">
              <el-tooltip :content="'组号: ' + scope.row.groupID" placement="top">
                <span>{{ scope.row.groupName }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="groupDescription" label="群组描述"/>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="text" @click="enterGroup(scope.row)">进入</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-else class="empty-tip">
          <el-icon :size="40">
            <i class="el-icon-folder-opened"></i>
          </el-icon>
          <div class="empty-text">暂无工作群组</div>
        </div>
      </div>
    </el-main>

    <!-- 创建群组的对话框 -->
    <el-dialog title="创建群组" v-model="createGroupVisible" width="30%">
      <el-form :model="newGroupForm" label-width="80px" ref="createGroupForm">
        <el-form-item label="群组名称">
          <el-input v-model="newGroupForm.name" placeholder="请输入群组名称"></el-input>
        </el-form-item>
        <el-form-item label="群组描述">
          <el-input
              v-model="newGroupForm.description"
              placeholder="请输入群组描述"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createGroupVisible = false">取消</el-button>
          <el-button type="primary" @click="createGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 加入群组的对话框 -->
    <el-dialog title="加入群组" v-model="joinGroupVisible" width="30%">
      <el-form :model="joinGroupForm" label-width="80px">
        <el-form-item label="群组ID">
          <el-input v-model="joinGroupForm.groupId" placeholder="请输入群组ID"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="joinGroupVisible = false">取消</el-button>
          <el-button type="primary" @click="searchGroup">搜索</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 群组信息对话框 -->
    <el-dialog title="群组信息" v-model="groupInfoVisible" width="40%">
      <el-form :model="groupInfo" label-width="90px">
        <el-form-item label="群组ID">
          <el-input v-model="groupInfo.groupID" disabled></el-input>
        </el-form-item>
        <el-form-item label="群组名称">
          <el-input v-model="groupInfo.groupName" disabled></el-input>
        </el-form-item>
        <el-form-item label="群组描述">
          <el-input v-model="groupInfo.groupDescription" disabled></el-input>
        </el-form-item>
        <el-form-item label="群组创立者">
          <el-input v-model="groupInfo.groupOwner" disabled></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="groupInfoVisible = false">取消</el-button>
        <el-button type="primary" @click="joinGroup">确认加入</el-button>
      </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script>
import axios from "../../plugins/axios.js";

export default {
  mounted() {
    this.showGroupList();
  },
  data() {
    return {
      groupList: [],
      createGroupVisible: false,
      joinGroupVisible: false,
      groupInfoVisible: false,
      newGroupForm: {
        name: "",
        description: "",
      },
      joinGroupForm: {
        groupId: "",
      },
      groupInfo: {
        groupID: "",
        groupName: "",
        groupDescription: "",
        groupOwner: "",
      },
    };
  },
  methods: {
    async showGroupList() {
      try {
        const response = await axios.post("getGroupList/", {
          username: localStorage.getItem("username"),
        });
        if (response.data.success) {
          this.groupList = response.data.groupInfo || [];
        } else {
          this.groupList = [];
        }
      } catch (error) {
        console.error("请求失败:", error);
        this.$message.error("请求失败，请稍后重试");
        this.groupList = [];
      }
    },
    openCreateGroupDialog() {
      this.createGroupVisible = true;
    },
    async createGroup() {
      if (!this.newGroupForm.name) {
        this.$message.warning("请输入群组名称");
        return;
      }
      try {
        const response = await axios.post("createGroup/", {
          groupName: this.newGroupForm.name,
          groupDescription: this.newGroupForm.description,
          groupOwner: localStorage.getItem("username"),
        });
        if (response.data.success) {
          this.$message.success("创建成功");
          this.createGroupVisible = false;
          await this.showGroupList();
        } else {
          this.$message.error(response.data.message || "创建失败");
        }
      } catch (error) {
        console.error("创建请求失败:", error);
        this.$message.error("创建请求失败，请稍后重试");
      }
    },
    async searchGroup() {
      if (!this.joinGroupForm.groupId) {
        this.$message.warning("请输入群组ID");
        return;
      }
      try {
        const response = await axios.post("searchGroup/", {
          groupID: this.joinGroupForm.groupId,
        });
        if (response.data.success) {
          this.groupInfo = response.data.group;
          this.groupInfoVisible = true;
          this.joinGroupVisible = false;
        } else {
          this.$message.error(response.data.message || "搜索失败");
        }
      } catch (error) {
        console.error("请求失败:", error);
        this.$message.error("请求失败，请稍后重试");
        this.groupList = [];
      }
    },
    openJoinGroupDialog() {
      this.joinGroupVisible = true;
    },
    async joinGroup() {
      try {
        const response = await axios.post("joinGroup/", {
          groupID: this.joinGroupForm.groupId,
          username: localStorage.getItem("username"),
        });
        if (response.data.success) {
          this.$message.success("加入成功");
          this.joinGroupVisible = false;
          await this.showGroupList();
        } else {
          this.$message.error(response.data.message || "加入失败");
        }
      } catch (error) {
        console.error("加入请求失败:", error);
        this.$message.error("加入请求失败，请稍后重试");
      }
    },
    async enterGroup(group) {
      localStorage.setItem("groupID", group.groupID);
      localStorage.setItem("groupName", group.groupName);
      localStorage.setItem("groupOwner", group.groupOwner);
      this.$router.push({path: "/teamSchedule"});
      try {
        const response = await axios.post("getMemberInfo/", {
          groupID: group.groupID,
          username: localStorage.getItem("username"),
        });
        if (response.data.success) {
          localStorage.setItem("permission", response.data.permission);
        }
      } catch (error) {
        this.$message.error("请求失败，请稍后重试");
      }
      this.$router.push({path: "/teamSchedule"});
    },
    handleMouseEnter(row) {
      console.log('鼠标悬停在群组上:', row.groupID);
    },
  },
};
</script>

<style scoped>
.group-list-container {
  max-width: 800px;
  margin: 0 auto;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.empty-tip .el-icon {
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  text-align: center;
}

.el-tooltip__popper {
  max-width: 200px;
  font-size: 14px;
}
</style>