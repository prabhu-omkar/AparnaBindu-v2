/**
 * Resolves a public asset path with the Vite base URL.
 * In development, BASE_URL is '/', in production (GitHub Pages) it's '/AparnaBindu-v2/'.
 * This ensures image paths like '/kolam_gallery/...' resolve correctly in both environments.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
