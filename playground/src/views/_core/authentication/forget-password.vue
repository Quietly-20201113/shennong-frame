<script lang="ts" setup>
import type { ShennongFormSchema } from '@shennong/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword, z } from '@shennong/common-ui';
import { $t } from '@shennong/locales';

defineOptions({ name: 'ForgetPassword' });

const loading = ref(false);

const formSchema = computed((): ShennongFormSchema[] => {
  return [
    {
      component: 'ShennongInput',
      componentProps: {
        placeholder: 'example@example.com',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email($t('authentication.emailValidErrorTip')),
    },
  ];
});

function handleSubmit(value: Record<string, any>) {
  void value;
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
