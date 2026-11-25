/**
 * Resolve a public asset or route against the Vite base path.
 * `__HAL_BASE_URL__` is injected by Vite. `typeof` keeps Jest from throwing
 * when the build-time define is absent.
 */
export function publicUrl(path: string): string {
  const configured =
    typeof __HAL_BASE_URL__ === 'string' && __HAL_BASE_URL__.length > 0
      ? __HAL_BASE_URL__
      : '/';
  const prefix = configured.endsWith('/') ? configured : `${configured}/`;
  return `${prefix}${path.replace(/^\/+/, '')}`;
}
