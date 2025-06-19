<template>
  <div class="personal-center">
    <div class="profile-title">个人资料</div>

    <div class="center-container">
      <el-card class="box-card">
        <div class="user-info">
          <el-form label-position="left" label-width="100px" class="transparent-form">

            <el-form-item label="用户名">
              <div class="static-text">{{ userInfo.username }}</div>
            </el-form-item>

            <el-form-item label="昵称">
              <div class="nickname-container">
                <template v-if="isEditingNickname">
                  <el-input
                      v-model="userInfo.nickname"
                      class="no-border-input"
                  ></el-input>
                </template>
                <template v-else>
                  <div class="static-text">{{ userInfo.nickname }}</div>
                </template>

                <el-button
                    type="primary"
                    size="small"
                    @click="toggleEditNickname"
                    class="edit-btn"
                >
                  {{ isEditingNickname ? '保存' : '修改' }}
                </el-button>
              </div>
            </el-form-item>

          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from "../../plugins/axios.js";

export default {
  name: 'PersonalCenter',
  data() {
    return {
      userInfo: {
        username: '',
        nickname: '',
      },
      isEditingNickname: false
    }
  },
  created() {
    this.loadUserInfo();
  },
  methods: {
    loadUserInfo() {
      const username = localStorage.getItem('username') || '';
      const nickname = localStorage.getItem('nickname') || '';

      this.userInfo = {
        username: this.removeQuotes(username),
        nickname: this.removeQuotes(nickname),
      };
    },
    removeQuotes(value) {
      return value ? value.replace(/"/g, '') : value;
    },
    async toggleEditNickname() {
      if (this.isEditingNickname) {
        if (this.userInfo.nickname.trim() === '') {
          this.$message.error('昵称不能为空');
          return;
        }

        try {
          const response = await axios.post("updatePersonalData/", {
            username: this.userInfo.username,
            nickname: this.userInfo.nickname
          });

          if (response.data.success) {
            localStorage.setItem('nickname', this.userInfo.nickname);
            this.$message.success('昵称修改成功');
            this.loadUserInfo();
            this.isEditingNickname = false;
          } else {
            this.$message.error(response.data.message);
          }
        } catch (error) {
          this.$message.error("请求失败，请稍后重试");
        }
      } else {
        this.isEditingNickname = true;
      }
    }
  }
}
</script>

<style scoped>
.personal-center {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 90%;
}

.profile-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-left: 20px;
  margin-bottom: 20px;
  align-self: flex-start;
}

.center-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}

.box-card {
  width: 600px;
  border: none;
  box-shadow: none;
  background-color: transparent;
}

.user-info {
  padding: 0 20px;
}

.nickname-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-btn {
  margin-left: 10px;
}

.no-border-input :deep(.el-input__inner) {
  border: none !important;
  box-shadow: none !important;
  padding-left: 0;
  font-size: 16px;
}

.static-text {
  font-size: 16px;
  color: #303133;
  padding: 6px 0;
}

.transparent-form :deep(.el-form-item__label) {
  font-size: 16px;
  padding-right: 20px;
}
</style>
