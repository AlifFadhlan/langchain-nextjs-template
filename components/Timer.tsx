"use client";

import React, { useState, useEffect } from "react";

export default function Timer(props: { messages: any[] }) {
  const [seconds, setSeconds] = useState(900);

  const { messages } = props;

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleButtonClick = async () => {
    const response = await fetch("api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });
    const data = await response;
    console.log(data);
  };

  return (
    <div className="flex justify-between items-center">
      <div>Time remaining: {seconds} seconds</div>
      <button
        onClick={handleButtonClick}
        className="px-4 py-2 bg-yellow-500 rounded"
      >
        Selesai
      </button>
    </div>
  );
}
