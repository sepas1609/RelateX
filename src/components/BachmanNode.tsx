import React from "react";
import {
  Key,
  Link as LinkIcon,
  Maximize2,
  Share2,
  FolderGit2,
  ArrowRightCircle,
} from "lucide-react";
import { TableNodeData } from "../types";

interface BachmanNodeProps {
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

export const BachmanNode: React.FC<BachmanNodeProps> = ({
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
  const pkColumns = table.columns.filter((c) => c.isPrimaryKey);
  const fkColumns = table.columns.filter((c) => c.isForeignKey);
  const dataColumns = table.columns.filter((c) => !c.isPrimaryKey && !c.isForeignKey);

  return (
    <div
      id={`bachman-node-${table.name}`}
      style={{
        transform: `translate(${table.position.x}px, ${table.position.y}px)`,
        width: "300px",
      }}
      onMouseDown={(e) => onMouseDownNode(e, table.name)}
      onMouseEnter={() => onHoverTable(table.name)}
      onMouseLeave={() => onHoverTable(null)}
      onClick={() => onSelectTable(table.name)}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-2xl bg-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-150 border-2 ${
        isSelected
          ? "border-teal-400 ring-4 ring-teal-500/30 shadow-teal-500/20 z-20"
          : isRelated
          ? "border-indigo-400 ring-2 ring-indigo-500/20 z-10"
          : isSearchMatch
          ? "border-amber-400 ring-4 ring-amber-500/30 z-10"
          : isHovered
          ? "border-slate-500 z-10"
          : "border-slate-700 hover:border-slate-600"
      }`}
    >
      {/* Bachman Record Type Banner */}
      <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-teal-950/90 px-3.5 py-2.5 rounded-t-[14px] border-b border-teal-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/60 flex items-center justify-center text-teal-300 font-bold text-xs font-mono">
            R
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-teal-400 font-mono font-semibold block">
              RECORD TYPE
            </span>
            <h3 className="font-bold text-sm text-slate-100 font-mono truncate">
              {table.name.toUpperCase()}
            </h3>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspectTable(table);
          }}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-teal-300 transition-colors"
          title="Inspect Record Structure"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigational Pointer Sets Bar */}
      <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[10px] text-teal-300/80 font-mono">
        <span>Owner/Member Sets:</span>
        <span className="bg-teal-950/80 px-1.5 py-0.2 rounded border border-teal-800/60 text-teal-300">
          {fkColumns.length > 0 ? `Member of ${fkColumns.length} Set(s)` : "Owner / Root Record"}
        </span>
      </div>

      {/* Fields List */}
      <div className="p-2.5 space-y-2 text-xs">
        {/* Keys */}
        {pkColumns.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-amber-400 font-semibold mb-1 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              <span>CALC / Primary Key Fields</span>
            </div>
            <div className="space-y-1">
              {pkColumns.map((col) => (
                <div
                  key={col.name}
                  className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-200 font-mono text-[11px]"
                >
                  <span className="font-semibold">{col.name}</span>
                  <span className="text-[10px] text-amber-400/80">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Set Link Pointers */}
        {fkColumns.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-teal-400 font-semibold mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-teal-400" />
              <span>Navigational Set Pointers</span>
            </div>
            <div className="space-y-1">
              {fkColumns.map((col) => (
                <div
                  key={col.name}
                  className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-teal-200 font-mono text-[11px]"
                >
                  <span className="font-medium truncate">{col.name}</span>
                  <span className="text-[9.5px] text-teal-400/90 truncate">
                    &rarr; {col.foreignKeyRef?.table}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Items */}
        {dataColumns.length > 0 && (
          <div>
            <div className="text-[9.5px] uppercase font-mono text-slate-400 font-semibold mb-1">
              Data Items ({dataColumns.length})
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-1">
              {dataColumns.map((col) => (
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
        <span>Bachman DSD Model</span>
        <span>{table.columns.length} Fields</span>
      </div>
    </div>
  );
};
