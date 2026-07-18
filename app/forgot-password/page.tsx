"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      localStorage.setItem("resetEmail", email);
      setTimeout(() => router.push("/verify-otp"), 1000);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
        <p className="text-gray-400 mb-6">Enter your registered email</p>

        {message && (
          <div className="mb-4 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-yellow-400">
            {message}
          </div>
        )}

        <input
          className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendOtp}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          Send OTP
        </button>

        <p className="mt-6 text-center text-gray-400">
          Remember password?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}