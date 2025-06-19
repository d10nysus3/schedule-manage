<template>
  <div class="register">
    <!-- 返回按钮 -->
    <el-button
        :icon="Back"
        size="large"
        circle
        @click="goToLogin"
        class="back-button"
    />

    <div class="register-panel">
      <el-tabs type="border-card" class="register-tabs" stretch>
        <el-tab-pane>
          <template #label>
            <span class="register-tabs-label">
              <el-icon><calendar /></el-icon>
              <span>
                <i class="el-icon-user-solid"></i>
                用户注册
              </span>
            </span>
          </template>
          <div class="register-form">
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

              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="account.nickname" />
              </el-form-item>

              <div class="register-button">
                <el-button
                    type="primary"
                    round
                    style="width: 100px"
                    @click="register"
                >注册</el-button>
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
import { Back, Calendar } from "@element-plus/icons-vue";

export default {
  computed: {
    Back() {
      return Back;
    },
  },
  components: { Back, Calendar },
  data() {
    const account = {
      username: "",
      password: "",
      nickname: "",
    };
    const rules = {
      username: [
        {
          required: true,
          message: "用户名不能为空",
          trigger: "blur",
        },
        {
          pattern: /^[a-zA-Z][a-zA-Z0-9_]{5,31}$/,
          message: "用户名必须是至少6位,仅支持字母、数字、下划线,以字母开头",
          trigger: "blur",
        },
      ],
      password: [
        {
          required: true,
          message: "密码不能为空",
          trigger: "blur",
        },
        {
          pattern: /^[a-zA-Z0-9_]{8,31}$/,
          message: "密码至少 8 位",
          trigger: "blur",
        },
      ],
      nickname: [
        {
          required: true,
          message: "昵称不能为空",
          trigger: "blur",
        },
      ],
    };
    return {
      account,
      rules,
    };
  },
  methods: {
    register: function () {
      this.$refs.formRef.validate(async (value) => {
        if (value) {
          try {
            // 发送注册请求
            const response = await axios.post("register/", {
              username: this.account.username,
              password: this.account.password,
              nickname: this.account.nickname,
            });
            if (response.data.success) {
              this.$message.success("注册成功");
              this.$router.push({ name: "userLogin" });
            } else {
              this.$message.error(response.data.message || "该用户名已注册");
            }
          } catch (error) {
            console.error("注册请求失败:", error);
            this.$message.error("注册请求失败，请稍后重试");
          }
        } else {
          this.$message.warning("注册失败，请检查注册格式");
        }
      });
    },
    // 返回登录页面的方法
    goToLogin() {
      this.$router.push({ name: "userLogin" });
    },
  },
};
</script>

<style>
.register {
  position: absolute;
  top: 0;
  left: 0;
  background: url(../../assets/register.jpeg);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  width: 100%;
  height: 100%;
}

.register-panel {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-form {
  margin-left: 30px;
  margin-right: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-button {
  margin-top: 20px;
  margin: 0 auto;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000; /* 确保按钮在最上层 */
  background-color: rgba(255, 255, 255, 0.8); /* 半透明背景 */
  border: none; /* 去掉边框 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); /* 添加阴影 */
}
</style>