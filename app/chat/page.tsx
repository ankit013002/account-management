"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowDown,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What accounts do I have?",
  "What is my Gmail password?",
  "Show all shopping accounts",
  "What email do I use for Amazon?",
  "List all banking accounts",
  "Which accounts have no password?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setOllamaOnline(d.online))
      .catch(() => setOllamaOnline(false));
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (!streaming) scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: `Error: ${err.error ?? "Unknown error"}`,
          },
        ]);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            const token: string = chunk.message?.content ?? "";
            if (token) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + token },
                ];
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const statusDot =
    ollamaOnline === null
      ? "w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"
      : ollamaOnline
        ? "w-1.5 h-1.5 rounded-full bg-emerald-500"
        : "w-1.5 h-1.5 rounded-full bg-red-500";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 pl-16 md:pl-8 py-4 border-b border-zinc-800/60 bg-[#08080a]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">
              AI Assistant
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={statusDot} />
              <span className="text-[11px] text-zinc-600">
                {ollamaOnline === null
                  ? "Checking…"
                  : ollamaOnline
                    ? "llama3.1:latest · online"
                    : "Ollama offline"}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 px-3 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Offline warning */}
      {ollamaOnline === false && (
        <div className="mx-6 md:mx-8 mt-4 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Ollama is not running. Start it with{" "}
            <code className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">
              ollama serve
            </code>{" "}
            and ensure{" "}
            <code className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">
              llama3.1:latest
            </code>{" "}
            is pulled.
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 glow-pulse">
              <Bot className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-zinc-200 font-semibold text-lg mb-1">
              Ask about your accounts
            </p>
            <p className="text-zinc-600 text-sm mb-8 max-w-sm leading-relaxed">
              I have full access to your vault. Ask for passwords, usernames,
              URLs, or anything else.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-200 rounded-xl transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "user"
                  ? "flex gap-3 flex-row-reverse animate-fade-up"
                  : "flex gap-3 animate-fade-up"
              }
            >
              <div
                className={
                  msg.role === "user"
                    ? "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-indigo-600 text-white"
                    : "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-800/80 border border-zinc-700/60"
                }
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[78%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-indigo-600 text-white"
                    : "max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900/80 border border-zinc-800/60 text-zinc-200"
                }
              >
                {msg.content || (
                  <span className="inline-flex items-center gap-1 h-4">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom btn */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="fixed bottom-28 right-8 w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center shadow-xl transition-all hover:-translate-y-0.5 z-10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800/60 bg-[#08080a]/80 backdrop-blur-xl px-6 md:px-8 py-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-4 py-3 focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/10 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your accounts… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all hover:shadow-lg hover:shadow-indigo-900/30"
          >
            {streaming ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[11px] text-zinc-700 mt-2">
          Powered by llama3.1:latest via Ollama · all data stays local
        </p>
      </div>
    </div>
  );
}
