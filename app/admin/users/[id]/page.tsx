"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Chat = {
    _id: string;
    message: string;
    response: string;
    createdAt: string;
};

type UserDetails = {
    user: User;
    totalChats: number;
    totalConversations: number;
    conversations: Conversation[];
    chats: Chat[];
};

type User = {
    _id: string;
    name: string;
    email: string;
    usertype: string;
    isVerified: boolean;
    createdAt: string;
};

type Conversation = {
    _id: string;
    title: string;
    createdAt: string;
};


export default function AdminUserDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const [details, setDetails] = useState<UserDetails | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const res = await fetch(`/api/admin/users/${params.id}`);
            const data = await res.json();

            if (!data.success) {
                router.push("/admin");
                return;
            }

            setDetails(data);
        };

        loadUser();
    }, [params.id, router]);

    if (!details) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading user details...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-10">
            <Link href="/admin" className="text-yellow-400 hover:underline">
                ← Back to Admin
            </Link>

            <h1 className="text-4xl font-bold mt-6 mb-8">User Details</h1>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Profile</h2>
                    <p><span className="text-gray-400">Name:</span> {details.user.name}</p>
                    <p><span className="text-gray-400">Email:</span> {details.user.email}</p>
                    <p><span className="text-gray-400">Role:</span> {details.user.usertype}</p>
                    <p>
                        <span className="text-gray-400">Verified:</span>{" "}
                        {details.user.isVerified ? "Yes" : "No"}
                    </p>
                    <p>
                        <span className="text-gray-400">Joined:</span>{" "}
                        {new Date(details.user.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Activity</h2>
                    <p className="text-3xl font-bold">{details.totalChats}</p>
                    <p className="text-gray-400 mb-4">Total Chats</p>

                    <p className="text-3xl font-bold">{details.totalConversations}</p>
                    <p className="text-gray-400">Total Conversations</p>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Recent Conversations</h2>

                {details.conversations.length === 0 ? (
                    <p className="text-gray-400">No conversations found.</p>
                ) : (
                    <div className="space-y-3">
                        {details.conversations.map((conversation) => (
                            <button
                                key={conversation._id}
                                onClick={() => router.push(`/admin/conversations/${conversation._id}`)}
                                className="w-full text-left bg-black border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition"
                            >
                                <p className="font-semibold">{conversation.title}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(conversation.createdAt).toLocaleString()}
                                </p>


                            </button>
                        ))}
                    </div>
                )}
                <div className="bg-zinc-900 rounded-xl p-6 mt-8">
                    <h2 className="text-2xl font-bold mb-4">Chat History</h2>

                    {details.chats.length === 0 ? (
                        <p className="text-gray-400">No chats found.</p>
                    ) : (
                        <div className="space-y-5">
                            {details.chats.map((chat) => (
                                <div
                                    key={chat._id}
                                    className="bg-black border border-zinc-800 rounded-xl p-4"
                                >
                                    <p className="text-sm text-gray-500 mb-2">
                                        {new Date(chat.createdAt).toLocaleString()}
                                    </p>

                                    <div className="mb-3">
                                        <p className="text-yellow-400 font-semibold">User</p>
                                        <p className="text-gray-200 whitespace-pre-wrap">
                                            {chat.message}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-green-400 font-semibold">AskSumit AI</p>
                                        <p className="text-gray-200 whitespace-pre-wrap">
                                            {chat.response}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}