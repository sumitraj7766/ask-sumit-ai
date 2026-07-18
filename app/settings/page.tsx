"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  name: string;
  email: string;
  usertype: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setName(data.user.name);
      }
    };

    loadProfile();
  }, []);

  const deleteAccount = async () => {
      const confirmDelete = confirm(
        "Are you sure? This will permanently delete your account and all chats."
      );

      if (!confirmDelete) return;

      const res = await fetch("/api/settings/account", {
        method: "DELETE"
      });

      const data = await res.json();

      alert(data.message);

      if (data.success) {
        window.location.href = "/register";
      }
    };

  const updateProfile = async () => {
    const res = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    setMessage(data.message);

    if (data.success) {
      setUser(data.user);
    }
  };

  const changePassword = async () => {
    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    

    const data = await res.json();
    setPasswordMessage(data.message);

    if (data.success) {
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400 mb-6">Manage your account settings</p>

        {!user ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Profile</h2>

              <input
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />

              <input
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-gray-500"
                value={user.email}
                disabled
              />

              <input
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-gray-500"
                value={user.usertype}
                disabled
              />

              <button
                onClick={updateProfile}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
              >
                Save Profile
              </button>

              {message && (
                <p className="text-center text-green-400 text-sm">{message}</p>
              )}
            </section>

            <section className="space-y-4 border-t border-zinc-800 pt-6">
              <h2 className="text-xl font-semibold">Change Password</h2>

              <input
                type="password"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
              />

              <input
                type="password"
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
              />

              <button
                onClick={changePassword}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold"
              >
                Change Password
              </button>

              <button
                onClick={deleteAccount}
                className="w-full mt-6 bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-800"
              >
                Delete Account
              </button>

              {passwordMessage && (
                <p className="text-center text-sm text-green-400">
                  {passwordMessage}
                </p>
              )}
            </section>
          </div>
        )}

        <Link
          href="/dashboard"
          className="block mt-6 text-center text-yellow-400 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}