import type {
  ShennongFormSchema as FormSchema,
  ShennongFormProps,
} from '@shennong/common-ui';

import type { ComponentType } from './component';

import { setupShennongForm, useShennongForm as useForm, z } from '@shennong/common-ui';
import { $t } from '@shennong/locales';

import { initComponentAdapter } from './component';

initComponentAdapter();

setupShennongForm<ComponentType>({
  config: {
    baseModelPropName: 'value',
    // naive-ui组件的空值为null,不能是undefined，否则重置表单时不生效
    emptyStateValue: null,
    modelPropNameMap: {
      Checkbox: 'checked',
      Radio: 'checked',
      Switch: 'checked',
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

const useShennongForm = useForm<ComponentType>;

export { useShennongForm, z };

export type ShennongFormSchema = FormSchema<ComponentType>;
export type { ShennongFormProps };
