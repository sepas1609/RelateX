import React, { useState } from "react";
import {
  Table,
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  Play,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { downloadFile } from "../utils/erdExport";

interface MockDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  onGenerateMockData: (count: number) => Promise<string>;
}

export const MockDataModal: React.FC<MockDataModalProps> = ({
  isOpen,
  onClose,
  schema,
  onGenerateMockData,
}) => {
  const [rowCount, setRowCount] = useState<number>(5);
  const [generatedSql, setGeneratedSql] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const sql = await onGenerateMockData(rowCount);
      setGeneratedSql(sql);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadFile(`relatex_mock_data_${Date.now()}.sql`, generatedSql, "text/sql");
  };

  return (
    <div
      id="mock-data-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">
                Synthetic Mock Data Generator
              </h2>
              <p className="text-xs text-slate-400">
                Generate referentially-consistent SQL INSERT statements with realistic entities
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

        {/* Controls Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Records per table:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {[3, 5, 10, 25].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setRowCount(cnt)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    rowCount === cnt
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cnt} rows
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-generate-mock-data-action"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? "Generating Data..." : "Generate SQL Inserts"}</span>
          </button>
        </div>

        {/* Output Viewer */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                Synthesizing referentially valid mock data...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aligning Primary and Foreign Keys across {schema.tables.length} tables in {schema.dialect}.
              </p>
            </div>
          ) : generatedSql ? (
            <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-y-auto leading-relaxed">
              <pre>{generatedSql}</pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <Table className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">
                Click "Generate SQL Inserts" to synthesize realistic data with matching Foreign Keys.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-500">
            Obeying strict referential integrity order (Parents before Children)
          </span>

          <div className="flex items-center gap-3">
            {generatedSql && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
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

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
