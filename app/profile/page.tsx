"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  _id: string;
  name: string;
  email: string;
  usertype: string;
  isVerified: boolean;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      }
    };

    getProfile();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-400 mb-6">AskSumit AI account details</p>

        {!user ? (
          <p className="text-gray-400">Loading profile...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-black border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Name</p>
              <p className="font-semibold">{user.name}</p>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm">User Type</p>
              <p className="font-semibold capitalize">{user.usertype}</p>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Verified</p>
              <p className={user.isVerified ? "text-green-400" : "text-yellow-400"}>
                {user.isVerified ? "Verified" : "Not Verified"}
              </p>
            </div>

            <div className="bg-black border border-zinc-800 rounded-lg p-4">
              <p className="text-gray-500 text-sm">Joined</p>
              <p className="font-semibold">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-yellow-500 text-black py-3 rounded-lg font-semibold"
          >
            Back to Chat
          </Link>

          <button
            onClick={logout}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}