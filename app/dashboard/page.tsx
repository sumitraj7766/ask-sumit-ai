"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
  role: "user" | "ai";
  text: string;
};

type Conversation = {
  _id: string;
  title: string;
};

// Speech Recognition types (SpeechRecognition, SpeechRecognitionEvent, and
// window.SpeechRecognition / window.webkitSpeechRecognition) are already
// declared globally in types/speech.d.ts — no need to redeclare them here.

const SUGGESTIONS = [
  "Who is Sumit?",
  "What are Sumit's skills?",
  "What projects has Sumit built?",
  "Show Sumit's GitHub profile",
  "Show Sumit's portfolio",
  "What is Sumit's career goal?",
  "Write Sumit's resume summary",
  "Why should someone hire Sumit?",
];

const TOOL_OPTIONS = [
  { value: "chat", label: "💬 Normal Chat" },
  { value: "pdf", label: "📄 PDF Summarizer" },
  { value: "email", label: "📧 Email Writer" },
  { value: "code", label: "💻 Code Generator" },
  { value: "resume", label: "📝 Resume Improver" },
  { value: "translate", label: "🌐 Translator" },
  { value: "analyze", label: "📊 Document Analyzer" },
];

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "🇺🇸 English" },
  { value: "hi-IN", label: "🇮🇳 Hindi" },
  { value: "es-ES", label: "🇪🇸 Spanish" },
  { value: "fr-FR", label: "🇫🇷 French" },
  { value: "de-DE", label: "🇩🇪 German" },
  { value: "ja-JP", label: "🇯🇵 Japanese" },
];

const WELCOME_MESSAGE: Message = {
  role: "ai",
  text: "Hi, I am AskSumit AI — Sumit Kumar's personal AI agent. Ask me about Sumit's skills, projects, GitHub, portfolio, achievements, career goals, or public profile.",
};

