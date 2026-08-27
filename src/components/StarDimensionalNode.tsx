import React from "react";
import {
  Key,
  Link as LinkIcon,
  Maximize2,
  Star,
  Snowflake,
  BarChart3,
  Hash,
  Layers,
} from "lucide-react";
import { TableNodeData } from "../types";

interface StarDimensionalNodeProps {
  table: TableNodeData;
  isSelected: boolean;
  isHovered: boolean;
  isRelated: boolean;
  isSearchMatch: boolean;
  onSelectTable: (tableName: string) => void;
  onHoverTable: (tableName: string | null) => void;
  onInspectTable: (table: TableNodeData) => void;
  onMouseDownNode: (e: React.MouseEvent, tableName: string) => void;
}

export const StarDimensionalNode: React.FC<StarDimensionalNodeProps> = ({
  table,
  isSelected,
  isHovered,
  isRelated,
  isSearchMatch,
  onSelectTable,
  onHoverTable,
  onInspectTable,
  onMouseDownNode,
}) => {
  // Dimensional Heuristics:
  // Fact tables usually have multiple FKs and metric/measure columns like amount, price, quantity, total, cost, score, duration
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;
  const hasMeasureKeywords = table.columns.some((c) => {
    const n = c.name.toLowerCase();
    return (
      n.includes("amount") ||
      n.includes("price") ||
      n.includes("quantity") ||
      n.includes("total") ||
      n.includes("cost") ||
      n.includes("tax") ||
      n.includes("score") ||
      n.includes("rate") ||
      n.includes("count")
    );
  });

  const isFactTable = fkCount >= 2 || (hasMeasureKeywords && fkCount >= 1) || table.name.startsWith("fact_");
  
  // Categorize columns
  const surrogateKeys = table.columns.filter((c) => c.isPrimaryKey);
  const dimensionFks = table.columns.filter((c) => c.isForeignKey && !c.isPrimaryKey);
  const measures = table.columns.filter((c) => {
    const isNum = c.type.toLowerCase().includes("int") || c.type.toLowerCase().includes("decimal") || c.type.toLowerCase().includes("float") || c.type.toLowerCase().includes("numeric");
    return !c.isPrimaryKey && !c.isForeignKey && isNum;
  });
  const descriptiveAttributes = table.columns.filter(
    (c) => !c.isPrimaryKey && !c.isForeignKey && !measures.includes(c)
  );

  return (
    <div
      id={`star-node-${table.name}`}
      style={{
        transform: `translate(${table.position.x}px, ${table.position.y}px)`,
        width: "310px",
      }}
      onMouseDown={(e) => onMouseDownNode(e, table.name)}
      onMouseEnter={() => onHoverTable(table.name)}
      onMouseLeave={() => onHoverTable(null)}
      onClick={() => onSelectTable(table.name)}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-2xl bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-150 border-2 ${
        isSelected
          ? isFactTable
            ? "border-amber-400 ring-4 ring-amber-500/30 shadow-amber-500/30 z-20"
            : "border-cyan-400 ring-4 ring-cyan-500/30 shadow-cyan-500/30 z-20"
          : isFactTable
          ? "border-amber-500/80 shadow-amber-500/10 hover:border-amber-400"
          : "border-sky-700/80 shadow-sky-500/10 hover:border-sky-500"
      }`}
    >
      {/* Header Banner */}
      <div
        className={`px-3.5 py-2.5 rounded-t-[14px] border-b flex items-center justify-between ${
          isFactTable
            ? "bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/40"
            : "bg-gradient-to-r from-cyan-950/90 via-slate-900 to-cyan-950/90 border-cyan-500/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isFactTable
                ? "bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-md shadow-amber-500/20"
                : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20"
            }`}
          >
            {isFactTable ? (
              <Star className="w-4 h-4 fill-amber-400 text-amber-300" />
            ) : (
              <Snowflake className="w-4 h-4 text-cyan-300" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                  isFactTable
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                }`}
              >
                {isFactTable ? "FACT HUB" : "DIMENSION"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {table.category || "Warehouse"}
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-100 font-mono truncate">
              {table.name}
            </h3>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspectTable(table);
          }}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Inspect Table Architecture"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grain / Role Description */}
      <div className="px-3 py-1 bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Grain: <strong className="text-slate-300 font-mono">1 row per {isFactTable ? "transaction / event" : "entity instance"}</strong></span>
      </div>

      {/* Column Compartments */}
      <div className="p-2.5 space-y-2 text-xs">
        {/* Keys */}
        {surrogateKeys.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-amber-400 font-semibold mb-1 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              <span>{isFactTable ? "Fact ID / Composite Key" : "Surrogate Key (SK)"}</span>
            </div>
            <div className="space-y-1">
              {surrogateKeys.map((col) => (
                <div
                  key={col.name}
                  className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-200 font-mono text-[11px]"
                >
                  <span className="font-bold">{col.name}</span>
                  <span className="text-[10px] text-amber-400/80">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dimension Foreign Keys (Conformed Dimensions) */}
        {dimensionFks.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-cyan-400 font-semibold mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-cyan-400" />
              <span>Dimension Foreign Keys (FK)</span>
            </div>
            <div className="space-y-1">
              {dimensionFks.map((col) => (
                <div
                  key={col.name}
                  className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-cyan-200 font-mono text-[11px]"
                >
                  <span className="truncate">{col.name}</span>
                  <span className="text-[10px] text-cyan-400/90 truncate">
                    &rarr; {col.foreignKeyRef?.table}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measures / Numeric Metrics (for Facts) */}
        {measures.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-emerald-400 font-semibold mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-emerald-400" />
              <span>&Sigma; Quantitative Measures ({measures.length})</span>
            </div>
            <div className="space-y-1">
              {measures.map((col) => (
                <div
                  key={col.name}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-200 font-mono text-[11px]"
                >
                  <span className="font-semibold">{col.name}</span>
                  <span className="text-[10px] text-emerald-400/80">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descriptive Dimension Attributes */}
        {descriptiveAttributes.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold mb-1">
              Descriptive Context & Hierarchies ({descriptiveAttributes.length})
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto pr-1">
              {descriptiveAttributes.map((col) => (
                <div
                  key={col.name}
                  className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300 font-mono text-[10px] truncate"
                  title={`${col.name} (${col.type})`}
                >
                  {col.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-950/60 rounded-b-[14px] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Kimball Dimensional Model</span>
        <span>{table.columns.length} columns</span>
      </div>
    </div>
  );
};
