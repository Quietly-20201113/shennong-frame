<script setup lang="ts">
import { Card } from 'ant-design-vue';

defineOptions({ name: 'Welcome' });
</script>

<template>
  <div class="p-6">
    <Card class="mx-auto max-w-3xl">
      <template #title>
        <span class="text-lg">欢迎使用神农信息系统</span>
      </template>
      <div class="space-y-3 text-base leading-7">
        <p>这是 ERP 应用的骨架欢迎页。</p>
        <p class="text-muted-foreground text-sm">
          当前阶段：P0-5 应用骨架（已搭起）。后续 P0-6 起将陆续接入业务模块。
        </p>
        <p class="text-muted-foreground text-sm">
          当前已具备：登录认证、菜单 / 路由 / 权限 (AND/OR + DataScope)、
          国际化、主题切换、Tab 多页、暗黑模式。
        </p>
      </div>
    </Card>
  </div>
</template>
