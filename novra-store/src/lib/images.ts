export function toImageApiUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/api/store/images")) return src;

  const publicPath = src.startsWith("/") ? src.slice(1) : src;
  return `/api/store/images?path=${encodeURIComponent(publicPath)}`;
}
