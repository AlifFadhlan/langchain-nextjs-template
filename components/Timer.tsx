"use client";

import React, { useState, useEffect } from 'react';

export default function Timer() {
  const [seconds, setSeconds] = useState(20);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds]);

  return <div>Time remaining: {seconds} seconds</div>;
}