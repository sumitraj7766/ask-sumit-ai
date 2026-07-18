"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RecentUser = {
    _id: string;
    name: string;
    email: string;
    usertype: string;
};
type User = {
    _id: string;
    name: string;
    email: string;
    usertype: string;
};

type AdminStats = {
    totalUsers: number;
    totalChats: number;
    totalConversations: number;
    recentUsers: RecentUser[];
};

export default function AdminPage() {
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState<AdminStats | null>(null);
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    useEffect(() => {
        const checkAdminAndLoadUsers = async () => {
            const checkRes = await fetch("/api/admin/check");
            const checkData = await checkRes.json();

            if (!checkData.success) {
                router.push("/dashboard");
                return;
            }

            const usersRes = await fetch("/api/admin/users");
            const usersData = await usersRes.json();

            if (usersData.success) {
                setUsers(usersData.users);
            }
        };



        checkAdminAndLoadUsers();
    }, [router]);

    const deleteUser = async (userId: string) => {
        const confirmDelete = confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        const res = await fetch("/api/admin/users/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        alert(data.message);


        if (data.success) {
            setUsers((prev) => prev.filter((user) => user._id !== userId));


            if (stats) {
                setStats({
                    ...stats,
                    totalUsers: stats.totalUsers - 1,
                });
            }
        }
    };

    useEffect(() => {
        const loadStats = async () => {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();

            if (data.success) {
                setStats(data.stats);
            }
        };

        loadStats();
    }, []);

    const filteredUsers = users.filter((user) => {
        const searchValue = search.toLowerCase();

        return (
            user.name.toLowerCase().includes(searchValue) ||
            user.email.toLowerCase().includes(searchValue)
        );
    });

    if (!stats) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                Ruk Jao Malik Thora Loading ho raha hai...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-10">
            <h1 className="text-4xl font-bold mb-8">
                Admin Dashboard
            </h1>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-zinc-900 rounded-xl p-6">
                    <h2 className="text-gray-400">Users</h2>
                    <p className="text-4xl font-bold mt-2">
                        {stats.totalUsers}
                    </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6">
                    <h2 className="text-gray-400">Chats</h2>
                    <p className="text-4xl font-bold mt-2">
                        {stats.totalChats}
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mb-6 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
                />

                <div className="bg-zinc-900 rounded-xl p-6">
                    <h2 className="text-gray-400">Conversations</h2>
                    <p className="text-4xl font-bold mt-2">
                        {stats.totalConversations}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-5">
                All Users
            </h2>

            <div className="bg-zinc-900 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-800">
                        <tr>
                            <th className="text-left p-4">Name</th>
                            <th className="text-left p-4">Email</th>
                            <th className="text-left p-4">Role</th>
                            <th className="text-left p-4">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user._id} className="border-t border-zinc-800">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">{user.usertype}</td>

                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/users/${user._id}`)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                                        >
                                            👁 View
                                        </button>

                                        <button
                                            onClick={() => deleteUser(user._id)}
                                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-zinc-900 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-800">
                        <tr>
                            <th className="text-left p-4">Name</th>
                            <th className="text-left p-4">Email</th>
                            <th className="text-left p-4">Role</th>
                        </tr>
                    </thead>

                    <tbody>
                        {stats.recentUsers.map((user) => (
                            <tr
                                key={user._id}
                                className="border-t border-zinc-800"
                            >
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">{user.usertype}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}