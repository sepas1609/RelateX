import React, { useState } from "react";
import {
  Activity,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  X,
  Play,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Layers,
  Database,
  Search,
  Code2,
  FileCode,
} from "lucide-react";
import { DatabaseSchema, QueryExplanationResult, QueryPlanNode } from "../types";

interface QueryExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  onExplainQuery: (query: string) => Promise<QueryExplanationResult>;
}

const SAMPLE_QUERIES = [
  {
    name: "Customer High-Value Orders Join",
    query: `SELECT 
  c.name AS customer_name,
  c.email,
  o.id AS order_id,
  o.total_amount,
  o.status,
  o.created_at
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'COMPLETED'
  AND o.total_amount > 250.00
ORDER BY o.created_at DESC
LIMIT 50;`,
  },
  {
    name: "Product Sales & Category Aggregation",
    query: `SELECT 
  p.name AS product_name,
  p.sku,
  SUM(oi.quantity) AS total_units_sold,
  SUM(oi.price * oi.quantity) AS total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= '2026-01-01'
GROUP BY p.id, p.name, p.sku
HAVING SUM(oi.quantity) > 10
ORDER BY total_revenue DESC;`,
  },
  {
    name: "Unindexed Status & Filter Bottleneck",
    query: `SELECT *
FROM orders
WHERE status = 'PROCESSING'
  AND created_at < NOW() - INTERVAL '2 days'
ORDER BY updated_at DESC;`,
  },
];

