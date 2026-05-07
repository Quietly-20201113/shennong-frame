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
      modelPropNameMap: {
        Upload: 'fileList',
        CheckboxGroup: 'model-value',
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
