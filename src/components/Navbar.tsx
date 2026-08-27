import React from "react";
import {
  Database,
  Cpu,
  Sparkles,
  MessageSquare,
  FileCode,
  Download,
  Key,
  LayoutGrid,
  Layers,
  Search,
  Plus,
  RefreshCw,
  Share2,
  Table as TableIcon,
  Sliders,
  Activity,
  FileText,
} from "lucide-react";
import { CanvasLayoutMode, DatabaseSchema, ErdNotationMode, SqlDialect } from "../types";
import { SAMPLE_SCHEMAS } from "../utils/sampleSchemas";

interface NavbarProps {
  schema: DatabaseSchema;
  dialect: SqlDialect;
  onSelectDialect: (d: SqlDialect) => void;
  onSelectSample: (sampleId: string) => void;
  onOpenDdlEditor: () => void;
  onOpenOptimizer: () => void;
  onOpenQueryExplainer: () => void;
  onOpenCopilot: () => void;
  onOpenMockData: () => void;
  onOpenExport: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey: boolean;
  layoutMode: CanvasLayoutMode;
  onChangeLayout: (mode: CanvasLayoutMode) => void;
  notationMode: ErdNotationMode;
  onChangeNotationMode: (mode: ErdNotationMode) => void;
  onOpenNotationGuide: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  schema,
  dialect,
  onSelectDialect,
  onSelectSample,
  onOpenDdlEditor,
  onOpenOptimizer,
  onOpenQueryExplainer,
  onOpenCopilot,
  onOpenMockData,
  onOpenExport,
  onOpenApiKeyModal,
  hasCustomApiKey,
  layoutMode,
  onChangeLayout,
  notationMode,
  onChangeNotationMode,
  onOpenNotationGuide,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  return (
    <header
      id="relatex-navbar"
      className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 sticky top-0"
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-sky-400 p-[1px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              RelateX
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 uppercase tracking-wider">
              Studio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            AI Schema Visualizer & Index Optimizer
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-800">
          <select
            id="sample-schema-select"
            value=""
            onChange={(e) => {
              if (e.target.value) onSelectSample(e.target.value);
            }}
            className="bg-slate-900/90 text-xs text-slate-300 border border-slate-700/70 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="" disabled>
              Load Sample Template...
            </option>
            {SAMPLE_SCHEMAS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.dialect})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Search & Category Filter */}
      <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="schema-search-input"
            type="text"
            placeholder="Search tables, columns, PK/FK..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/80 text-xs text-slate-200 pl-9 pr-8 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="bg-slate-900/80 text-xs text-slate-300 border border-slate-800 rounded-lg px-2 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Domains ({schema.tables.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Action Tools & AI Features */}
      <div className="flex items-center gap-2">
        {/* DDL Input & Editor */}
        <button
          id="btn-edit-ddl"
          onClick={onOpenDdlEditor}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
          title="Edit SQL DDL script or paste new schema"
        >
          <FileCode className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">DDL Editor</span>
        </button>

        {/* AI Performance & Index Advisor (Gemini) */}
        <button
          id="btn-open-optimizer"
          onClick={onOpenOptimizer}
          className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm shadow-amber-500/10 active:scale-95 group"
          title="AI-powered Index recommendations & anti-pattern schema audit"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Index Advisor</span>
          <span className="sm:hidden">Advisor</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
        </button>

        {/* AI Query Explainer */}
        <button
          id="btn-open-query-explainer"
          onClick={onOpenQueryExplainer}
          className="flex items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-600/50 hover:border-cyan-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          title="Explain and optimize SQL query execution plans"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Query Explainer</span>
        </button>

        {/* AI Schema Copilot */}
        <button
          id="btn-open-copilot"
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 hover:border-indigo-500 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          title="Ask questions in plain English & generate SQL queries"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Copilot</span>
        </button>

        {/* Mock Data Generator */}
        <button
          id="btn-open-mock-data"
          onClick={onOpenMockData}
          className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          title="Generate referentially valid synthetic INSERT SQL"
        >
          <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Mock Data</span>
        </button>

        {/* Export Modal */}
        <button
          id="btn-open-export"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
          title="Export as PDF Report, DBML, Mermaid, SQL or high-res Image"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Layout Switcher */}
        <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            id="btn-layout-hierarchical"
            onClick={() => onChangeLayout("hierarchical")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              layoutMode === "hierarchical"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Hierarchical Topological Flow"
          >
            Tree
          </button>
          <button
            id="btn-layout-grid"
            onClick={() => onChangeLayout("grid")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              layoutMode === "grid"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Grid Distribution"
          >
            Grid
          </button>
          <button
            id="btn-layout-compact"
            onClick={() => onChangeLayout("compact")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              layoutMode === "compact"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Compact Column Layout"
          >
            Compact
          </button>
        </div>

        {/* Notation Selector Dropdown (Responsive) */}
        <div className="hidden xl:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 gap-1.5">
          <span className="text-[10.5px] text-slate-400 font-mono">Notation:</span>
          <select
            id="navbar-notation-select"
            value={notationMode}
            onChange={(e) => onChangeNotationMode(e.target.value as ErdNotationMode)}
            className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="crows_foot" className="bg-slate-900 text-slate-200">🦅 Crow's Foot</option>
            <option value="chen" className="bg-slate-900 text-slate-200">🔷 Peter Chen ER</option>
            <option value="uml" className="bg-slate-900 text-slate-200">📐 UML / IDEF1X</option>
            <option value="bachman" className="bg-slate-900 text-slate-200">🕸️ Bachman DSD</option>
            <option value="star_snowflake" className="bg-slate-900 text-slate-200">⭐ Star / Kimball</option>
          </select>
        </div>

        {/* API Key Modal Button */}
        <button
          id="btn-open-api-key"
          onClick={onOpenApiKeyModal}
          className={`p-2 rounded-lg border transition-all text-xs ${
            hasCustomApiKey
              ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-400"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
          title="Google AI Studio Gemini API Key Settings"
        >
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