export const QueryExplainerModal: React.FC<QueryExplainerModalProps> = ({
  isOpen,
  onClose,
  schema,
  onExplainQuery,
}) => {
  const [queryText, setQueryText] = useState<string>(SAMPLE_QUERIES[0].query);
  const [result, setResult] = useState<QueryExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedOptimized, setCopiedOptimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"plan" | "steps" | "indexes" | "optimized">("plan");

  if (!isOpen) return null;

  const handleRunExplain = async () => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    try {
      const data = await onExplainQuery(queryText);
      setResult(data);
    } catch (err) {
      console.error("Query explainer error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOptimized = () => {
    if (result?.optimizedSql) {
      navigator.clipboard.writeText(result.optimizedSql);
      setCopiedOptimized(true);
      setTimeout(() => setCopiedOptimized(false), 2000);
    }
  };

  // Recursive visual tree renderer for query plan
  const renderPlanNode = (node: QueryPlanNode, depth: number = 0) => {
    const isScan = node.nodeType.includes("Scan");
    const isJoin = node.nodeType.includes("Join");
    const isAgg = node.nodeType.includes("Aggregate");
    const isSort = node.nodeType.includes("Sort");

    return (
      <div key={node.id || Math.random()} className="space-y-2">
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            node.isBottleneck
              ? "bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/40"
              : isJoin
              ? "bg-indigo-950/20 border-indigo-500/40"
              : isScan
              ? node.nodeType.includes("Index")
                ? "bg-emerald-950/20 border-emerald-500/40"
                : "bg-amber-950/20 border-amber-500/40"
              : "bg-slate-900 border-slate-800"
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  node.nodeType.includes("Index")
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : node.nodeType.includes("Seq")
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : node.nodeType.includes("Join")
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {node.nodeType}
              </span>

              {node.relationName && (
                <span className="text-xs font-bold text-slate-100 font-mono">
                  on {node.relationName}
                </span>
              )}

              {node.indexName && (
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  using {node.indexName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>Cost: <strong className="text-slate-200">{node.cost}</strong></span>
              <span>Rows: <strong className="text-slate-200">{node.rows?.toLocaleString?.() || node.rows}</strong></span>
            </div>
          </div>

          {node.filterCondition && (
            <div className="text-[11px] text-slate-400 font-mono mt-1.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">Condition: </span>
              {node.filterCondition}
            </div>
          )}

          {node.isBottleneck && node.bottleneckReason && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
              <span>
                <strong>Bottleneck:</strong> {node.bottleneckReason}
              </span>
            </div>
          )}
        </div>

        {node.children && node.children.length > 0 && (
          <div className="border-l-2 border-slate-800 ml-4 pl-2 space-y-2">
            {node.children.map((child) => renderPlanNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="query-explainer-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100">
                  AI Query Explainer & Execution Visualizer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {schema.dialect}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualize database query execution trees, uncover table scan bottlenecks, and get optimized rewrites
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input Section */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target SQL Query:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Quick Samples:</span>
              {SAMPLE_QUERIES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setQueryText(sample.query)}
                  className="px-2 py-1 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {sample.name.split(" ")[0]} Join
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="query-explainer-textarea"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={4}
              placeholder="Paste your SQL query here (SELECT ... FROM ... WHERE ...)"
              className="w-full bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none leading-relaxed"
            />

            <button
              id="btn-run-query-explain"
              onClick={handleRunExplain}
              disabled={isLoading || !queryText.trim()}
              className="absolute right-3 bottom-3 flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              )}
              <span>{isLoading ? "Analyzing..." : "Explain & Optimize"}</span>
            </button>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Activity className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                Deconstructing query execution plan...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Parsing table scans, join orders, predicate evaluation, and missing covering index paths.
              </p>
            </div>
          ) : !result ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Activity className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                Ready to Analyze Query Performance
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Click "Explain & Optimize" to inspect the visual operator tree, estimated cost bottlenecks, and generate optimized SQL rewrites.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Estimated Speedup</span>
                    <div className="text-lg font-bold text-amber-300">
                      {result.estimatedSpeedup || "10x - 30x"}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Plan Cost Metric</span>
                    <div className="text-lg font-bold text-cyan-300">
                      {result.estimatedCost || 850.0}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Bottlenecks Flagged</span>
                    <div className="text-lg font-bold text-rose-400">
                      {result.bottlenecks?.length || 0} issues
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
                <button
                  onClick={() => setActiveTab("plan")}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "plan"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Visual Plan Tree
                </button>
                <button
                  onClick={() => setActiveTab("steps")}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "steps"
                      ? "border-indigo-400 text-indigo-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Step-by-Step Execution
                </button>
                <button
                  onClick={() => setActiveTab("indexes")}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "indexes"
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Index Coverage ({result.indexImpact?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("optimized")}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === "optimized"
                      ? "border-emerald-400 text-emerald-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Optimized SQL Rewrite</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {/* 1. Visual Plan Tree */}
                {activeTab === "plan" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {result.summary}
                    </p>

                    {result.visualPlan && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Planner Operator Tree (Top-Down Execution)
                        </div>
                        {renderPlanNode(result.visualPlan)}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Step-by-Step Execution */}
                {activeTab === "steps" && (
                  <div className="space-y-3">
                    {result.stepByStepExecution?.map((step) => (
                      <div
                        key={step.step}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {step.step}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-100">
                              {step.title}
                            </h4>
                            {step.involvedTables?.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-[10px] font-mono"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Index Impact */}
                {activeTab === "indexes" && (
                  <div className="space-y-3">
                    {result.indexImpact?.map((idxItem, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                idxItem.status === "USED"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {idxItem.status}
                            </span>
                            <span className="font-bold text-xs text-slate-200 font-mono">
                              {idxItem.table} ({idxItem.columns.join(", ")})
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {idxItem.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Optimized SQL Rewrite */}
                {activeTab === "optimized" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">
                          AI Query Rewrite & Hints
                        </h4>
                        <p className="text-xs text-slate-400">
                          Optimized for covering index scans, predicate pushdown, and minimal disk sorting.
                        </p>
                      </div>

                      <button
                        onClick={handleCopyOptimized}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                      >
                        {copiedOptimized ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Optimized SQL</span>
                          </>
                        )}
                      </button>
                    </div>

                    {result.optimizationTechniques && result.optimizationTechniques.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-400 block">
                          Applied Optimization Techniques:
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                          {result.optimizationTechniques.map((tech, i) => (
                            <li key={i}>{tech}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 max-h-[300px] overflow-y-auto leading-relaxed">
                      <pre>{result.optimizedSql}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-400">
          <span>RelateX Query Optimizer • Dialect: {schema.dialect}</span>
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