export default function DashboardPage() {
  // ---------- chat state ----------
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // ---------- tool / language state ----------
  const [selectedTool, setSelectedTool] = useState("chat");
  const [language, setLanguage] = useState("en-US");
  const [isListening, setIsListening] = useState(false);

  // ---------- admin state ----------
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminError, setAdminError] = useState("");

  // ---------- ui state ----------
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= data loading =================

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversation/list");
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("LOAD_CONVERSATIONS_ERROR:", err);
    }
  }, []);

  const loadChatHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();

      if (!data.success) return;

      const historyMessages: Message[] = [];

      data.chats.forEach((chat: { message: string; response: string }) => {
        historyMessages.push({ role: "user", text: chat.message });
        historyMessages.push({ role: "ai", text: chat.response });
      });

      if (historyMessages.length > 0) {
        setMessages(historyMessages);
      }
    } catch (err) {
      console.error("LOAD_HISTORY_ERROR:", err);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadChatHistory();
      await loadConversations();
    })();
  }, [loadChatHistory, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ================= chat actions =================

  const streamReply = async (
    res: Response,
    onFirstChunk: () => void,
    onUpdate: (text: string) => void
  ) => {
    const contentType = res.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await res.json();

      if (data.conversationId) setCurrentConversationId(data.conversationId);

      onUpdate(data.reply || "Something went wrong.");
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    const parts: string[] = [];
    let isFirstChunk = true;

    onFirstChunk();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (isFirstChunk) {
        const separatorIndex = chunk.indexOf("\n");

        if (chunk.startsWith("__CONVERSATION_ID__:") && separatorIndex !== -1) {
          const conversationId = chunk
            .substring(0, separatorIndex)
            .replace("__CONVERSATION_ID__:", "")
            .trim();

          setCurrentConversationId(conversationId);

          const remaining = chunk.substring(separatorIndex + 1);
          if (remaining) parts.push(remaining);
        } else {
          parts.push(chunk);
        }

        isFirstChunk = false;
      } else {
        parts.push(chunk);
      }

      onUpdate(parts.join(""));
    }
  };

  const askQuestion = async (question?: string) => {
    const finalMessage = question || message;
    if (!finalMessage.trim()) return;

    const passwordToSend = isAdminMode ? adminPassword.trim() : "";

    setMessages((prev) => [...prev, { role: "user", text: finalMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMessage,
          adminPassword: passwordToSend,
          conversationId: currentConversationId,
          language,
          tool: selectedTool,
        }),
      });

      await streamReply(
        res,
        () => setMessages((prev) => [...prev, { role: "ai", text: "" }]),
        (text) =>
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "ai", text };
            return updated;
          })
      );

      await loadConversations();
    } catch (error) {
      console.error("CHAT_ERROR:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const regenerateResponse = async (index: number) => {
    const previousUserMessage = [...messages]
      .slice(0, index)
      .reverse()
      .find((msg) => msg.role === "user");

    if (!previousUserMessage) return;

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: previousUserMessage.text,
          adminPassword: isAdminMode ? adminPassword.trim() : "",
          conversationId: currentConversationId,
          language,
          tool: selectedTool,
        }),
      });

      await streamReply(
        res,
        () => { },
        (text) =>
          setMessages((prev) =>
            prev.map((msg, i) => (i === index ? { ...msg, text } : msg))
          )
      );
    } catch (error) {
      console.error("REGENERATE_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("COPY_ERROR:", error);
    }
  };

  const clearChat = async () => {
    const confirmClear = confirm("Are you sure you want to clear all chats?");
    if (!confirmClear) return;

    const res = await fetch("/api/chat/clear", { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      setMessages([
        { role: "ai", text: "Chat history cleared. How can I help you now?" },
      ]);
    }
  };

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => {
        const sender = msg.role === "user" ? "User" : "AskSumit AI";
        return `${sender}:\n${msg.text}\n`;
      })
      .join("\n-----------------------\n\n");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `AskSumit-Chat-${new Date().toISOString()}.txt`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renameConversation = async (conversation: Conversation) => {
    const newTitle = prompt("Enter new conversation title:", conversation.title);
    if (!newTitle || newTitle.trim() === "") return;

    const res = await fetch("/api/conversation/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation._id, title: newTitle }),
    });

    const data = await res.json();

    if (data.success) {
      loadConversations();
    } else {
      alert(data.message);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const verifyAdmin = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    });

    const data = await res.json();

    if (data.success) {
      window.location.href = "/admin";
    } else {
      setAdminError(data.message);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/document/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: "✅ PDF uploaded successfully. You can now ask questions about this document.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: `❌ ${data.message || "Upload failed"}` },
        ]);
      }
    } catch (error) {
      console.error("UPLOAD_ERROR:", error);
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Upload failed" }]);
    } finally {
      // Allow selecting the same file again
      e.target.value = "";
    }
  };

  const startListening = () => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  // ================= render =================

  const themeClasses =
    theme === "dark" ? "bg-[#080808] text-white" : "bg-gray-100 text-black";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        <DashboardHeader
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onClearChat={clearChat}
          onExportChat={exportChat}
          onLogout={logout}
          onOpenAdminModal={() => setShowAdminModal(true)}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <Sidebar
            conversations={conversations}
            isAdminMode={isAdminMode}
            adminPassword={adminPassword}
            onToggleAdminMode={() => setIsAdminMode((prev) => !prev)}
            onAdminPasswordChange={setAdminPassword}
            onRenameConversation={renameConversation}
          />

          <div className="flex flex-col gap-6">
            <IntroBlock />

            <ChatPanel
              messages={messages}
              loading={loading}
              messagesEndRef={messagesEndRef}
              onCopy={copyResponse}
              onRegenerate={regenerateResponse}
              onSpeak={speak}
            />

            <Composer
              message={message}
              onMessageChange={setMessage}
              onAsk={() => askQuestion()}
              loading={loading}
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
              language={language}
              onLanguageChange={setLanguage}
              isListening={isListening}
              onStartListening={startListening}
            />

            <SuggestionsRow onSuggestionClick={(q) => askQuestion(q)} />
          </div>
        </div>

        <footer className="pt-10 border-t border-zinc-900 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} AskSumit AI • Dashboard • Built with Next.js,
          Groq AI, Agentic AI & Privacy Control
        </footer>
      </div>

      {showAdminModal && (
        <AdminModal
          adminPassword={adminPassword}
          adminError={adminError}
          onPasswordChange={(v) => {
            setAdminPassword(v);
            setAdminError("");
          }}
          onCancel={() => {
            setShowAdminModal(false);
            setAdminPassword("");
            setAdminError("");
          }}
          onSubmit={verifyAdmin}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={handleDocumentUpload}
      />
    </main>
  );
}

