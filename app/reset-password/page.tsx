"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const resetPassword = async () => {
    const email = localStorage.getItem("resetEmail");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      localStorage.removeItem("resetEmail");
      setTimeout(() => router.push("/login"), 1000);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">Create your new password</p>

        {message && (
          <div className="mb-4 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-yellow-400">
            {message}
          </div>
        )}

        <input
          className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3"
          placeholder="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button
          onClick={resetPassword}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          Reset Password
        </button>
      </div>
    </main>
  );
}