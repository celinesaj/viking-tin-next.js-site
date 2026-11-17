'use client';

import { COLORS } from '@/constants/colors';
import { useGetMarqueeQuery } from '@/features/marquee/marqueeApi';

const FALLBACK_TEXT = 'Viking Tin.';

export default function TopMarquee() {
  const { data: marqueeItems = [] } = useGetMarqueeQuery();

  const text =
    marqueeItems.length > 0
      ? marqueeItems.map((item) => item.text).join(' ★ ')
      : FALLBACK_TEXT;

  return (
    <div
      style={{
        width: '100vw',
        overflow: 'hidden',
        background: COLORS.black,
        color: COLORS.white,
        whiteSpace: 'nowrap',
        position: 'relative',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="track">
        <span className="text">{text}</span>
      </div>

      <style jsx>{`
        .track {
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
          animation: scroll 12s linear infinite;
        }

        .text {
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.08em;
          white-space: nowrap;
          display: inline-block;
        }

        @keyframes scroll {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }
      `}</style>
    </div>
  );
}