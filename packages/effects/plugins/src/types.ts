import type { Component } from 'vue';

export interface ShennongPluginsFormOptions {
  useShennongForm: (...args: any[]) => any;
}

export interface ShennongPluginsModalOptions {
  useShennongModal?: () => any;
}

export interface ShennongPluginsMessageOptions {
  useMessage?: () => any;
}

export interface ShennongPluginsComponentsOptions {
  [key: string]: Component;
}

export interface ShennongPluginsOptions {
  form?: ShennongPluginsFormOptions;
  modal?: ShennongPluginsModalOptions;
  message?: ShennongPluginsMessageOptions;
  components?: ShennongPluginsComponentsOptions;
}
