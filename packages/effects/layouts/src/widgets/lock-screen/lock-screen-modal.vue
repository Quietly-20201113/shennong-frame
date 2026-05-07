<script setup lang="ts">
import type { Recordable } from '@shennong/types';

import { computed, reactive } from 'vue';

import { $t } from '@shennong/locales';

import { useShennongForm, z } from '@shennong-core/form-ui';
import { useShennongModal } from '@shennong-core/popup-ui';
import { ShennongAvatar, ShennongButton } from '@shennong-core/shadcn-ui';

interface Props {
  avatar?: string;
  text?: string;
}

defineOptions({
  name: 'LockScreenModal',
});

withDefaults(defineProps<Props>(), {
  avatar: '',
  text: '',
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, { resetForm, validate, getValues, getFieldComponentRef }] =
  useShennongForm(
    reactive({
      commonConfig: {
        hideLabel: true,
        hideRequiredMark: true,
      },
      schema: computed(() => [
        {
          component: 'ShennongInputPassword' as const,
          componentProps: {
            placeholder: $t('ui.widgets.lockScreen.placeholder'),
          },
          fieldName: 'lockScreenPassword',
          formFieldProps: { validateOnBlur: false },
          label: $t('authentication.password'),
          rules: z
            .string()
            .min(1, { message: $t('ui.widgets.lockScreen.placeholder') }),
        },
      ]),
      showDefaultActions: false,
    }),
  );

const [Modal] = useShennongModal({
  onConfirm() {
    handleSubmit();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetForm();
    }
  },
  onOpened() {
    requestAnimationFrame(() => {
      getFieldComponentRef('lockScreenPassword')
        ?.$el?.querySelector('[name="lockScreenPassword"]')
        ?.focus();
    });
  },
});

async function handleSubmit() {
  const { valid } = await validate();
  const values = await getValues();
  if (valid) {
    emit('submit', values?.lockScreenPassword);
  }
}
</script>

<template>
  <Modal
    :footer="false"
    :fullscreen-button="false"
    :title="$t('ui.widgets.lockScreen.title')"
  >
    <div
      class="mb-10 flex w-full flex-col items-center px-10"
      @keydown.enter.prevent="handleSubmit"
    >
      <div class="w-full">
        <div class="ml-2 flex w-full flex-col items-center">
          <ShennongAvatar
            :src="avatar"
            class="size-20"
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
          />
          <div class="my-6 flex items-center font-medium text-foreground">
            {{ text }}
          </div>
        </div>
        <Form />
        <ShennongButton class="mt-1 w-full" @click="handleSubmit">
          {{ $t('ui.widgets.lockScreen.screenButton') }}
        </ShennongButton>
      </div>
    </div>
  </Modal>
</template>
