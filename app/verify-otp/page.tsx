"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const verifyOtp = async () => {
    const email = localStorage.getItem("resetEmail");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      setTimeout(() => router.push("/reset-password"), 1000);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Verify OTP</h1>
        <p className="text-gray-400 mb-6">Enter the OTP sent to your email</p>

        {message && (
          <div className="mb-4 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-yellow-400">
            {message}
          </div>
        )}

        <input
          className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={verifyOtp}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          Verify OTP
        </button>
      </div>
    </main>
  );
}