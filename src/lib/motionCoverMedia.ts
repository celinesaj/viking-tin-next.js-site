/** True when the motion-cover URL is a video (e.g. MP4), not an animated GIF */
export function isMotionCoverVideoUrl(urlOrPath: string): boolean {
  const s = urlOrPath.trim().toLowerCase();
  if (!s) return false;
  if (s.includes('/video/upload/')) return true;
  return /\.(mp4|webm|m4v|mov)(\?|#|$)/i.test(s);
}

export function isMotionCoverVideoFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('video/')) return true;
  const n = file.name.toLowerCase();
  return /\.(mp4|webm|m4v|mov)$/i.test(n);
}
