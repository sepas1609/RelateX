import React from "react";
import {
  Key,
  Link as LinkIcon,
  Shield,
  Hash,
  Maximize2,
  ListFilter,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ColumnDefinition, TableNodeData } from "../types";

interface TableNodeProps {
  table: TableNodeData;
  isSelected: boolean;
  isHovered: boolean;
  isRelated: boolean;
  isSearchMatch: boolean;
  activeColumnHighlight: string | null;
  onSelectTable: (tableName: string) => void;
  onHoverTable: (tableName: string | null) => void;
  onHoverColumn: (tableName: string, columnName: string | null) => void;
  onInspectTable: (table: TableNodeData) => void;
  onMouseDownNode: (e: React.MouseEvent, tableName: string) => void;
}

export const TableNode: React.FC<TableNodeProps> = ({
  table,
  isSelected,
  isHovered,
  isRelated,
  isSearchMatch,
  activeColumnHighlight,
  onSelectTable,
  onHoverTable,
  onHoverColumn,
  onInspectTable,
  onMouseDownNode,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Check if any column is an unindexed FK (potential table scan bottleneck)
  const unindexedFks = table.columns.filter(
    (c) =>
      c.isForeignKey &&
      !table.indexes.some((idx) => idx.columns.includes(c.name))
  );

  return (
    <div
      id={`table-node-${table.name}`}
      style={{
        transform: `translate(${table.position.x}px, ${table.position.y}px)`,
        width: "290px",
      }}
      onMouseDown={(e) => onMouseDownNode(e, table.name)}
      onMouseEnter={() => onHoverTable(table.name)}
      onMouseLeave={() => onHoverTable(null)}
      onClick={() => onSelectTable(table.name)}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl bg-slate-900/95 backdrop-blur-md transition-shadow duration-150 border-2 ${
        isSelected
          ? "border-cyan-400 ring-4 ring-cyan-500/20 shadow-2xl shadow-cyan-500/20 z-20"
          : isRelated
          ? "border-indigo-400 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10 z-10"
          : isSearchMatch
          ? "border-amber-400 ring-4 ring-amber-500/30 shadow-xl shadow-amber-500/20 z-10"
          : isHovered
          ? "border-slate-500 shadow-xl z-10"
          : "border-slate-800/90 shadow-lg hover:border-slate-700"
      }`}
    >
      {/* Table Header */}
      <div
        className={`px-3.5 py-2.5 rounded-t-[10px] flex items-center justify-between border-b border-slate-800/90 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              table.category === "Identity & Auth"
                ? "bg-sky-400 shadow-sky-500/50 shadow-sm"
                : table.category === "Billing & Commerce"
                ? "bg-emerald-400 shadow-emerald-500/50 shadow-sm"
                : table.category === "Catalog & Assets"
                ? "bg-purple-400 shadow-purple-500/50 shadow-sm"
                : table.category === "Clinical & Care"
                ? "bg-rose-400 shadow-rose-500/50 shadow-sm"
                : table.category === "Telemetry & Audit"
                ? "bg-amber-400 shadow-amber-500/50 shadow-sm"
                : "bg-cyan-400 shadow-cyan-500/50 shadow-sm"
            }`}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-100 truncate tracking-tight">
              {table.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {table.category || "Core Table"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unindexedFks.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-help"
              title={`${unindexedFks.length} unindexed Foreign Key column(s) - High scan risk`}
            >
              !FK
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspectTable(table);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Inspect Table Schema & Indexes"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Columns List */}
      {!isCollapsed && (
        <div className="divide-y divide-slate-800/50 text-xs">
          {table.columns.map((col) => {
            const isColHighlighted =
              activeColumnHighlight === `${table.name}.${col.name}` ||
              (col.foreignKeyRef &&
                activeColumnHighlight ===
                  `${col.foreignKeyRef.table}.${col.foreignKeyRef.column}`);

            return (
              <div
                key={col.name}
                id={`col-${table.name}-${col.name}`}
                onMouseEnter={() => onHoverColumn(table.name, col.name)}
                onMouseLeave={() => onHoverColumn(table.name, null)}
                className={`px-3 py-1.5 flex items-center justify-between transition-colors ${
                  isColHighlighted
                    ? "bg-cyan-500/15 text-cyan-200 font-semibold"
                    : "hover:bg-slate-800/60 text-slate-300"
                }`}
              >
                {/* Left: Key Badges & Name */}
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {col.isPrimaryKey ? (
                    <span
                      title="Primary Key"
                      className="text-amber-400 p-0.5 rounded bg-amber-400/10"
                    >
                      <Key className="w-3 h-3" />
                    </span>
                  ) : col.isForeignKey ? (
                    <span
                      title={`Foreign Key -> ${col.foreignKeyRef?.table}.${col.foreignKeyRef?.column}`}
                      className="text-cyan-400 p-0.5 rounded bg-cyan-400/10"
                    >
                      <LinkIcon className="w-3 h-3" />
                    </span>
                  ) : col.isUnique ? (
                    <span
                      title="Unique Constraint"
                      className="text-purple-400 p-0.5 rounded bg-purple-400/10"
                    >
                      <Shield className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-3 h-3 text-slate-600 flex items-center justify-center text-[10px]">
                      •
                    </span>
                  )}

                  <span
                    className={`truncate text-xs ${
                      col.isPrimaryKey
                        ? "font-semibold text-amber-200"
                        : col.isForeignKey
                        ? "font-medium text-cyan-200"
                        : "text-slate-200"
                    }`}
                  >
                    {col.name}
                  </span>
                </div>

                {/* Right: Datatype & Nullability */}
                <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                  <span className="font-mono text-slate-400 text-[10.5px]">
                    {col.type.toLowerCase()}
                  </span>
                  {!col.isNullable && !col.isPrimaryKey && (
                    <span
                      className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono"
                      title="Not Null"
                    >
                      NN
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="px-3 py-1.5 rounded-b-[10px] border-t border-slate-800/70 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>{table.columns.length} cols</span>
          <span>•</span>
          <span>{table.indexes.length} idx</span>
        </div>
        {table.estimatedRowSize && (
          <span className="font-mono text-slate-500">
            ~{table.estimatedRowSize}B / row
          </span>
        )}
      </div>
    </div>
  );
};
