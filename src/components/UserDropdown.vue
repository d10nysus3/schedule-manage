<template>
  <el-dropdown>
    <span class="el-dropdown-link">
      {{ nickname }}<i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item><router-link to="/personalView">个人中心</router-link></el-dropdown-item>
        <el-dropdown-item @click.native="logout">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
export default {
  computed: {
    nickname() {
      const user = JSON.parse(localStorage.getItem("nickname"));
      return user || "未知用户";
    },
  },
  methods:{
    logout() {
      console.log("dada");
      localStorage.removeItem("username");
      localStorage.removeItem("nickname");
      this.$router.push({ name: "userLogin" });
    }
  }

}
</script>
