/**
 * Cloudinary animated assets: request page 1 only so the browser shows a still
 * (first frame) instead of playing the animation.
 */
export function cloudinaryAnimatedFirstFrameUrl(url: string): string | null {
  const s = url?.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/cloudinary\.com/i.test(u.hostname)) return null;
    const marker = '/image/upload/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const after = u.pathname.slice(idx + marker.length);
    if (after.startsWith('pg_1,') || after.startsWith('pg_1/')) return s;

    const segments = after.split('/');
    if (segments.length < 2) return null;
    const first = segments[0];
    const tail = segments.slice(1).join('/');

    const injected = /^v\d+/i.test(first)
      ? `pg_1/${first}/${tail}`
      : `pg_1,${first}/${tail}`;

    return `${u.origin}${u.pathname.slice(0, idx + marker.length)}${injected}${u.search}`;
  } catch {
    return null;
  }
}

/** Cloudinary video: deliver frame 0 as a still image for posters */
export function cloudinaryVideoFirstFrameUrl(url: string): string | null {
  const s = url?.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/cloudinary\.com/i.test(u.hostname)) return null;
    const videoMarker = '/video/upload/';
    const imageMarker = '/image/upload/';
    const idx = u.pathname.indexOf(videoMarker);
    if (idx === -1) return null;

    const after = u.pathname.slice(idx + videoMarker.length);
    if (after.startsWith('so_0,') || after.startsWith('so_0/')) {
      const imagePath = u.pathname.replace(videoMarker, `${imageMarker}so_0,`);
      return `${u.origin}${imagePath.replace(/\.(mp4|webm|m4v|mov)$/i, '.jpg')}${u.search}`;
    }

    const segments = after.split('/');
    if (segments.length < 2) return null;
    const first = segments[0];
    const tail = segments.slice(1).join('/');
    const injected = /^v\d+/i.test(first)
      ? `so_0/${first}/${tail}`
      : `so_0,${first}/${tail}`;
    const imagePath = `${u.pathname.slice(0, idx)}${imageMarker}${injected}`;
    return `${u.origin}${imagePath.replace(/\.(mp4|webm|m4v|mov)$/i, '.jpg')}${u.search}`;
  } catch {
    return null;
  }
}
