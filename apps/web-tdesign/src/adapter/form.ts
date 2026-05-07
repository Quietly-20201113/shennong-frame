import type {
  ShennongFormProps as FormProps,
  ShennongFormSchema as FormSchema,
} from '@shennong/common-ui';

import type { ComponentPropsMap, ComponentType } from './component';

import {
  setupShennongForm,
  useShennongForm as useForm,
  z,
} from '@shennong/common-ui';
import { $t } from '@shennong/locales';

async function initSetupShennongForm() {
  setupShennongForm<ComponentType>({
    config: {
      // tdesign组件库默认都是 v-model:value
      baseModelPropName: 'value',

      // 一些组件是 v-model:checked 或者 v-model:fileList
      modelPropNameMap: {
        Checkbox: 'checked',
        Radio: 'checked',
        Switch: 'checked',
        Upload: 'fileList',
      },
    },
    defineRules: {
      // 输入项目必填国际化适配
      required: (value, _params, ctx) => {
        if (value === undefined || value === null || value.length === 0) {
          return $t('ui.formRules.required', [ctx.label]);
        }
        return true;
      },
      // 选择项目必填国际化适配
      selectRequired: (value, _params, ctx) => {
        if (value === undefined || value === null) {
          return $t('ui.formRules.selectRequired', [ctx.label]);
        }
        return true;
      },
    },
  });
}

const useShennongForm = useForm<ComponentType, ComponentPropsMap>;

export { initSetupShennongForm, useShennongForm, z };

export type ShennongFormSchema = FormSchema<ComponentType, ComponentPropsMap>;
export type ShennongFormProps = FormProps<ComponentType, ComponentPropsMap>;
