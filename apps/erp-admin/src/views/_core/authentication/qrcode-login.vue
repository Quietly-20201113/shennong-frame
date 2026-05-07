<script lang="ts" setup>
import { AuthenticationQrCodeLogin } from '@shennong/common-ui';
import { LOGIN_PATH } from '@shennong/constants';

defineOptions({ name: 'QrCodeLogin' });
</script>

<template>
  <AuthenticationQrCodeLogin :login-path="LOGIN_PATH" />
</template>
