import React, { useState } from "react";
import {
  Key,
  Link as LinkIcon,
  Maximize2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Eye,
  EyeOff,
} from "lucide-react";
import { TableNodeData } from "../types";

interface ChenEntityNodeProps {
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

export const ChenEntityNode: React.FC<ChenEntityNodeProps> = ({
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
  const [showAllAttributes, setShowAllAttributes] = useState(false);

  // Weak entity identification heuristic: contains compound FKs or > 2 FKs or table is an associative link
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;
  const isWeakEntity = fkCount >= 2 || table.name.includes("_") || table.name.endsWith("items") || table.name.endsWith("tags");

  const pkColumns = table.columns.filter((c) => c.isPrimaryKey);
  const fkColumns = table.columns.filter((c) => c.isForeignKey && !c.isPrimaryKey);
  const regularColumns = table.columns.filter((c) => !c.isPrimaryKey && !c.isForeignKey);

  // Display columns based on toggle
  const visibleColumns = showAllAttributes
    ? table.columns
    : [...pkColumns, ...fkColumns, ...regularColumns.slice(0, 3)];

  return (
    <div
      id={`chen-node-${table.name}`}
      style={{
        transform: `translate(${table.position.x}px, ${table.position.y}px)`,
        width: "300px",
      }}
      onMouseDown={(e) => onMouseDownNode(e, table.name)}
      onMouseEnter={() => onHoverTable(table.name)}
      onMouseLeave={() => onHoverTable(null)}
      onClick={() => onSelectTable(table.name)}
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-all duration-150 ${
        isSelected ? "z-20 scale-[1.02]" : isRelated || isHovered ? "z-10" : "z-0"
      }`}
    >
      {/* Chen Entity Main Box (Strong = Single border, Weak = Double border) */}
      <div
        className={`relative rounded-xl backdrop-blur-md transition-all p-3 shadow-xl ${
          isWeakEntity
            ? "border-[3px] border-double border-indigo-400/90 bg-indigo-950/40"
            : "border-2 border-cyan-500/80 bg-slate-900/95"
        } ${
          isSelected
            ? "ring-4 ring-cyan-500/30 shadow-2xl shadow-cyan-500/30 border-cyan-300"
            : isSearchMatch
            ? "ring-4 ring-amber-500/40 border-amber-400"
            : isHovered
            ? "border-cyan-400 shadow-cyan-500/10"
            : ""
        }`}
      >
        {/* Inner Weak Entity Frame Accent */}
        {isWeakEntity && (
          <div className="absolute inset-1 rounded-lg border border-dashed border-indigo-400/30 pointer-events-none" />
        )}

        {/* Entity Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-3 h-3 rounded-sm rotate-45 shrink-0 ${
                isWeakEntity ? "bg-indigo-400" : "bg-cyan-400"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-100 tracking-wider uppercase font-mono truncate">
                  {table.name}
                </h3>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                    isWeakEntity
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  }`}
                >
                  {isWeakEntity ? "WEAK ENTITY" : "STRONG ENTITY"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {table.category || "Entity Table"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectTable(table);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Inspect Entity Details"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAllAttributes(!showAllAttributes);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={showAllAttributes ? "Show fewer attributes" : "Show all attributes"}
            >
              {showAllAttributes ? (
                <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Chen Attributes (Ellipses / Ovals Cloud) */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center justify-between">
            <span>Chen Attributes ({table.columns.length})</span>
            <span className="text-[9px] text-slate-400 font-sans">
              Underlined = PK • Dashed = FK
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {visibleColumns.map((col) => {
              if (col.isPrimaryKey) {
                return (
                  <div
                    key={col.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/80 text-amber-200 text-[11px] shadow-sm shadow-amber-500/10"
                    title={`Primary Key: ${col.name} (${col.type})`}
                  >
                    <Key className="w-2.5 h-2.5 text-amber-400" />
                    <span className="underline decoration-amber-400 decoration-1 font-semibold font-mono">
                      {col.name}
                    </span>
                    <span className="text-[9px] text-amber-400/70 font-mono">
                      :{col.type.toLowerCase()}
                    </span>
                  </div>
                );
              }

              if (col.isForeignKey) {
                return (
                  <div
                    key={col.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-dashed border-cyan-400/80 text-cyan-200 text-[11px]"
                    title={`Foreign Key: ${col.name} -> ${col.foreignKeyRef?.table}.${col.foreignKeyRef?.column}`}
                  >
                    <LinkIcon className="w-2.5 h-2.5 text-cyan-400" />
                    <span className="font-mono text-cyan-300">{col.name}</span>
                    <span className="text-[9px] text-cyan-400/70 font-mono">
                      :{col.type.toLowerCase()}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={col.name}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[10.5px]"
                  title={`Attribute: ${col.name} (${col.type})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="font-mono">{col.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    :{col.type.toLowerCase()}
                  </span>
                </div>
              );
            })}

            {!showAllAttributes && table.columns.length > visibleColumns.length && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllAttributes(true);
                }}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/60"
              >
                +{table.columns.length - visibleColumns.length} more...
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
          <span>{pkColumns.length} PK • {fkColumns.length} FK</span>
          <span>{table.indexes.length} Indexes</span>
        </div>
      </div>
    </div>
  );
};
