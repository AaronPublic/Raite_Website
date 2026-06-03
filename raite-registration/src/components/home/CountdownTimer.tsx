"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm border">
        <span className="text-4xl font-bold text-blue-600">{timeLeft.days}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wider">Days</span>
      </div>
      <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm border">
        <span className="text-4xl font-bold text-blue-600">{timeLeft.hours}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wider">Hours</span>
      </div>
      <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm border">
        <span className="text-4xl font-bold text-blue-600">{timeLeft.minutes}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wider">Mins</span>
      </div>
      <div className="flex flex-col p-4 bg-white rounded-xl shadow-sm border">
        <span className="text-4xl font-bold text-blue-600">{timeLeft.seconds}</span>
        <span className="text-sm text-gray-500 uppercase tracking-wider">Secs</span>
      </div>
    </div>
  );
}
