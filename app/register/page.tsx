"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const registerUser = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    setMessage("");
    setIsError(false);

    if (!name || !email || !password || !confirmPassword) {
      setIsError(true);
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Password and Confirm Password do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, userType }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsError(true);
        setMessage(data?.message || "Registration failed. Please try again.");
        return;
      }

      setIsError(!data?.success);
      setMessage(data?.message || "Registered successfully.");

      if (data?.success) {
        router.push("/login");
      }
    } catch (err) {console.error(err);
      
      setIsError(true);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-400 mb-6">Join AskSumit AI</p>

        <input className="w-full mb-4 bg-black border border-zinc-700 rounded-lg px-4 py-3" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />

        <input className="w-full mb-4 bg-black border border-zinc-700 rounded-lg px-4 py-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <input className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <select className="w-full mb-6 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white" value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={registerUser} className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold">
          Register
        </button>
      </div>

      <div className="mt-6 text-center">
  <p className="text-gray-400">
    Already have an account?{" "}
    <a
      href="/login"
      className="text-yellow-400 hover:underline"
    >
      Login
    </a>
  </p>

  <button
  onClick={registerUser}
  disabled={loading}
  className="w-full bg-white-100 text-black py-3 rounded-lg font-semibold disabled:opacity-50"
>
  {loading ? "Creating Account..." : "Create Account"}
</button>
</div>


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
    </main>
  );
}