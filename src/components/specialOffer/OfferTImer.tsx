'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  endDate: string | null;
};

type TimeLeft = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(endDate: string | null): TimeLeft {
  if (!endDate) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const target = new Date(endDate).getTime();
  const now = Date.now();
  const total = Math.max(target - now, 0);

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export default function OfferTimer({ endDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(endDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(endDate));

    if (!endDate) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const isExpired = useMemo(() => timeLeft.total <= 0, [timeLeft.total]);

  if (!endDate) return null;

  if (isExpired) {
    return (
      <div className="mt-3 inline-flex max-w-full items-center rounded-full bg-black px-3 py-2 text-[11px] font-semibold uppercase text-white sm:px-4 sm:text-[12px]">
        Offer ended
      </div>
    );
  }

  return (
    <div className="mt-3 min-w-0 max-w-full">
      <span className="block text-[11px] font-semibold uppercase text-[#666] sm:text-[12px]">
        Ends in
      </span>

      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
        <TimerBox label="D" value={pad(timeLeft.days)} />
        <TimerBox label="H" value={pad(timeLeft.hours)} />
        <TimerBox label="M" value={pad(timeLeft.minutes)} />
        <TimerBox label="S" value={pad(timeLeft.seconds)} />
      </div>
    </div>
  );
}

function TimerBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 w-full flex-col items-center rounded-[10px] bg-black px-1.5 py-2 text-white sm:rounded-[12px] sm:px-2">
      <span className="text-[12px] font-bold leading-none sm:text-[14px]">
        {value}
      </span>
      <span className="mt-1 text-[9px] font-medium uppercase leading-none text-white/75">
        {label}
      </span>
    </div>
  );
}