<script setup lang="ts">
import type { Recordable } from '@shennong/types';

import type { ShennongFormSchema } from '@shennong-core/form-ui';

import { computed, reactive } from 'vue';

import { $t } from '@shennong/locales';

import { useShennongForm } from '@shennong-core/form-ui';
import { ShennongButton } from '@shennong-core/shadcn-ui';

interface Props {
  formSchema?: ShennongFormSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  formSchema: () => [],
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, formApi] = useShennongForm(
  reactive({
    commonConfig: {
      // 所有表单项
      componentProps: {
        class: 'w-full',
      },
    },
    layout: 'horizontal',
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    emit('submit', values);
  }
}

defineExpose({
  getFormApi: () => formApi,
});
</script>
<template>
  <div @keydown.enter.prevent="handleSubmit">
    <Form />
    <ShennongButton type="submit" class="mt-4" @click="handleSubmit">
      {{ $t('profile.updateBasicProfile') }}
    </ShennongButton>
  </div>
</template>
