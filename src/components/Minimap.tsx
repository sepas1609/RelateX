import React from "react";
import { TableNodeData } from "../types";

interface MinimapProps {
  tables: TableNodeData[];
  selectedTable: string | null;
  viewportOffset: { x: number; y: number };
  viewportScale: number;
  canvasDimensions: { width: number; height: number };
  onNavigateMinimap: (targetX: number, targetY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  tables,
  selectedTable,
  viewportOffset,
  viewportScale,
  canvasDimensions,
  onNavigateMinimap,
}) => {
  if (tables.length === 0) return null;

  // Calculate bounding box of all tables
  const minX = Math.min(...tables.map((t) => t.position.x), 0) - 100;
  const minY = Math.min(...tables.map((t) => t.position.y), 0) - 100;
  const maxX = Math.max(...tables.map((t) => t.position.x + 300), 1200) + 100;
  const maxY = Math.max(...tables.map((t) => t.position.y + 400), 800) + 100;

  const mapWidth = maxX - minX;
  const mapHeight = maxY - minY;

  const miniWidth = 180;
  const miniHeight = 120;

  const scaleX = miniWidth / mapWidth;
  const scaleY = miniHeight / mapHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate viewport frame in minimap space
  const vpWorldX = -viewportOffset.x / viewportScale;
  const vpWorldY = -viewportOffset.y / viewportScale;
  const vpWorldW = canvasDimensions.width / viewportScale;
  const vpWorldH = canvasDimensions.height / viewportScale;

  const vpMiniX = (vpWorldX - minX) * scale;
  const vpMiniY = (vpWorldY - minY) * scale;
  const vpMiniW = Math.max(vpWorldW * scale, 20);
  const vpMiniH = Math.max(vpWorldH * scale, 15);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = minX + clickX / scale;
    const targetWorldY = minY + clickY / scale;

    const newOffsetX = -(targetWorldX - canvasDimensions.width / (2 * viewportScale)) * viewportScale;
    const newOffsetY = -(targetWorldY - canvasDimensions.height / (2 * viewportScale)) * viewportScale;

    onNavigateMinimap(newOffsetX, newOffsetY);
  };

  return (
    <div
      id="canvas-minimap"
      onClick={handleMinimapClick}
      className="absolute bottom-5 right-5 w-[180px] h-[120px] bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl p-2 cursor-crosshair select-none z-20 overflow-hidden"
    >
      <div className="relative w-full h-full">
        {/* Render scaled table rectangles */}
        {tables.map((t) => {
          const x = (t.position.x - minX) * scale;
          const y = (t.position.y - minY) * scale;
          const w = 290 * scale;
          const h = (80 + t.columns.length * 28) * scale;
          const isSelected = selectedTable === t.name;

          return (
            <div
              key={t.name}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${Math.max(w, 8)}px`,
                height: `${Math.max(h, 6)}px`,
              }}
              className={`absolute rounded-[2px] transition-colors ${
                isSelected
                  ? "bg-cyan-400 border border-cyan-200"
                  : "bg-slate-700/80 border border-slate-600/50"
              }`}
            />
          );
        })}

        {/* Viewport Indicator */}
        <div
          style={{
            left: `${Math.max(0, vpMiniX)}px`,
            top: `${Math.max(0, vpMiniY)}px`,
            width: `${Math.min(vpMiniW, miniWidth)}px`,
            height: `${Math.min(vpMiniH, miniHeight)}px`,
          }}
          className="absolute border border-cyan-400/80 bg-cyan-500/10 rounded-[3px] pointer-events-none"
        />
      </div>

      <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-mono">
        Minimap
      </div>
    </div>
  );
};
