import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Grid,
  Eye,
  EyeOff,
  Sparkles,
  Link,
  BookOpen,
  Layers,
  HelpCircle,
} from "lucide-react";
import { DatabaseSchema, ErdNotationMode, TableNodeData, TableRelation } from "../types";
import { TableNode } from "./TableNode";
import { ChenEntityNode } from "./ChenEntityNode";
import { UmlClassNode } from "./UmlClassNode";
import { BachmanNode } from "./BachmanNode";
import { StarDimensionalNode } from "./StarDimensionalNode";
import { Minimap } from "./Minimap";

interface CanvasProps {
  schema: DatabaseSchema;
  onUpdateTablePositions: (updatedTables: TableNodeData[]) => void;
  selectedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
  onInspectTable: (table: TableNodeData) => void;
  searchQuery: string;
  selectedCategory: string;
  notationMode: ErdNotationMode;
  onChangeNotationMode: (mode: ErdNotationMode) => void;
  onOpenNotationGuide: () => void;
}

// Generate meaningful Chen verb for relationship based on table names
function getRelationshipVerb(source: string, target: string, cardinality: string): string {
  const s = source.toLowerCase();
  const t = target.toLowerCase();

  if (s.includes("order") && t.includes("user")) return "PLACED_BY";
  if (s.includes("order") && t.includes("item")) return "CONTAINS";
  if (s.includes("item") && t.includes("product")) return "REFERENCES";
  if (s.includes("payment")) return "PAYS_FOR";
  if (s.includes("review")) return "WRITTEN_BY";
  if (s.includes("address")) return "LOCATED_AT";
  if (s.includes("role") || s.includes("permission")) return "ASSIGNED_TO";
  if (s.includes("patient") || s.includes("doctor")) return "CONSULTS";
  if (s.includes("prescript")) return "PRESCRIBED_TO";
  if (s.includes("invoice")) return "BILLED_TO";

  if (cardinality === "1:1") return "ASSOCIATED_WITH";
  if (cardinality === "N:M") return "MAPS_TO";
  return "HAS_MANY";
}

