import React, { useState } from "react";
import {
  FileCode,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  X,
  Database,
} from "lucide-react";
import { SqlDialect } from "../types";
import { SAMPLE_SCHEMAS } from "../utils/sampleSchemas";

interface DdlEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDdl: string;
  initialDialect: SqlDialect;
  onApplyDdl: (ddl: string, dialect: SqlDialect) => void;
  onRepairWithAi: (ddl: string, dialect: SqlDialect) => Promise<void>;
  isAiRepairing: boolean;
}

export const DdlEditorModal: React.FC<DdlEditorModalProps> = ({
  isOpen,
  onClose,
  initialDdl,
  initialDialect,
  onApplyDdl,
  onRepairWithAi,
  isAiRepairing,
}) => {
  const [ddlText, setDdlText] = useState(initialDdl);
  const [dialect, setDialect] = useState<SqlDialect>(initialDialect);
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDdlText(content);
        setParseError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ddlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!ddlText.trim()) {
      setParseError("Please provide a DDL script.");
      return;
    }
    onApplyDdl(ddlText, dialect);
    onClose();
  };

  return (
    <div
      id="ddl-editor-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">
                SQL DDL Schema Editor
              </h2>
              <p className="text-xs text-slate-400">
                Paste, edit, or upload database table definitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dialect Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Dialect:</span>
              <select
                id="modal-dialect-select"
                value={dialect}
                onChange={(e) => setDialect(e.target.value as SqlDialect)}
                className="bg-slate-950 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLite">SQLite</option>
                <option value="Snowflake">Snowflake</option>
                <option value="SQL Server">SQL Server</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Samples Banner */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <span>Templates:</span>
            {SAMPLE_SCHEMAS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setDdlText(sample.ddl);
                  setDialect(sample.dialect);
                  setParseError(null);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 text-[11px] font-medium transition-all"
              >
                {sample.name}
              </button>
            ))}
          </div>

          {/* Upload File button */}
          <label className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/50 transition-colors shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .sql</span>
            <input
              type="file"
              accept=".sql,.ddl,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Editor Textarea */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:border-cyan-500/80 transition-colors">
            <textarea
              id="ddl-editor-textarea"
              value={ddlText}
              onChange={(e) => {
                setDdlText(e.target.value);
                setParseError(null);
              }}
              placeholder={`-- Paste your CREATE TABLE statements here...
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
              className="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />

            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Copy SQL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {parseError && (
            <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={() => onRepairWithAi(ddlText, dialect)}
            disabled={isAiRepairing || !ddlText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 border border-purple-700/50 text-xs font-semibold transition-all disabled:opacity-50"
            title="Use Gemini AI to parse complex DDL, fix syntax, and extract full AST"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{isAiRepairing ? "AI Parsing..." : "Repair / Enhance AST with Gemini"}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-apply-ddl"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Render ER Diagram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
