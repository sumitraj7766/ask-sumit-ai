"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

   const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);


  const loginUser = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    setLoading(true);



setMessage(data.message);
setIsError(!data.success);

setLoading(false);

    

    if (data.success) {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Login</h1>
        <p className="text-gray-400 mb-6">Welcome back to AskSumit AI</p>

        <input
          className="w-full mb-4 bg-black border border-zinc-700 rounded-lg px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={loginUser}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          Login
        </button>
      </div>

      <div className="mt-6 text-center">
  <p className="text-gray-400">
        Don&apos;t have an account?
    <a
      href="/register"
      className="text-yellow-400 hover:underline"
    >
      Create Account
    </a>
    

  
  </p>

  <Link href="/forgot-password" className="text-sm text-yellow-400 hover:underline">
  Forgot Password?
</Link>
<hr className="my-4 border-t border-zinc-700" />

  <button
  onClick={loginUser}
  disabled={loading}
>
  {loading ? "Logging in..." : "Login"}
</button>

{message && (
  <div
    className={`mt-4 text-sm text-center px-4 py-3 rounded-lg border ${
      isError
        ? "bg-red-500/10 text-red-400 border-red-500/30"
        : "bg-green-500/10 text-green-400 border-green-500/30"
    }`}
  >
    {message}
  </div>
)}
</div>
    </main>
  );
}