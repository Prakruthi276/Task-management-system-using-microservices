/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_URL?: string;
  readonly VITE_USER_URL?: string;
  readonly VITE_TASK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
