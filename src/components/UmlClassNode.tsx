import React, { useState } from "react";
import {
  Key,
  Link as LinkIcon,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Layers,
  Code2,
} from "lucide-react";
import { ColumnDefinition, TableNodeData } from "../types";

interface UmlClassNodeProps {
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

export const UmlClassNode: React.FC<UmlClassNodeProps> = ({
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
  const [showMethods, setShowMethods] = useState(false);

  const pkColumns = table.columns.filter((c) => c.isPrimaryKey);
  const fkColumns = table.columns.filter((c) => c.isForeignKey && !c.isPrimaryKey);
  const otherColumns = table.columns.filter((c) => !c.isPrimaryKey && !c.isForeignKey);

  return (
    <div
      id={`uml-node-${table.name}`}
      style={{
        transform: `translate(${table.position.x}px, ${table.position.y}px)`,
        width: "305px",
      }}
      onMouseDown={(e) => onMouseDownNode(e, table.name)}
      onMouseEnter={() => onHoverTable(table.name)}
      onMouseLeave={() => onHoverTable(null)}
      onClick={() => onSelectTable(table.name)}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-lg bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-150 font-mono text-xs border-2 ${
        isSelected
          ? "border-sky-400 ring-4 ring-sky-500/30 shadow-sky-500/20 z-20"
          : isRelated
          ? "border-indigo-400 ring-2 ring-indigo-500/20 shadow-indigo-500/10 z-10"
          : isSearchMatch
          ? "border-amber-400 ring-4 ring-amber-500/30 z-10"
          : isHovered
          ? "border-slate-500 z-10"
          : "border-slate-700 hover:border-slate-600"
      }`}
    >
      {/* UML Class Header Compartment */}
      <div className="bg-slate-950/80 px-3 py-2 text-center border-b-2 border-slate-700/80 rounded-t-[6px]">
        <div className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold">
          &laquo;entity&raquo;
        </div>
        <div className="font-bold text-sm text-slate-100 tracking-tight flex items-center justify-center gap-1.5 mt-0.5">
          <span>{table.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspectTable(table);
            }}
            className="p-0.5 text-slate-400 hover:text-sky-300"
            title="Inspect UML Class Definition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
        <div className="text-[9.5px] text-slate-400">
          {`{schema: public, category: "${table.category || "General"}"}`}
        </div>
      </div>

      {/* Compartment 1: Primary Keys */}
      {pkColumns.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-slate-800 bg-amber-500/5 text-[11px] divide-y divide-amber-500/10">
          <div className="text-[9px] uppercase tracking-wider text-amber-400/80 font-sans font-semibold mb-0.5">
            // Primary Identifiers
          </div>
          {pkColumns.map((col) => (
            <div key={col.name} className="py-0.5 flex items-center justify-between text-amber-200">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-amber-400 font-bold">+</span>
                <span className="font-semibold truncate">{col.name}</span>
              </div>
              <span className="text-[10px] text-amber-300/80 shrink-0 font-normal">
                : {col.type.toLowerCase()} &#123;PK&#125;
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Compartment 2: Foreign Keys */}
      {fkColumns.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-slate-800 bg-sky-500/5 text-[11px] divide-y divide-sky-500/10">
          <div className="text-[9px] uppercase tracking-wider text-sky-400/80 font-sans font-semibold mb-0.5">
            // Relational Foreign Keys
          </div>
          {fkColumns.map((col) => (
            <div key={col.name} className="py-0.5 flex items-center justify-between text-sky-200">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sky-400 font-bold">#</span>
                <span className="font-medium truncate">{col.name}</span>
              </div>
              <span className="text-[10px] text-sky-300/80 shrink-0 font-normal">
                : {col.type.toLowerCase()} &#123;FK&#125;
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Compartment 3: Non-Key Attributes */}
      <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] divide-y divide-slate-800/60 max-h-[180px] overflow-y-auto">
        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-semibold mb-0.5">
          // Attributes
        </div>
        {otherColumns.map((col) => (
          <div key={col.name} className="py-0.5 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-emerald-400">+</span>
              <span className="truncate">{col.name}</span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">
              : {col.type.toLowerCase()}{col.isUnique ? " {UK}" : ""}{!col.isNullable ? " {NN}" : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Compartment 4: UML Operations & Index Constraints (Collapsible) */}
      <div className="px-2.5 py-1.5 bg-slate-950/60 rounded-b-[6px] text-[10px] text-slate-400">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMethods(!showMethods);
          }}
          className="w-full flex items-center justify-between hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-1">
            <Code2 className="w-3 h-3 text-purple-400" />
            <span>Operations & Indices ({table.indexes.length})</span>
          </div>
          {showMethods ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showMethods && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1 text-slate-300">
            <div className="text-purple-300">
              + countIndexes(): {table.indexes.length} registered
            </div>
            <div className="text-purple-300">
              + getRowSizeEst(): ~{table.estimatedRowSize || 128}B
            </div>
            {table.indexes.map((idx) => (
              <div key={idx.name} className="text-[9.5px] text-slate-400 pl-2">
                • {idx.name}({idx.columns.join(", ")}) {idx.isUnique ? "[UNIQUE]" : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
