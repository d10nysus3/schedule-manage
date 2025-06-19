<template>
  <div class="login">
    <div class="login-panel">
      <el-tabs type="border-card" class="login-tabs" stretch>
        <el-tab-pane>
          <template #label>
            <span class="login-tabs-label">
              <el-icon><calendar /></el-icon>
              <span>
                <i class="el-icon-user-solid"></i>
                账号登录
              </span>
            </span>
          </template>
          <div class="login-form">
            <el-form
              label-width="60px"
              :rules="rules"
              :model="account"
              ref="formRef"
            >
              <el-form-item label="账号" prop="username">
                <el-input v-model="account.username" />
              </el-form-item>

              <el-form-item label="密码" prop="password">
                <el-input v-model="account.password" show-password />
              </el-form-item>
              <div style="width: 100%; margin-left: 5%">
                <span class="button-span">
                  <el-button
                    class="login-button"
                    type="primary"
                    round
                    @click="login"
                    :loading="loading"
                    >登陆</el-button
                  >

                  <el-button
                    class="register-button"
                    type="primary"
                    round
                    @click="register"
                    >注册</el-button
                  >
                </span>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
  
  <script>
import axios from "../../plugins/axios"

export default {
  data() {
    const account = {
      username: "",
      password: "",
    };
    const rules = {
      username: [
        {
          required: true,
          message: "用户名不能为空",
          trigger: "blur",
        },
        {
          pattern: /^[a-zA-Z0-9_]{6,32}$/,
          message: "用户名必须是至少6位,支持字母、数字、下划线",
          trigger: "blur",
        },
      ],
      password: [
        {
          required: true,
          message: "密码不能为空",
          trigger: "blur",
        }
      ],
    };
    return {
      account,
      rules,
      loading: false
    };
  },
  methods: {
    login: function () {
      this.$refs.formRef.validate(async (value) => {
        if (value) {
          try {
            // 发送登录请求
            this.loading = true;
            const response = await axios.post("login/",{
                username: this.account.username,
                password: this.account.password,
              }
            );
            console.log(response)
            if (response.data.success) {
              localStorage.setItem('username', JSON.stringify(response.data.user["username"]));
              localStorage.setItem('nickname', JSON.stringify(response.data.user["nickname"]));

              if (window.electronAPI) {
                try {
                  await window.electronAPI.initScheduleNotifications(localStorage.getItem('username'))
                  console.log(JSON.parse(localStorage.getItem('username')))
                  console.log('日程通知初始化成功')
                  await window.electronAPI.showTestNotification()
                } catch (error) {
                  console.error('初始化日程通知失败:', error)
                }
              }
              this.$router.push({ name: "home" }); 
            } else {
              this.loading = false;
              this.$message.error("登录失败，请检查用户名和密码");
            }
          } catch (error) {
            this.loading = false;
            console.error("登录请求失败:", error);
            this.$message.error("登录请求失败，请稍后重试");
          }
        } else {
          this.loading = false;
          this.$message.warning("请正确填写用户名和密码");
        }
      });
    },
    register: function () {
      this.$router.push(
        {
          name: "userRegister",
        },
        () => {}
      );
    },
  },
};
</script>
  
  <style >
.login {
  position: absolute;
  top: 0;
  left: 0;
  background: url(../../assets/background.png);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  width: 100%;
  height: 100%;
}

.login-panel {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-form {
  margin-left: 20px;
  margin-right: 40px;
}
.button-span {
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-button {
  width: 100px;
}
.register-button {
  width: 100px;
}
</style>