export const Canvas: React.FC<CanvasProps> = ({
  schema,
  onUpdateTablePositions,
  selectedTable,
  onSelectTable,
  onInspectTable,
  searchQuery,
  selectedCategory,
  notationMode,
  onChangeNotationMode,
  onOpenNotationGuide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state
  const [scale, setScale] = useState<number>(0.85);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging node state
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover states
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<{ table: string; column: string } | null>(null);

  // Canvas visual settings
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [gridStyle, setGridStyle] = useState<"dots" | "grid" | "none">("dots");

  // Dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  // Track container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const newScale = e.deltaY < 0 ? Math.min(scale * zoomFactor, 2.5) : Math.max(scale / zoomFactor, 0.25);

    // Zoom centered on cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newOffsetX = mouseX - ((mouseX - offset.x) / scale) * newScale;
      const newOffsetY = mouseY - ((mouseY - offset.y) / scale) * newScale;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.25));
  const handleResetZoom = () => {
    setScale(0.9);
    setOffset({ x: 80, y: 60 });
  };

  const handleFitView = useCallback(() => {
    if (schema.tables.length === 0 || !containerRef.current) return;
    const minX = Math.min(...schema.tables.map((t) => t.position.x));
    const minY = Math.min(...schema.tables.map((t) => t.position.y));
    const maxX = Math.max(...schema.tables.map((t) => t.position.x + 310));
    const maxY = Math.max(...schema.tables.map((t) => t.position.y + 360));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const availableWidth = containerRef.current.clientWidth - 120;
    const availableHeight = containerRef.current.clientHeight - 120;

    const fitScale = Math.min(
      Math.max(availableWidth / contentWidth, 0.3),
      Math.max(availableHeight / contentHeight, 0.3),
      1.1
    );

    const fitOffsetX = (containerRef.current.clientWidth - contentWidth * fitScale) / 2 - minX * fitScale;
    const fitOffsetY = (containerRef.current.clientHeight - contentHeight * fitScale) / 2 - minY * fitScale;

    setScale(fitScale);
    setOffset({ x: fitOffsetX, y: fitOffsetY });
  }, [schema.tables]);

  // Center on table if searched
  useEffect(() => {
    if (searchQuery && schema.tables.length > 0) {
      const q = searchQuery.toLowerCase();
      const match = schema.tables.find(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.columns.some((c) => c.name.toLowerCase().includes(q))
      );
      if (match && containerRef.current) {
        const targetX =
          containerRef.current.clientWidth / 2 - (match.position.x + 150) * scale;
        const targetY =
          containerRef.current.clientHeight / 2 - (match.position.y + 100) * scale;
        setOffset({ x: targetX, y: targetY });
      }
    }
  }, [searchQuery, scale, schema.tables]);

  // Canvas Mouse events (Pan & Drag Node)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-svg-layer") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      onSelectTable(null);
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation();
    const table = schema.tables.find((t) => t.name === tableName);
    if (!table) return;

    setDraggingTable(tableName);
    // Record offset between cursor world pos and table pos
    const mouseWorldX = (e.clientX - offset.x) / scale;
    const mouseWorldY = (e.clientY - offset.y) / scale;

    setDragOffset({
      x: mouseWorldX - table.position.x,
      y: mouseWorldY - table.position.y,
    });
    onSelectTable(tableName);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingTable) {
      const mouseWorldX = (e.clientX - offset.x) / scale;
      const mouseWorldY = (e.clientY - offset.y) / scale;

      const newX = Math.round(mouseWorldX - dragOffset.x);
      const newY = Math.round(mouseWorldY - dragOffset.y);

      const updated = schema.tables.map((t) =>
        t.name === draggingTable
          ? { ...t, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : t
      );
      onUpdateTablePositions(updated);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingTable(null);
  };

  // Helper to calculate connector path between FK and PK
  const getRelationPath = (rel: TableRelation) => {
    const sourceTable = schema.tables.find((t) => t.name === rel.sourceTable);
    const targetTable = schema.tables.find((t) => t.name === rel.targetTable);

    if (!sourceTable || !targetTable) return null;

    const sourceColIndex = sourceTable.columns.findIndex(
      (c) => c.name === rel.sourceColumn
    );
    const targetColIndex = targetTable.columns.findIndex(
      (c) => c.name === rel.targetColumn
    );

    const CARD_WIDTH = 300;
    const HEADER_HEIGHT = 45;
    const ROW_HEIGHT = 28;

    // Calculate Y anchor port
    const sourceY =
      sourceTable.position.y +
      HEADER_HEIGHT +
      (sourceColIndex >= 0 ? sourceColIndex : 0) * ROW_HEIGHT +
      ROW_HEIGHT / 2;

    const targetY =
      targetTable.position.y +
      HEADER_HEIGHT +
      (targetColIndex >= 0 ? targetColIndex : 0) * ROW_HEIGHT +
      ROW_HEIGHT / 2;

    // Determine left or right side connection
    const sourceIsLeft = sourceTable.position.x < targetTable.position.x;

    const sourceX = sourceIsLeft
      ? sourceTable.position.x + CARD_WIDTH
      : sourceTable.position.x;
    const targetX = sourceIsLeft
      ? targetTable.position.x
      : targetTable.position.x + CARD_WIDTH;

    // Cubic Bezier curve control points
    const dx = Math.abs(targetX - sourceX);
    const curvature = Math.min(Math.max(dx * 0.5, 60), 200);

    const cp1X = sourceIsLeft ? sourceX + curvature : sourceX - curvature;
    const cp1Y = sourceY;
    const cp2X = sourceIsLeft ? targetX - curvature : targetX + curvature;
    const cp2Y = targetY;

    const pathData = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;

    // Midpoint for cardinality badge or Chen Diamond
    const midX = 0.5 * (cp1X + cp2X);
    const midY = 0.5 * (sourceY + targetY);

    const relationshipVerb = getRelationshipVerb(
      rel.sourceTable,
      rel.targetTable,
      rel.cardinality
    );

    return {
      pathData,
      sourceX,
      sourceY,
      targetX,
      targetY,
      midX,
      midY,
      relationshipVerb,
      sourceIsLeft,
    };
  };

  // Filter tables by selected category
  const filteredTables = schema.tables.filter((t) => {
    if (selectedCategory !== "ALL" && t.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div
      id="erd-canvas-container"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none bg-slate-950 ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        backgroundImage:
          gridStyle === "dots"
            ? "radial-gradient(circle, rgba(148, 163, 184, 0.12) 1px, transparent 1px)"
            : gridStyle === "grid"
            ? "linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px)"
            : "none",
        backgroundSize:
          gridStyle === "dots"
            ? `${24 * scale}px ${24 * scale}px`
            : `${36 * scale}px ${36 * scale}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    >
      {/* Zoom / Pan Stage Wrapper */}
      <div
        id="canvas-stage"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Connectors Layer */}
        <svg
          id="canvas-svg-layer"
          className="absolute overflow-visible pointer-events-auto"
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            {/* Standard Arrow Marker */}
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
            </marker>

            {/* UML Association Open Arrow */}
            <marker
              id="uml-arrow"
              viewBox="0 0 12 12"
              refX="10"
              refY="6"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 2 2 L 10 6 L 2 10" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            </marker>

            {/* Bachman Set Circle Anchor */}
            <marker
              id="bachman-circle"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
            >
              <circle cx="5" cy="5" r="4" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1.5" />
            </marker>

            {/* Crow's Foot Marker (Branch) */}
            <marker
              id="crows-foot-branch"
              viewBox="0 0 14 14"
              refX="12"
              refY="7"
              markerWidth="9"
              markerHeight="9"
              orient="auto-start-reverse"
            >
              <path d="M 2 2 L 12 7 L 2 12 M 12 2 L 12 12" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            </marker>

            {/* Crossbar 1 Marker */}
            <marker
              id="crossbar-one"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 3 1 L 3 9 M 7 1 L 7 9" fill="none" stroke="#818cf8" strokeWidth="1.5" />
            </marker>
          </defs>

          {/* Render Relationship Lines & Notation Elements */}
          {schema.relations.map((rel) => {
            const relInfo = getRelationPath(rel);
            if (!relInfo) return null;

            const isRelHovered =
              hoveredTable === rel.sourceTable ||
              hoveredTable === rel.targetTable ||
              selectedTable === rel.sourceTable ||
              selectedTable === rel.targetTable ||
              (hoveredColumn &&
                hoveredColumn.table === rel.sourceTable &&
                hoveredColumn.column === rel.sourceColumn);

            // 1. CHEN'S NOTATION: Relationship Diamond with verb and cardinality spokes
            if (notationMode === "chen") {
              return (
                <g key={rel.id} className="group cursor-pointer">
                  {/* Lines connecting entities to the central Diamond */}
                  <line
                    x1={relInfo.sourceX}
                    y1={relInfo.sourceY}
                    x2={relInfo.midX}
                    y2={relInfo.midY}
                    stroke={isRelHovered ? "#38bdf8" : "rgba(129, 140, 248, 0.6)"}
                    strokeWidth={isRelHovered ? "2.5" : "1.8"}
                  />
                  <line
                    x1={relInfo.midX}
                    y1={relInfo.midY}
                    x2={relInfo.targetX}
                    y2={relInfo.targetY}
                    stroke={isRelHovered ? "#38bdf8" : "rgba(129, 140, 248, 0.6)"}
                    strokeWidth={isRelHovered ? "2.5" : "1.8"}
                  />

                  {/* Cardinality labels along spokes */}
                  <text
                    x={0.5 * (relInfo.sourceX + relInfo.midX)}
                    y={0.5 * (relInfo.sourceY + relInfo.midY) - 6}
                    fill="#38bdf8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {rel.cardinality === "1:1" ? "1" : "N"}
                  </text>
                  <text
                    x={0.5 * (relInfo.targetX + relInfo.midX)}
                    y={0.5 * (relInfo.targetY + relInfo.midY) - 6}
                    fill="#818cf8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    1
                  </text>

                  {/* Chen Relationship Diamond (Rhombus) */}
                  <g transform={`translate(${relInfo.midX}, ${relInfo.midY})`}>
                    {/* Diamond Shape */}
                    <polygon
                      points="0,-22 42,0 0,22 -42,0"
                      fill="#0f172a"
                      stroke={isRelHovered ? "#38bdf8" : "#6366f1"}
                      strokeWidth={isRelHovered ? "2.5" : "1.8"}
                      className="transition-colors shadow-lg filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    {/* Verb Text inside Diamond */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isRelHovered ? "#38bdf8" : "#c7d2fe"}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="0.5px"
                    >
                      {relInfo.relationshipVerb}
                    </text>
                  </g>
                </g>
              );
            }

            // 2. UML CLASS DIAGRAM / IDEF1X NOTATION
            if (notationMode === "uml") {
              return (
                <g key={rel.id} className="group">
                  {/* Line */}
                  <path
                    d={relInfo.pathData}
                    fill="none"
                    stroke={isRelHovered ? "#38bdf8" : "rgba(100, 116, 139, 0.6)"}
                    strokeWidth={isRelHovered ? "2.5" : "1.8"}
                    markerEnd="url(#uml-arrow)"
                  />

                  {/* UML Multiplicity Labels */}
                  <g
                    transform={`translate(${relInfo.sourceX + (relInfo.sourceIsLeft ? 15 : -15)}, ${
                      relInfo.sourceY - 8
                    })`}
                  >
                    <rect x="-14" y="-8" width="28" height="15" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {rel.cardinality === "1:1" ? "0..1" : "0..*"}
                    </text>
                  </g>

                  <g
                    transform={`translate(${relInfo.targetX + (relInfo.sourceIsLeft ? -15 : 15)}, ${
                      relInfo.targetY - 8
                    })`}
                  >
                    <rect x="-14" y="-8" width="28" height="15" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                    <text x="0" y="3" textAnchor="middle" fill="#818cf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      1..1
                    </text>
                  </g>

                  {/* Middle Association Name */}
                  <g transform={`translate(${relInfo.midX}, ${relInfo.midY})`}>
                    <rect x="-24" y="-9" width="48" height="18" rx="4" fill="#0f172a" stroke={isRelHovered ? "#38bdf8" : "#334155"} strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                      &laquo;fk_ref&raquo;
                    </text>
                  </g>
                </g>
              );
            }

            // 3. BACHMAN NOTATION
            if (notationMode === "bachman") {
              return (
                <g key={rel.id} className="group">
                  <path
                    d={relInfo.pathData}
                    fill="none"
                    stroke={isRelHovered ? "#2dd4bf" : "rgba(20, 184, 166, 0.5)"}
                    strokeWidth={isRelHovered ? "2.5" : "1.8"}
                    markerStart="url(#bachman-circle)"
                    markerEnd="url(#arrow-cyan)"
                  />
                  {/* Set Name Badge */}
                  <g transform={`translate(${relInfo.midX}, ${relInfo.midY})`}>
                    <rect x="-35" y="-10" width="70" height="20" rx="6" fill="#042f2e" stroke="#14b8a6" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#2dd4bf" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                      SET_{rel.sourceTable.substring(0, 4)}_{rel.targetTable.substring(0, 4)}
                    </text>
                  </g>
                </g>
              );
            }

            // 4. STAR / SNOWFLAKE NOTATION
            if (notationMode === "star_snowflake") {
              return (
                <g key={rel.id} className="group">
                  <path
                    d={relInfo.pathData}
                    fill="none"
                    stroke={isRelHovered ? "#fbbf24" : "rgba(251, 191, 36, 0.45)"}
                    strokeWidth={isRelHovered ? "2.5" : "1.6"}
                    strokeDasharray="5,3"
                  />
                  <circle cx={relInfo.sourceX} cy={relInfo.sourceY} r="4" fill="#fbbf24" />
                  <circle cx={relInfo.targetX} cy={relInfo.targetY} r="4" fill="#38bdf8" />
                  {/* Dimension Link Badge */}
                  <g transform={`translate(${relInfo.midX}, ${relInfo.midY})`}>
                    <rect x="-22" y="-9" width="44" height="18" rx="9" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      DIM_FK
                    </text>
                  </g>
                </g>
              );
            }

            // 5. DEFAULT: CROW'S FOOT NOTATION
            return (
              <g key={rel.id} className="group">
                {/* Glow layer when active */}
                {isRelHovered && (
                  <path
                    d={relInfo.pathData}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="7"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                    className="filter blur-[2px]"
                  />
                )}

                {/* Main Bezier Line with authentic Crow's Foot & Crossbar markers */}
                <path
                  d={relInfo.pathData}
                  fill="none"
                  stroke={isRelHovered ? "#38bdf8" : "rgba(100, 116, 139, 0.45)"}
                  strokeWidth={isRelHovered ? "2.5" : "1.6"}
                  strokeDasharray={rel.cardinality === "N:M" ? "6,4" : "none"}
                  markerStart={rel.cardinality === "1:1" ? "url(#crossbar-one)" : "url(#crows-foot-branch)"}
                  markerEnd="url(#crossbar-one)"
                  className="transition-colors duration-150"
                />

                {/* Connection Endpoints */}
                <circle
                  cx={relInfo.sourceX}
                  cy={relInfo.sourceY}
                  r={isRelHovered ? 4.5 : 3}
                  fill="#38bdf8"
                />
                <circle
                  cx={relInfo.targetX}
                  cy={relInfo.targetY}
                  r={isRelHovered ? 4.5 : 3}
                  fill="#818cf8"
                />

                {/* Cardinality Badge on Curve */}
                <g
                  transform={`translate(${relInfo.midX}, ${relInfo.midY})`}
                  className="cursor-pointer"
                >
                  <rect
                    x="-18"
                    y="-9"
                    width="36"
                    height="18"
                    rx="9"
                    fill="#0f172a"
                    stroke={isRelHovered ? "#38bdf8" : "#334155"}
                    strokeWidth="1"
                    className="transition-colors"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isRelHovered ? "#38bdf8" : "#94a3b8"}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {rel.cardinality}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* HTML Entity Nodes Layer (Rendered with the active notation component) */}
        <div className="absolute inset-0 pointer-events-auto">
          {filteredTables.map((table) => {
            const isSelected = selectedTable === table.name;
            const isHovered = hoveredTable === table.name;
            const isRelated = schema.relations.some(
              (r) =>
                (selectedTable === r.sourceTable && table.name === r.targetTable) ||
                (selectedTable === r.targetTable && table.name === r.sourceTable)
            );
            const isSearchMatch =
              !!searchQuery &&
              (table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                table.columns.some((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                ));

            const activeColHighlightStr = hoveredColumn
              ? `${hoveredColumn.table}.${hoveredColumn.column}`
              : null;

            // Render based on selected notation
            if (notationMode === "chen") {
              return (
                <ChenEntityNode
                  key={table.name}
                  table={table}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isRelated={isRelated}
                  isSearchMatch={isSearchMatch}
                  onSelectTable={onSelectTable}
                  onHoverTable={setHoveredTable}
                  onInspectTable={onInspectTable}
                  onMouseDownNode={handleMouseDownNode}
                />
              );
            }

            if (notationMode === "uml") {
              return (
                <UmlClassNode
                  key={table.name}
                  table={table}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isRelated={isRelated}
                  isSearchMatch={isSearchMatch}
                  onSelectTable={onSelectTable}
                  onHoverTable={setHoveredTable}
                  onInspectTable={onInspectTable}
                  onMouseDownNode={handleMouseDownNode}
                />
              );
            }

            if (notationMode === "bachman") {
              return (
                <BachmanNode
                  key={table.name}
                  table={table}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isRelated={isRelated}
                  isSearchMatch={isSearchMatch}
                  onSelectTable={onSelectTable}
                  onHoverTable={setHoveredTable}
                  onInspectTable={onInspectTable}
                  onMouseDownNode={handleMouseDownNode}
                />
              );
            }

            if (notationMode === "star_snowflake") {
              return (
                <StarDimensionalNode
                  key={table.name}
                  table={table}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isRelated={isRelated}
                  isSearchMatch={isSearchMatch}
                  onSelectTable={onSelectTable}
                  onHoverTable={setHoveredTable}
                  onInspectTable={onInspectTable}
                  onMouseDownNode={handleMouseDownNode}
                />
              );
            }

            // Default Crow's Foot Table Node
            return (
              <TableNode
                key={table.name}
                table={table}
                isSelected={isSelected}
                isHovered={isHovered}
                isRelated={isRelated}
                isSearchMatch={isSearchMatch}
                activeColumnHighlight={activeColHighlightStr}
                onSelectTable={onSelectTable}
                onHoverTable={setHoveredTable}
                onHoverColumn={(tName, cName) =>
                  setHoveredColumn(cName ? { table: tName, column: cName } : null)
                }
                onInspectTable={onInspectTable}
                onMouseDownNode={handleMouseDownNode}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Controls (Bottom-Left) */}
      <div
        id="canvas-controls"
        className="absolute bottom-5 left-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl z-20"
      >
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors"
          title="Reset Zoom (100%)"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleFitView}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Fit Schema to View"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={() =>
            setGridStyle((g) => (g === "dots" ? "grid" : g === "grid" ? "none" : "dots"))
          }
          className={`p-2 rounded-lg transition-colors ${
            gridStyle !== "none"
              ? "text-cyan-400 bg-cyan-950/40"
              : "text-slate-400 hover:bg-slate-800"
          }`}
          title="Toggle Canvas Grid Style"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className={`p-2 rounded-lg transition-colors ${
            showMinimap
              ? "text-cyan-400 bg-cyan-950/40"
              : "text-slate-400 hover:bg-slate-800"
          }`}
          title="Toggle Minimap"
        >
          {showMinimap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating ERD Notation Switcher Bar (Top-Center) */}
      <div
        id="erd-notation-selector"
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-2xl z-20"
      >
        <span className="text-[11px] font-mono text-slate-400 px-2 font-medium hidden sm:inline">
          Notation:
        </span>

        {/* Crow's Foot */}
        <button
          id="btn-notation-crows-foot"
          onClick={() => onChangeNotationMode("crows_foot")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            notationMode === "crows_foot"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Crow's Foot Notation (Relational tables & cardinality symbols)"
        >
          <span>🦅</span>
          <span>Crow's Foot</span>
        </button>

        {/* Chen's Notation */}
        <button
          id="btn-notation-chen"
          onClick={() => onChangeNotationMode("chen")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            notationMode === "chen"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Chen's Notation (Rectangles, Relationship Diamonds & Attribute Ellipses)"
        >
          <span>🔷</span>
          <span>Peter Chen</span>
        </button>

        {/* UML Class Diagram */}
        <button
          id="btn-notation-uml"
          onClick={() => onChangeNotationMode("uml")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            notationMode === "uml"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="UML Class & IDEF1X Diagram (Compartments, Stereotypes & Multiplicities)"
        >
          <span>📐</span>
          <span>UML / IDEF1X</span>
        </button>

        {/* Bachman */}
        <button
          id="btn-notation-bachman"
          onClick={() => onChangeNotationMode("bachman")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            notationMode === "bachman"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Bachman Data Structure Diagram (1:N Set Relationships & Record Types)"
        >
          <span>🕸️</span>
          <span>Bachman</span>
        </button>

        {/* Star & Snowflake */}
        <button
          id="btn-notation-star"
          onClick={() => onChangeNotationMode("star_snowflake")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            notationMode === "star_snowflake"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Star & Snowflake Schema (Fact Hubs & Dimension Lookups)"
        >
          <span>⭐</span>
          <span>Star / Kimball</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Notation Guide / Help Modal Button */}
        <button
          id="btn-open-notation-guide"
          onClick={onOpenNotationGuide}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Open Notation Symbols & Cheatsheet Guide"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Status Bar (Top-Left) */}
      <div className="absolute top-4 left-5 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-100">
            {schema.tables.length}
          </span>
          <span className="text-slate-400">Tables</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-100">
            {schema.relations.length}
          </span>
          <span className="text-slate-400">Relations</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="text-[11px] text-cyan-400 font-mono">
          {schema.dialect}
        </div>
      </div>

      {/* Minimap (Bottom-Right) */}
      {showMinimap && (
        <Minimap
          tables={schema.tables}
          selectedTable={selectedTable}
          viewportOffset={offset}
          viewportScale={scale}
          canvasDimensions={dimensions}
          onNavigateMinimap={(newX, newY) => setOffset({ x: newX, y: newY })}
        />
      )}
    </div>
  );
};
