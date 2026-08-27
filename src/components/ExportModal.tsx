import React, { useState } from "react";
import {
  Download,
  FileCode,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  Share2,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";
import { DatabaseSchema, OptimizationReport } from "../types";
import { generateDbml, generateMermaid, downloadFile, exportSchemaToPdf } from "../utils/erdExport";
import { toPng, toSvg } from "html-to-image";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchema;
  optimizationReport?: OptimizationReport | null;
  onConvertDialect: (targetFormat: string) => Promise<string>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  schema,
  optimizationReport,
  onConvertDialect,
}) => {
  const [activeFormat, setActiveFormat] = useState<
    "pdf" | "dbml" | "mermaid" | "sql" | "image" | "dialect"
  >("pdf");
  const [copied, setCopied] = useState(false);
  const [targetDialect, setTargetDialect] = useState<string>("MySQL");
  const [convertedDialectSql, setConvertedDialectSql] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const dbmlContent = generateDbml(schema);
  const mermaidContent = generateMermaid(schema);

  const getCurrentContent = () => {
    switch (activeFormat) {
      case "dbml":
        return dbmlContent;
      case "mermaid":
        return mermaidContent;
      case "sql":
        return schema.rawDdl;
      case "dialect":
        return convertedDialectSql || "-- Select a target dialect and click Convert";
      default:
        return "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const timestamp = Date.now();
    switch (activeFormat) {
      case "dbml":
        downloadFile(`relatex_schema_${timestamp}.dbml`, dbmlContent, "text/plain");
        break;
      case "mermaid":
        downloadFile(`relatex_erd_${timestamp}.mmd`, mermaidContent, "text/plain");
        break;
      case "sql":
        downloadFile(`relatex_schema_${timestamp}.sql`, schema.rawDdl, "text/sql");
        break;
      case "dialect":
        downloadFile(`relatex_${targetDialect.toLowerCase()}_${timestamp}.sql`, convertedDialectSql, "text/sql");
        break;
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportSchemaToPdf(schema, optimizationReport);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportImage = async (format: "png" | "svg") => {
    const canvasElement = document.getElementById("canvas-stage");
    if (!canvasElement) return;

    setIsExportingImage(true);
    try {
      if (format === "png") {
        const dataUrl = await toPng(canvasElement, {
          backgroundColor: "#020617",
          quality: 0.95,
          pixelRatio: 2,
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `relatex_erd_${Date.now()}.png`;
        a.click();
      } else {
        const dataUrl = await toSvg(canvasElement, {
          backgroundColor: "#020617",
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `relatex_erd_${Date.now()}.svg`;
        a.click();
      }
    } catch (err) {
      console.error("Failed to export image:", err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleConvertDialect = async () => {
    setIsConverting(true);
    try {
      const res = await onConvertDialect(targetDialect);
      setConvertedDialectSql(res);
    } catch (err) {
      console.error("Failed to convert dialect:", err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div
      id="export-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">
                Export & Conversion Studio
              </h2>
              <p className="text-xs text-slate-400">
                Export diagrams to PDF Architecture Reports, DBML, Mermaid, PNG/SVG or convert SQL dialects
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

        {/* Tab Selector */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveFormat("pdf")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFormat === "pdf"
                ? "border-rose-400 text-rose-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF Architecture Report</span>
          </button>
          <button
            onClick={() => setActiveFormat("dbml")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeFormat === "dbml"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            DBML (Database Markup)
          </button>
          <button
            onClick={() => setActiveFormat("mermaid")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeFormat === "mermaid"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Mermaid ERD
          </button>
          <button
            onClick={() => setActiveFormat("sql")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeFormat === "sql"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            SQL Script ({schema.dialect})
          </button>
          <button
            onClick={() => setActiveFormat("dialect")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFormat === "dialect"
                ? "border-purple-400 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Dialect Converter</span>
          </button>
          <button
            onClick={() => setActiveFormat("image")}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeFormat === "image"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            PNG / SVG Image
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {activeFormat === "pdf" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">
                  Export Executive PDF Report
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Generates a publication-grade PDF document containing the Visual ERD canvas snapshot, Data Dictionary tables, Relational Foreign Key map, and AI Performance & Index Optimization advice.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md w-full text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Entities:</span>
                  <strong className="text-slate-200">{schema.tables.length} Tables</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Relations:</span>
                  <strong className="text-slate-200">{schema.relations.length} FK Links</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dialect:</span>
                  <strong className="text-cyan-400">{schema.dialect}</strong>
                </div>
              </div>

              <button
                id="btn-export-pdf-action"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {isExportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? "Compiling PDF..." : "Download PDF Report (.pdf)"}</span>
              </button>
            </div>
          ) : activeFormat === "image" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-xl">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200 mb-1">
                  Export Visual Diagram
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Download high-resolution image snapshots of your entity relationship canvas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportImage("png")}
                  disabled={isExportingImage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingImage ? "Rendering..." : "Export as High-Res PNG (2x)"}</span>
                </button>

                <button
                  onClick={() => handleExportImage("svg")}
                  disabled={isExportingImage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export as Vector SVG</span>
                </button>
              </div>
            </div>
          ) : activeFormat === "dialect" ? (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Source: <strong className="text-cyan-400">{schema.dialect}</strong></span>
                  <span>→</span>
                  <span>Target Dialect:</span>
                  <select
                    value={targetDialect}
                    onChange={(e) => setTargetDialect(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MySQL">MySQL (InnoDB)</option>
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="SQLite">SQLite</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="SQL Server">Microsoft SQL Server (T-SQL)</option>
                    <option value="Oracle">Oracle Database</option>
                  </select>
                </div>

                <button
                  onClick={handleConvertDialect}
                  disabled={isConverting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isConverting ? "Converting..." : "Convert Schema"}</span>
                </button>
              </div>

              <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-purple-300 overflow-y-auto leading-relaxed">
                <pre>{convertedDialectSql || "-- Select a target dialect and click 'Convert Schema'..."}</pre>
              </div>
            </div>
          ) : (
            <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 overflow-y-auto leading-relaxed">
              <pre>{getCurrentContent()}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-500">
            {schema.tables.length} tables • {schema.relations.length} relations
          </span>

          <div className="flex items-center gap-3">
            {activeFormat !== "image" && activeFormat !== "pdf" && (
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
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
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