// ================= subcomponents =================

function DashboardHeader({
  theme,
  onToggleTheme,
  onClearChat,
  onExportChat,
  onLogout,
  onOpenAdminModal,
  onUploadClick,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onLogout: () => void;
  onOpenAdminModal: () => void;
  onUploadClick: () => void;
}) {
  return (
    <header className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">AskSumit AI Dashboard</h1>
        <p className="text-sm text-gray-400">Personal AI Agent of Sumit Kumar</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">Online</span>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition"
        >
          + New Chat
        </Link>

        <Link
          href="/settings"
          className="bg-zinc-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 hover:text-white transition"
        >
          Settings
        </Link>

        <Link
          href="/profile"
          className="bg-zinc-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 hover:text-white transition"
        >
          Profile
        </Link>

        <button
          type="button"
          onClick={onToggleTheme}
          className="bg-zinc-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-700 transition"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        <button
          type="button"
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
        >
          📄 Upload Document
        </button>

        <button
          type="button"
          onClick={onExportChat}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          📄 Export Chat
        </button>

        <button
          type="button"
          onClick={onClearChat}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Clear Chat
        </button>

        <button
          type="button"
          onClick={onOpenAdminModal}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Admin
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

function Sidebar({
  conversations,
  isAdminMode,
  adminPassword,
  onToggleAdminMode,
  onAdminPasswordChange,
  onRenameConversation,
}: {
  conversations: Conversation[];
  isAdminMode: boolean;
  adminPassword: string;
  onToggleAdminMode: () => void;
  onAdminPasswordChange: (value: string) => void;
  onRenameConversation: (conversation: Conversation) => void;
}) {
  return (
    <aside className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-fit flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Admin Mode</h3>
            <p className="text-sm text-gray-400">Use only if you are Sumit/admin.</p>
          </div>

          <button
            type="button"
            onClick={onToggleAdminMode}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${isAdminMode ? "bg-yellow-500 text-black" : "bg-zinc-800 text-gray-300"
              }`}
          >
            {isAdminMode ? "Enabled" : "Disabled"}
          </button>
        </div>

        {isAdminMode && (
          <div>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => onAdminPasswordChange(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 outline-none text-white"
            />
            <p className="text-xs text-green-400 mt-2">
              Admin mode is active. Password length: {adminPassword.length}
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase text-gray-500 mb-2">Recent Chats</p>

        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-sm text-gray-500">No conversations yet.</p>
          )}

          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 rounded-lg px-3 py-2"
            >
              <span className="truncate text-sm">{conversation.title}</span>

              <button
                type="button"
                onClick={() => onRenameConversation(conversation)}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
                title="Rename Conversation"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function IntroBlock() {
  return (
    <div>
      <p className="text-yellow-400 font-medium mb-3">
        AI Agent • Public + Admin Privacy Control
      </p>

      <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
        Ask anything about Sumit.
      </h2>

      <p className="text-gray-300 leading-relaxed">
        Ask public questions about Sumit&apos;s skills, projects, education,
        achievements, GitHub, portfolio, and career goals. Admin mode can access
        protected private profile data using a password.
      </p>
    </div>
  );
}

function ChatPanel({
  messages,
  loading,
  messagesEndRef,
  onCopy,
  onRegenerate,
  onSpeak,
}: {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onCopy: (text: string) => void;
  onRegenerate: (index: number) => void;
  onSpeak: (text: string) => void;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="border-b border-zinc-800 px-5 py-4">
        <p className="text-sm text-gray-400">asksumit-ai live chat session</p>
      </div>

      <div className="h-[420px] overflow-y-auto p-5 space-y-5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-900 text-gray-200 border border-zinc-800"
                }`}
            >
              {msg.role === "ai" ? (
                <AiMessage
                  text={msg.text}
                  onCopy={() => onCopy(msg.text)}
                  onRegenerate={() => onRegenerate(index)}
                  onSpeak={() => onSpeak(msg.text)}
                />
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-gray-500 text-sm">AskSumit AI is thinking...</div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function AiMessage({
  text,
  onCopy,
  onRegenerate,
  onSpeak,
}: {
  text: string;
  onCopy: () => void;
  onRegenerate: () => void;
  onSpeak: () => void;
}) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");

            if (match) {
              return (
                <SyntaxHighlighter language={match[1]} style={vscDarkPlus} PreTag="div">
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-yellow-400" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>

      <div className="flex gap-4 mt-3">
        <button type="button" onClick={onCopy} className="text-xs text-gray-400 hover:text-white">
          📋 Copy Response
        </button>
        <button type="button" onClick={onRegenerate} className="text-xs text-gray-400 hover:text-white">
          ♻️ Regenerate
        </button>
        <button type="button" onClick={onSpeak} className="text-xs text-gray-400 hover:text-white">
          🔊 Listen
        </button>
      </div>
    </div>
  );
}

function Composer({
  message,
  onMessageChange,
  onAsk,
  loading,
  selectedTool,
  onToolChange,
  language,
  onLanguageChange,
  isListening,
  onStartListening,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  onAsk: () => void;
  loading: boolean;
  selectedTool: string;
  onToolChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  isListening: boolean;
  onStartListening: () => void;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAsk();
          }}
          placeholder="Ask about Sumit's skills, projects, GitHub, portfolio..."
          className="flex-1 min-w-[200px] bg-black border border-zinc-700 rounded-lg px-4 py-3 outline-none text-white"
        />

        <button
          type="button"
          onClick={onAsk}
          disabled={loading}
          className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          Ask
        </button>

        <select
          value={selectedTool}
          onChange={(e) => onToolChange(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
        >
          {TOOL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onStartListening}
          disabled={isListening}
          className={`px-4 py-3 rounded-lg ${isListening ? "bg-red-600" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
        >
          {isListening ? "🎙️" : "🎤"}
        </button>

        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-zinc-800 text-white rounded-lg px-3 py-2"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SuggestionsRow({ onSuggestionClick }: { onSuggestionClick: (q: string) => void }) {
  return (
    <div>
      <p className="text-gray-400 text-sm mb-3">Try asking:</p>

      <div className="flex flex-wrap gap-3">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSuggestionClick(q)}
            className="border border-zinc-700 px-4 py-2 rounded-full text-sm hover:bg-zinc-900 transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminModal({
  adminPassword,
  adminError,
  onPasswordChange,
  onCancel,
  onSubmit,
}: {
  adminPassword: string;
  adminError: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
        <p className="text-gray-400 mb-4">Enter the admin password to continue.</p>

        <input
          type="password"
          value={adminPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Admin Password"
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 mb-3"
        />

        {adminError && <p className="text-red-500 text-sm mb-3">{adminError}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 bg-zinc-800 py-3 rounded-lg">
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 bg-yellow-500 text-black py-3 rounded-lg font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}