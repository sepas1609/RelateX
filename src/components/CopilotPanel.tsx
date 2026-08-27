import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  X,
  Trash2,
  HelpCircle,
  Code2,
} from "lucide-react";
import { CopilotMessage, DatabaseSchema } from "../types";

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  messages: CopilotMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onClearHistory: () => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  schema,
  messages,
  onSendMessage,
  isLoading,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText("");
    onSendMessage(msg);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    "How do I query a user's total spend across all completed orders?",
    "Find potential N+1 query bottlenecks in this schema.",
    "Write an aggregation query for revenue grouped by category.",
    "How should I index these tables for high-frequency writes vs reads?",
  ];

  // Helper to extract and format ```sql code blocks
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith("```")) {
            const lines = part.slice(3, -3).trim().split("\n");
            const lang = lines[0].trim();
            const code = lines.slice(lang ? 1 : 0).join("\n");
            const snippetId = `${msgId}-${idx}`;

            return (
              <div
                key={idx}
                className="my-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden"
              >
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-cyan-400 font-semibold uppercase">
                    {lang || "SQL"}
                  </span>
                  <button
                    onClick={() => handleCopyCode(code, snippetId)}
                    className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                  >
                    {copiedId === snippetId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 font-mono text-[11.5px] text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {code}
                </pre>
              </div>
            );
          }

          return (
            <p key={idx} className="whitespace-pre-wrap text-slate-200">
              {part}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      id="copilot-drawer"
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">
                Schema Copilot
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aware of {schema.tables.length} tables & {schema.relations.length} relations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-colors text-xs"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-200">
                Ask anything about your database
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                RelateX Copilot generates optimized SQL queries, explains complex joins, and suggests indexing strategies tailored to your exact schema.
              </p>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                Suggested Prompts:
              </span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(p)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-200 border border-slate-800/80 hover:border-indigo-700/50 text-xs text-left transition-all"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-cyan-500/10"
                      : "bg-slate-950 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-md"
                  }`}
                >
                  {renderMessageContent(msg.content, msg.id)}
                  <span className="text-[9px] text-slate-500 block text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Generating SQL query & analysis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
      >
        <input
          id="copilot-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask about ${schema.tables.length} tables in ${schema.dialect}...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
