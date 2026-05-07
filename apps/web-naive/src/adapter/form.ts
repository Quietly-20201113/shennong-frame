import type {
  ShennongFormProps as FormProps,
  ShennongFormSchema as FormSchema,
} from '@shennong/common-ui';

import type { ComponentPropsMap, ComponentType } from './component';

import { setupShennongForm, useShennongForm as useForm, z } from '@shennong/common-ui';
import { $t } from '@shennong/locales';

async function initSetupShennongForm() {
  setupShennongForm<ComponentType>({
    config: {
      // naive-ui组件的空值为null,不能是undefined，否则重置表单时不生效
      emptyStateValue: null,
      baseModelPropName: 'value',
      modelPropNameMap: {
        Checkbox: 'checked',
        Radio: 'checked',
        Upload: 'fileList',
      },
    },
    defineRules: {
      required: (value, _params, ctx) => {
        if (value === undefined || value === null || value.length === 0) {
          return $t('ui.formRules.required', [ctx.label]);
        }
        return true;
      },
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
