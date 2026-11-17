'use client';

import { useEffect, useState } from 'react';

export default function BlogSingleImage({
  image,
  title,
}: {
  image: string | null;
  title?: string | null;
}) {
  const [mediaError, setMediaError] = useState(false);
  const imageSrc = image?.trim() ?? '';

  useEffect(() => {
    setMediaError(false);
  }, [image]);

  if (!imageSrc || mediaError) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl">
      <img
        src={imageSrc}
        alt={title?.trim() || 'Blog post banner'}
        className="aspect-[16/9] w-full object-cover"
        loading="eager"
        onError={() => setMediaError(true)}
      />
    </div>
  );
}
