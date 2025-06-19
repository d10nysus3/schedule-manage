<template>
  <div class="sidebar-container">
    <!-- 选择器 -->
    <div class="selector">
      <el-radio-group v-model="selectedMode" @change="handleModeChange">
        <el-radio-button label="personal">个人</el-radio-button>
        <el-radio-button label="team">团队</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 侧边栏菜单 -->
    <el-menu :default-openeds="['1', '3']">
      <!-- 个人模式 -->
      <template v-if="selectedMode === 'personal'">
        <el-sub-menu index="1">
          <template #title>
            <el-icon>
              <Edit/>
            </el-icon>
            事项
          </template>
          <el-menu-item index="1-1">
            <el-icon>
              <Calendar/>
            </el-icon>
            日程
            <el-radio-group
                v-model="currentView"
                @change="switchView"
                style="margin-left: 14px; background: white; border-radius: 40px;height:22px;display: flex; align-items: center; flex-wrap: nowrap;"
            >
              <el-radio-button label="calendarView">日历</el-radio-button>
              <el-radio-button label="carouselView">列表</el-radio-button>
            </el-radio-group>
          </el-menu-item>
          <el-menu-item index="1-2"
          >
            <router-link to="/scheduleList">
              <el-icon>
                <Document/>
              </el-icon>
              清单
            </router-link>
          </el-menu-item
          >
        </el-sub-menu>
        <el-menu-item index="2">
          <router-link to="/memorandum">
            <el-icon>
              <Management/>
            </el-icon>
            备忘录
          </router-link>
        </el-menu-item>
<!--        <el-sub-menu index="3">-->
<!--          <template #title>-->
<!--            <el-icon>-->
<!--              <TrendCharts/>-->
<!--            </el-icon>-->
<!--            规划-->
<!--          </template>-->
<!--          <el-menu-item-group>-->
<!--            <el-menu-item index="3-1">-->
<!--              <img-->
<!--                  src="../assets/rcd-day.png"-->
<!--                  alt="icon"-->
<!--                  style="width: 20px; height: 20px; margin-right: 8px"-->
<!--              />-->
<!--              我的一天-->
<!--            </el-menu-item>-->
<!--            <el-menu-item index="3-2">-->
<!--              <img-->
<!--                  src="../assets/rcd-week.png"-->
<!--                  alt="icon"-->
<!--                  style="width: 20px; height: 20px; margin-right: 8px"-->
<!--              />-->
<!--              我的一周-->
<!--            </el-menu-item>-->
<!--            <el-menu-item index="3-3">-->
<!--              <img-->
<!--                  src="../assets/rcd-month.png"-->
<!--                  alt="icon"-->
<!--                  style="width: 20px; height: 20px; margin-right: 8px"-->
<!--              />-->
<!--              我的一月-->
<!--            </el-menu-item>-->
<!--          </el-menu-item-group>-->
<!--        </el-sub-menu>-->
      </template>

      <!-- 团队模式 -->
      <template v-if="selectedMode === 'team'">
        <el-sub-menu index="1">
          <template #title>
            <el-icon>
              <Edit/>
            </el-icon>
            团队事项
          </template>
          <el-menu-item index="1-1">
            <router-link to="/groupView">
              <el-icon>
                <Calendar/>
              </el-icon>
              团队日程
            </router-link>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="2">
          <router-link to="/teamMemorandum">
            <el-icon>
              <Management/>
            </el-icon>
            会议纪要
          </router-link>
        </el-menu-item>
        <el-menu-item index="3">
          <router-link to="/announcementBoard">
            <el-icon>
              <DataBoard/>
            </el-icon>
            公告
          </router-link>
        </el-menu-item>
        <el-menu-item index="3">
          <router-link to="/memberList">
            <el-icon>
              <User/>
            </el-icon>
            成员
          </router-link>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script>
import {
  Calendar, DataBoard,
  Document,
  Edit,
  FolderRemove,
  Grid,
  List,
  Management,
  TrendCharts,
  User
} from "@element-plus/icons-vue";

export default {
  components: {DataBoard, User, List, TrendCharts, Grid, FolderRemove, Management, Document, Calendar, Edit},
  mounted() {
    this.initCurrentView();
  },
  data() {
    return {
      selectedMode: "personal",
      currentView: "calendar",
    };
  },
  watch: {
    "$route.path"(newPath) {
      this.initCurrentView();
    },
  },
  methods: {
    handleModeChange(mode) {
      this.selectedMode = mode;
    },
    switchView(mode) {
      const targetRoute = mode === "calendarView" ? "/calendarView" : "/carouselView";
      if (this.$route.path !== targetRoute) {
        this.$router.push(targetRoute);
      }
    },
    initCurrentView() {
      const routePath = this.$route.path;
      if (routePath === "/calendarView") {
        this.currentView = "calendarView";
      } else if (routePath === "/carouselView") {
        this.currentView = "carouselView";
      } else {
        this.currentView = "";
      }
    },
  },
};
</script>

<style>
/* 样式保持不变 */
.sidebar-container {
  height: 100%;
}

.selector {
  padding: 15px;
  text-align: center;
}

.selector .el-radio-group {
  border-radius: 4px;
}

.selector .el-radio-button__inner {
  background: transparent !important;
  border: none !important;
  font-size: 16px !important;
  padding: 8px 30px !important;
  height: 36px !important;
  color: #0a0707 !important;
  box-shadow: none !important;
}

.selector .el-radio-button.is-active {
  background: rgba(233, 193, 163, 0.5) !important;
}

.selector .el-radio-button:not(.is-active):hover {
  background: rgba(233, 193, 163, 0.5) !important;
}

.el-radio-button__inner {
  border: none !important;
  font-size: 14px !important;
  padding: 4px 10px !important;
  box-shadow: none !important;
  border-radius: 40px !important;
}


.el-menu {
  background: transparent !important;
  border-right: none !important;
}

.el-submenu,
.el-menu-item-group {
  background: transparent !important;
}

.el-menu-item,
.el-submenu__title {
  background: transparent !important;
  backdrop-filter: blur(10px) !important;
  color: #333 !important;
}

.el-menu-item:hover,
.el-submenu__title:hover {
  background: rgba(71, 141, 166, 0.2) !important;
}

.el-menu-item.is-active,
.el-submenu.is-opened {
  background: rgba(222, 211, 211, 0.1) !important;
}

.router-link-active,
.router-link-exact-active {
  color: inherit !important;
  background-color: transparent !important;
  text-decoration: none !important;
}
</style>