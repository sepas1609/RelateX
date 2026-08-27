/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CanvasLayoutMode,
  CopilotMessage,
  DatabaseSchema,
  ErdNotationMode,
  OptimizationReport,
  SqlDialect,
  TableNodeData,
} from "./types";
import { parseSqlDdl, applyLayout } from "./utils/sqlParser";
import { SAMPLE_SCHEMAS } from "./utils/sampleSchemas";
import { Navbar } from "./components/Navbar";
import { Canvas } from "./components/Canvas";
import { DdlEditorModal } from "./components/DdlEditorModal";
import { OptimizerPanel } from "./components/OptimizerPanel";
import { CopilotPanel } from "./components/CopilotPanel";
import { MockDataModal } from "./components/MockDataModal";
import { ExportModal } from "./components/ExportModal";
import { TableInspectorModal } from "./components/TableInspectorModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { QueryExplainerModal } from "./components/QueryExplainerModal";
import { NotationGuideModal } from "./components/NotationGuideModal";
import { QueryExplanationResult } from "./types";

export default function App() {
  // Initialize with the rich E-Commerce sample schema
  const defaultSample = SAMPLE_SCHEMAS[0];

  const [schema, setSchema] = useState<DatabaseSchema>(() =>
    parseSqlDdl(defaultSample.ddl, defaultSample.dialect)
  );

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [inspectedTable, setInspectedTable] = useState<TableNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [layoutMode, setLayoutMode] = useState<CanvasLayoutMode>("hierarchical");
  const [notationMode, setNotationMode] = useState<ErdNotationMode>(() => {
    return (localStorage.getItem("relatex_notation_mode") as ErdNotationMode) || "crows_foot";
  });

  // Modals state
  const [isDdlModalOpen, setIsDdlModalOpen] = useState<boolean>(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [isQueryExplainerOpen, setIsQueryExplainerOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isMockDataOpen, setIsMockDataOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isNotationGuideOpen, setIsNotationGuideOpen] = useState<boolean>(false);

  // AI & Optimizer State
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isAiRepairing, setIsAiRepairing] = useState<boolean>(false);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);

  // Custom API key management (stored in localStorage for public visitors)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("relatex_custom_gemini_key") || "";
  });
  const [hasServerKey, setHasServerKey] = useState<boolean>(true);

  // Check health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hasServerKey === "boolean") {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch((err) => console.warn("Health check error:", err));
  }, []);

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem("relatex_custom_gemini_key", key);
    } else {
      localStorage.removeItem("relatex_custom_gemini_key");
    }
  };

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    schema.tables.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [schema.tables]);

  // Apply layout change
  const handleChangeLayout = (newMode: CanvasLayoutMode) => {
    setLayoutMode(newMode);
    const updated = applyLayout(schema.tables, schema.relations, newMode);
    setSchema((prev) => ({
      ...prev,
      tables: updated,
    }));
  };

  // Change ERD Notation Mode
  const handleChangeNotationMode = (newNotation: ErdNotationMode) => {
    setNotationMode(newNotation);
    localStorage.setItem("relatex_notation_mode", newNotation);
  };

  // Update table positions when dragged
  const handleUpdateTablePositions = useCallback((updatedTables: TableNodeData[]) => {
    setSchema((prev) => ({
      ...prev,
      tables: updatedTables,
    }));
  }, []);

  // Load sample template
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_SCHEMAS.find((s) => s.id === sampleId);
    if (!sample) return;
    const parsed = parseSqlDdl(sample.ddl, sample.dialect);
    setSchema(parsed);
    setSelectedTable(null);
    setOptimizationReport(null);
  };

  // Change Dialect
  const handleSelectDialect = (newDialect: SqlDialect) => {
    const parsed = parseSqlDdl(schema.rawDdl, newDialect);
    setSchema(parsed);
  };

  // Apply new DDL from editor
  const handleApplyDdl = (newDdl: string, dialect: SqlDialect) => {
    const parsed = parseSqlDdl(newDdl, dialect);
    setSchema(parsed);
    setSelectedTable(null);
    setOptimizationReport(null);
  };

  // Headers helper for custom API Key
  const getApiHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customApiKey) {
      headers["x-gemini-api-key"] = customApiKey;
    }
    return headers;
  };

  // 1. Run Gemini AI Performance & Index Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const response = await fetch("/api/analyze-schema", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          ddlScript: schema.rawDdl,
          dialect: schema.dialect,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to analyze schema");
      }

      const data: OptimizationReport = await response.json();
      setOptimizationReport(data);
    } catch (err: any) {
      console.error("Error during AI audit:", err);
      alert(`Optimization audit failed: ${err.message || "Please check your API key"}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // 2. Apply One-Click SQL Patch (merges new indexes into active schema)
  const handleApplySqlPatch = (patchSql: string) => {
    const mergedDdl = `${schema.rawDdl.trim()}\n\n-- RelateX Optimized Indexes\n${patchSql.trim()}`;
    const parsed = parseSqlDdl(mergedDdl, schema.dialect);
    setSchema(parsed);
  };

  // 3. Conversational Copilot
  const handleSendCopilotMessage = async (text: string) => {
    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setIsCopilotLoading(true);

    try {
      const response = await fetch("/api/schema-copilot", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          message: text,
          ddlScript: schema.rawDdl,
          dialect: schema.dialect,
          chatHistory: copilotMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Copilot failed to respond");
      }

      const data = await response.json();
      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I analyzed your schema and generated the response above.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setCopilotMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Error: ${err.message || "Failed to reach Gemini API. Please check your API key."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setCopilotMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // 4. Mock Data Generation
  const handleGenerateMockData = async (count: number): Promise<string> => {
    const response = await fetch("/api/generate-mock-data", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        ddlScript: schema.rawDdl,
        dialect: schema.dialect,
        count,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to generate mock data");
    }

    const data = await response.json();
    return data.sqlScript || "-- No SQL statements generated";
  };

  // 5. Dialect Converter
  const handleConvertDialect = async (targetFormat: string): Promise<string> => {
    const response = await fetch("/api/convert-dialect", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        ddlScript: schema.rawDdl,
        sourceDialect: schema.dialect,
        targetFormat,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to convert dialect");
    }

    const data = await response.json();
    return data.convertedCode || "-- Conversion completed";
  };

  // 6. Query Explainer & Optimizer
  const handleExplainQuery = async (query: string): Promise<QueryExplanationResult> => {
    const response = await fetch("/api/explain-query", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        query,
        ddlScript: schema.rawDdl,
        dialect: schema.dialect,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to explain query");
    }

    const data = await response.json();
    return data;
  };

  // 7. Repair AST with AI
  const handleRepairWithAi = async (ddl: string, dialect: SqlDialect) => {
    setIsAiRepairing(true);
    try {
      const response = await fetch("/api/repair-ddl-ast", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({ ddlScript: ddl, dialect }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "AST repair failed");
      }

      const data = await response.json();
      if (data.tables && Array.isArray(data.tables)) {
        const positioned = applyLayout(data.tables, data.relations || [], layoutMode);
        setSchema({
          tables: positioned,
          relations: data.relations || [],
          dialect,
          rawDdl: ddl,
          parsedAt: new Date().toISOString(),
        });
        setIsDdlModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(`AST Repair Error: ${err.message}`);
    } finally {
      setIsAiRepairing(false);
    }
  };

  return (
    <div id="relatex-app" className="w-full h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        schema={schema}
        dialect={schema.dialect}
        onSelectDialect={handleSelectDialect}
        onSelectSample={handleSelectSample}
        onOpenDdlEditor={() => setIsDdlModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        onOpenQueryExplainer={() => setIsQueryExplainerOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenMockData={() => setIsMockDataOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomApiKey={!!customApiKey}
        layoutMode={layoutMode}
        onChangeLayout={handleChangeLayout}
        notationMode={notationMode}
        onChangeNotationMode={handleChangeNotationMode}
        onOpenNotationGuide={() => setIsNotationGuideOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 relative overflow-hidden">
        <Canvas
          schema={schema}
          onUpdateTablePositions={handleUpdateTablePositions}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
          onInspectTable={(table) => setInspectedTable(table)}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          notationMode={notationMode}
          onChangeNotationMode={handleChangeNotationMode}
          onOpenNotationGuide={() => setIsNotationGuideOpen(true)}
        />
      </main>

      {/* Modals & Panels */}
      <DdlEditorModal
        isOpen={isDdlModalOpen}
        onClose={() => setIsDdlModalOpen(false)}
        initialDdl={schema.rawDdl}
        initialDialect={schema.dialect}
        onApplyDdl={handleApplyDdl}
        onRepairWithAi={handleRepairWithAi}
        isAiRepairing={isAiRepairing}
      />

      <OptimizerPanel
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        schema={schema}
        report={optimizationReport}
        isLoading={isAuditing}
        onRunAudit={handleRunAudit}
        onApplySqlPatch={handleApplySqlPatch}
      />

      <QueryExplainerModal
        isOpen={isQueryExplainerOpen}
        onClose={() => setIsQueryExplainerOpen(false)}
        schema={schema}
        onExplainQuery={handleExplainQuery}
      />

      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        schema={schema}
        messages={copilotMessages}
        onSendMessage={handleSendCopilotMessage}
        isLoading={isCopilotLoading}
        onClearHistory={() => setCopilotMessages([])}
      />

      <MockDataModal
        isOpen={isMockDataOpen}
        onClose={() => setIsMockDataOpen(false)}
        schema={schema}
        onGenerateMockData={handleGenerateMockData}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        schema={schema}
        optimizationReport={optimizationReport}
        onConvertDialect={handleConvertDialect}
      />

      <TableInspectorModal
        table={inspectedTable}
        schema={schema}
        onClose={() => setInspectedTable(null)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        customApiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
        hasServerKey={hasServerKey}
      />

      <NotationGuideModal
        isOpen={isNotationGuideOpen}
        onClose={() => setIsNotationGuideOpen(false)}
        currentNotation={notationMode}
        onSelectNotation={handleChangeNotationMode}
      />
    </div>
  );
}
