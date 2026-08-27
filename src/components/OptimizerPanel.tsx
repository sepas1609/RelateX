import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  Zap,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Flame,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { DatabaseSchema, OptimizationReport } from "../types";

interface OptimizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  report: OptimizationReport | null;
  isLoading: boolean;
  onRunAudit: () => Promise<void>;
  onApplySqlPatch: (patchSql: string) => void;
}

export const OptimizerPanel: React.FC<OptimizerPanelProps> = ({
  isOpen,
  onClose,
  schema,
  report,
  isLoading,
  onRunAudit,
  onApplySqlPatch,
}) => {
  const [activeTab, setActiveTab] = useState<
    "missing" | "composite" | "antipatterns" | "normalization" | "patch"
  >("missing");
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const [patchApplied, setPatchApplied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const handleApplyPatch = () => {
    if (report?.sqlPatchScript) {
      onApplySqlPatch(report.sqlPatchScript);
      setPatchApplied(true);
      setTimeout(() => setPatchApplied(false), 3000);
    }
  };

  return (
    <div
      id="optimizer-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100">
                  AI Performance & Index Optimization Studio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated index coverage, composite multi-column strategy, and schema health audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunAudit}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Analyzing Schema..." : "Re-Analyze Schema"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px] animate-spin">
                <div className="w-full h-full bg-slate-900 rounded-[14px]" />
              </div>
              <Sparkles className="w-8 h-8 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">
              Gemini is auditing your database schema...
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Evaluating foreign key scan bottlenecks, composite index candidate paths, 1NF-3NF normalization constraints, and generating execution patches.
            </p>
          </div>
        )}

        {/* Empty State before first run */}
        {!isLoading && !report && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">
              Ready to Optimize {schema.tables.length} Tables
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Let Google AI Studio audit your SQL schema for unindexed foreign keys, slow join paths, missing composite indexes, and schema anti-patterns.
            </p>
            <button
              id="btn-trigger-ai-audit"
              onClick={onRunAudit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-sm font-bold shadow-xl shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Run AI Performance & Index Audit</span>
            </button>
          </div>
        )}

        {/* Report Content */}
        {!isLoading && report && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Score Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-6 pb-4 bg-slate-950/40 border-b border-slate-800">
              {/* Health Score */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Health Score</span>
                  <div className="text-2xl font-extrabold text-slate-100">
                    {report.healthScore}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    report.healthScore >= 80
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : report.healthScore >= 60
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Normalization Score */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Normalization</span>
                  <div className="text-2xl font-extrabold text-cyan-400">
                    {report.normalizationScore || report.normalizationAnalysis?.score || 85}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              {/* Estimated Speedup */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Query Speedup</span>
                  <div className="text-lg font-bold text-amber-300 truncate">
                    {report.estimatedQuerySpeedup || "3x - 25x"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Recommendations Total */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Patches Ready</span>
                  <div className="text-2xl font-extrabold text-purple-400">
                    {(report.missingIndexes?.length || 0) + (report.compositeIndexes?.length || 0)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 flex items-start gap-2">
              <span className="font-semibold text-amber-400 shrink-0">Summary:</span>
              <span className="text-slate-300 leading-relaxed">{report.summary}</span>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-slate-800 flex items-center gap-1 bg-slate-950/20">
              <button
                onClick={() => setActiveTab("missing")}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "missing"
                    ? "border-amber-400 text-amber-300 bg-amber-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Missing Indexes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                  {report.missingIndexes?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("composite")}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "composite"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Composite Indexes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300">
                  {report.compositeIndexes?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("antipatterns")}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "antipatterns"
                    ? "border-rose-400 text-rose-300 bg-rose-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Anti-Patterns & Risks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
                  {report.antiPatterns?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("normalization")}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "normalization"
                    ? "border-indigo-400 text-indigo-300 bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Normalization (1NF-3NF)</span>
              </button>

              <button
                onClick={() => setActiveTab("patch")}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "patch"
                    ? "border-emerald-400 text-emerald-300 bg-emerald-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>One-Click SQL Patch</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* 1. Missing Indexes Tab */}
              {activeTab === "missing" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 mb-2">
                    Foreign keys and high-cardinality candidate columns without covering indexes. Unindexed foreign keys trigger full table scans on JOIN queries and CASCADE operations.
                  </div>

                  {report.missingIndexes?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.severity === "HIGH"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="font-bold text-sm text-slate-100 font-mono">
                            {item.table} ({item.columns.join(", ")})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.type || "B-Tree Index"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-amber-300">Impact:</strong> {item.impact}
                      </p>

                      <div className="relative rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs text-cyan-300 flex items-center justify-between">
                        <code>{item.sql}</code>
                        <button
                          onClick={() => handleCopy(item.sql, `missing-${idx}`)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy SQL"
                        >
                          {copiedSql === `missing-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Composite Indexes Tab */}
              {activeTab === "composite" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 mb-2">
                    Multi-column composite indexes ordered according to the <em>Equality-First, Range-Second</em> indexing principle to cover multi-predicate WHERE and ORDER BY clauses.
                  </div>

                  {report.compositeIndexes?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            COMPOSITE
                          </span>
                          <span className="font-bold text-sm text-slate-100 font-mono">
                            {item.table} ({item.columns.join(", ")})
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <p>
                          <strong className="text-cyan-300">Ordering Strategy:</strong>{" "}
                          {item.reason}
                        </p>
                        {item.targetQueryPattern && (
                          <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/80 font-mono">
                            <span className="text-slate-500">Pattern: </span>
                            {item.targetQueryPattern}
                          </div>
                        )}
                      </div>

                      <div className="relative rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs text-cyan-300 flex items-center justify-between">
                        <code>{item.sql}</code>
                        <button
                          onClick={() => handleCopy(item.sql, `comp-${idx}`)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy SQL"
                        >
                          {copiedSql === `comp-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Anti-Patterns & Health Tab */}
              {activeTab === "antipatterns" && (
                <div className="space-y-4">
                  {/* Orphan Tables Alert */}
                  {report.orphanTables && report.orphanTables.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Orphan Tables Detected ({report.orphanTables.length})</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        These tables have no incoming or outgoing foreign key linkages:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {report.orphanTables.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-slate-900 text-amber-200 border border-amber-500/40 text-xs font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anti-Pattern List */}
                  <div className="space-y-3">
                    {report.antiPatterns?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.severity === "HIGH"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {item.severity} RISK
                            </span>
                            <span className="font-bold text-sm text-slate-200 font-mono">
                              {item.table}: {item.issue}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          <strong className="text-emerald-300">Remediation:</strong>{" "}
                          {item.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Normalization Analysis Tab */}
              {activeTab === "normalization" && report.normalizationAnalysis && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">
                          Relational Normalization Grade
                        </h4>
                        <p className="text-xs text-slate-400">
                          Evaluation against Boyce-Codd (BCNF) and Third Normal Form (3NF)
                        </p>
                      </div>
                      <div className="text-2xl font-black text-indigo-400">
                        {report.normalizationAnalysis.score}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          1NF (First Normal Form)
                        </span>
                        <p className="text-xs text-slate-200">
                          {report.normalizationAnalysis.firstNormalForm}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          2NF (Second Normal Form)
                        </span>
                        <p className="text-xs text-slate-200">
                          {report.normalizationAnalysis.secondNormalForm}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          3NF (Third Normal Form)
                        </span>
                        <p className="text-xs text-slate-200">
                          {report.normalizationAnalysis.thirdNormalForm}
                        </p>
                      </div>
                    </div>

                    {report.normalizationAnalysis.recommendations && (
                      <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200">
                        <strong>Architecture Advice: </strong>
                        {report.normalizationAnalysis.recommendations}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. One-Click Patch Tab */}
              {activeTab === "patch" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        Complete SQL Migration Patch
                      </h4>
                      <p className="text-xs text-slate-400">
                        Includes all CREATE INDEX and ALTER TABLE constraint statements generated by Gemini.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(report.sqlPatchScript, "patch-all")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        {copiedSql === "patch-all" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy SQL</span>
                          </>
                        )}
                      </button>

                      <button
                        id="btn-apply-patch-to-schema"
                        onClick={handleApplyPatch}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {patchApplied ? "Patch Applied to Canvas!" : "Apply Patch to Schema"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 max-h-[350px] overflow-y-auto leading-relaxed">
                    <pre>{report.sqlPatchScript || "-- No patches needed. Schema is optimized."}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-400">
          <span>RelateX Performance Engine • Dialect: {schema.dialect}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
