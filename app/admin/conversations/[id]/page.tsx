"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Conversation = {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Chat = {
  _id: string;
  message: string;
  response: string;
  createdAt: string;
};

type ConversationDetails = {
  conversation: Conversation;
  chats: Chat[];
};

export default function AdminConversationPage() {
  const params = useParams();
  const router = useRouter();

  const [details, setDetails] =
    useState<ConversationDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/admin/conversations/${params.id}`
        );

        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to load conversation");
          return;
        }

        setDetails(data);
      } catch (error) {
        console.error("LOAD_CONVERSATION_ERROR:", error);

        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading conversation...
      </main>
    );
  }

  if (error || !details) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">
          {error || "Conversation not found"}
        </p>

        <button
          onClick={() => router.push("/admin")}
          className="bg-yellow-500 text-black px-5 py-2 rounded-lg font-semibold"
        >
          Back to Admin
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() =>
            router.push(
              `/admin/users/${details.conversation.userId}`
            )
          }
          className="text-yellow-400 hover:underline mb-6"
        >
          ← Back to User
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h1 className="text-3xl font-bold mb-3">
            {details.conversation.title}
          </h1>

          <p className="text-gray-400 text-sm">
            Created:{" "}
            {new Date(
              details.conversation.createdAt
            ).toLocaleString()}
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Conversation ID: {details.conversation._id}
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-6">
          Chat Messages
        </h2>

        {details.chats.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">
              No chat messages are linked to this conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {details.chats.map((chat) => (
              <div key={chat._id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-2xl bg-yellow-500 text-black rounded-2xl px-5 py-3">
                    <p className="whitespace-pre-wrap">
                      {chat.message}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3">
                    <p className="text-green-400 font-semibold mb-2">
                      AskSumit AI
                    </p>

                    <p className="text-gray-200 whitespace-pre-wrap">
                      {chat.response}
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-600">
                  {new Date(chat.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}