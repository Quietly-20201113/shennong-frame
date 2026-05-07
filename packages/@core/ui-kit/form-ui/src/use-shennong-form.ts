import type {
  BaseFormComponentType,
  ExtendedFormApi,
  ShennongFormProps,
} from './types';

import { defineComponent, h, isReactive, onBeforeUnmount, watch } from 'vue';

import { useStore } from '@shennong-core/shared/store';

import { FormApi } from './form-api';
import ShennongUseForm from './shennong-use-form.vue';

export function useShennongForm<
  T extends BaseFormComponentType = BaseFormComponentType,
  P extends Record<string, any> = Record<never, never>,
>(options: ShennongFormProps<T, P>) {
  const IS_REACTIVE = isReactive(options);
  const api = new FormApi(options as unknown as ShennongFormProps);
  const extendedApi: ExtendedFormApi = api as never;
  extendedApi.useStore = (selector) => {
    return useStore(api.store, selector);
  };

  const Form = defineComponent(
    (props: ShennongFormProps, { attrs, slots }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });
      api.setState({ ...props, ...attrs });
      return () =>
        h(ShennongUseForm, { ...props, ...attrs, formApi: extendedApi }, slots);
    },
    {
      name: 'ShennongUseForm',
      inheritAttrs: false,
    },
  );
  // Add reactivity support
  if (IS_REACTIVE) {
    watch(
      () => options.schema,
      () => {
        api.setState({ schema: options.schema });
      },
      { immediate: true },
    );
  }

  return [Form, extendedApi] as const;
}
