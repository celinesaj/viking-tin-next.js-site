/** Play when ready; retries on `canplay` if the element has not buffered yet. */
export function tryPlayVideo(video: HTMLVideoElement | null): void {
  if (!video) return;

  const attempt = () => {
    void video.play().catch(() => {});
  };

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    attempt();
    return;
  }

  video.addEventListener('canplay', attempt, { once: true });
}
