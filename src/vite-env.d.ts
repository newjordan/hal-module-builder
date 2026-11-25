/// <reference types="vite/client" />

declare const __HAL_AGENT_WS_URL__: string;
declare const __HAL_BASE_URL__: string;
declare const __HAL_DEV__: boolean;

interface Window {
  /** Present only when Chromium is launched with --js-flags=--expose-gc. */
  gc?: () => void;
}
