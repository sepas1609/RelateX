import React, { useState } from "react";
import {
  Table as TableIcon,
  Key,
  Link,
  Shield,
  Layers,
  Copy,
  Check,
  X,
  FileCode,
  ArrowRight,
  Database,
} from "lucide-react";
import { DatabaseSchema, TableNodeData } from "../types";

interface TableInspectorModalProps {
  table: TableNodeData | null;
  schema: DatabaseSchema;
  onClose: () => void;
}

export const TableInspectorModal: React.FC<TableInspectorModalProps> = ({
  table,
  schema,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!table) return null;

  // Incoming relations: tables pointing to this table
  const incomingRelations = schema.relations.filter(
    (r) => r.targetTable === table.name
  );

  // Outgoing relations: this table pointing to others
  const outgoingRelations = schema.relations.filter(
    (r) => r.sourceTable === table.name
  );

  // Generate table SQL DDL
  const generateTableSql = () => {
    let sql = `CREATE TABLE ${table.name} (\n`;
    const colLines = table.columns.map((c) => {
      let line = `    ${c.name} ${c.type}`;
      if (c.isPrimaryKey) line += " PRIMARY KEY";
      if (!c.isNullable && !c.isPrimaryKey) line += " NOT NULL";
      if (c.isUnique && !c.isPrimaryKey) line += " UNIQUE";
      if (c.defaultValue) line += ` DEFAULT ${c.defaultValue}`;
      if (c.foreignKeyRef) {
        line += ` REFERENCES ${c.foreignKeyRef.table}(${c.foreignKeyRef.column})`;
      }
      return line;
    });

    sql += colLines.join(",\n");
    sql += "\n);";

    if (table.indexes.length > 0) {
      sql += "\n\n-- Indexes\n";
      for (const idx of table.indexes) {
        sql += `CREATE ${idx.isUnique ? "UNIQUE " : ""}INDEX ${idx.name} ON ${table.name}(${idx.columns.join(", ")});\n`;
      }
    }

    return sql;
  };

  const tableSql = generateTableSql();

  const handleCopy = () => {
    navigator.clipboard.writeText(tableSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="table-inspector-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100 font-mono">
                  {table.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {table.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {table.columns.length} columns • {table.indexes.length} indexes • ~{table.estimatedRowSize || 0} bytes / row
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Columns Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Column Definitions
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="p-3">Column</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Attributes</th>
                    <th className="p-3">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {table.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 flex items-center gap-2 font-mono font-medium text-slate-200">
                        {col.isPrimaryKey ? (
                          <span title="Primary Key" className="text-amber-400">
                            <Key className="w-3.5 h-3.5" />
                          </span>
                        ) : col.isForeignKey ? (
                          <span title="Foreign Key" className="text-cyan-400">
                            <Link className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5" />
                        )}
                        <span>{col.name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {col.type}
                      </td>
                      <td className="p-3 space-x-1">
                        {col.isPrimaryKey && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            PK
                          </span>
                        )}
                        {col.isForeignKey && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            FK
                          </span>
                        )}
                        {col.isUnique && !col.isPrimaryKey && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            UNIQUE
                          </span>
                        )}
                        {!col.isNullable && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            NOT NULL
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {col.defaultValue || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relations Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outgoing References */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-cyan-400" />
                <span>Outgoing References ({outgoingRelations.length})</span>
              </span>
              {outgoingRelations.length === 0 ? (
                <p className="text-xs text-slate-500">No outgoing foreign keys</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {outgoingRelations.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span className="font-mono text-cyan-300">{rel.sourceColumn}</span>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        → {rel.targetTable}.{rel.targetColumn}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming References */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Incoming References ({incomingRelations.length})</span>
              </span>
              {incomingRelations.length === 0 ? (
                <p className="text-xs text-slate-500">No tables reference this table</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {incomingRelations.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span className="font-mono text-indigo-300">
                        {rel.sourceTable}.{rel.sourceColumn}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        → {rel.targetColumn}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DDL Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                SQL Definition
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                {copied ? (
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
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
              <pre>{tableSql}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-end bg-slate-950/60">
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
