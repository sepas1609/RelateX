import {
  ColumnDefinition,
  DatabaseSchema,
  SqlDialect,
  TableIndex,
  TableNodeData,
  TableRelation,
  CanvasLayoutMode,
} from "../types";

// Categorize table colors for visual clarity
const COLOR_PALETTE = [
  { border: "border-sky-500/60", badge: "bg-sky-500/10 text-sky-400 border-sky-500/30", glow: "rgba(14, 165, 233, 0.15)" },
  { border: "border-emerald-500/60", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", glow: "rgba(16, 185, 129, 0.15)" },
  { border: "border-purple-500/60", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30", glow: "rgba(168, 85, 247, 0.15)" },
  { border: "border-amber-500/60", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", glow: "rgba(245, 158, 11, 0.15)" },
  { border: "border-rose-500/60", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30", glow: "rgba(244, 63, 94, 0.15)" },
  { border: "border-indigo-500/60", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", glow: "rgba(99, 102, 241, 0.15)" },
  { border: "border-cyan-500/60", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", glow: "rgba(6, 182, 212, 0.15)" },
  { border: "border-orange-500/60", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30", glow: "rgba(249, 115, 22, 0.15)" },
];

function cleanIdentifier(identifier: string): string {
  if (!identifier) return "";
  return identifier
    .trim()
    .replace(/^["'`\[]/, "")
    .replace(/["'`\]]$/, "")
    .replace(/^[a-zA-Z0-9_]+\./, ""); // Remove schema prefix like "public."
}

function estimateColumnByteSize(type: string): number {
  const t = type.toUpperCase();
  if (t.includes("INT8") || t.includes("BIGINT") || t.includes("BIGSERIAL")) return 8;
  if (t.includes("INT4") || t.includes("INTEGER") || t.includes("INT") || t.includes("SERIAL")) return 4;
  if (t.includes("SMALLINT") || t.includes("INT2")) return 2;
  if (t.includes("UUID")) return 16;
  if (t.includes("BOOLEAN") || t.includes("BOOL")) return 1;
  if (t.includes("TIMESTAMP") || t.includes("DATETIME")) return 8;
  if (t.includes("DATE")) return 4;
  if (t.includes("FLOAT") || t.includes("REAL")) return 4;
  if (t.includes("DOUBLE") || t.includes("DECIMAL") || t.includes("NUMERIC")) return 8;
  if (t.includes("JSON") || t.includes("JSONB")) return 128;
  if (t.includes("TEXT")) return 64;
  
  const varcharMatch = t.match(/VARCHAR\((\d+)\)/i);
  if (varcharMatch) {
    return Math.min(parseInt(varcharMatch[1], 10), 64);
  }
  return 8;
}

export function parseSqlDdl(rawDdl: string, dialect: SqlDialect = "PostgreSQL"): DatabaseSchema {
  const tablesMap = new Map<string, TableNodeData>();
  const relations: TableRelation[] = [];

  // Remove comments: single-line (-- or #) and multi-line (/* ... */)
  const cleanSql = rawDdl
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "")
    .replace(/#.*$/gm, "");

  // 1. Match CREATE TABLE statements
  // Handles CREATE TABLE [IF NOT EXISTS] name ( ... );
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_"`\.\[\]]+)\s*\(([\s\S]*?)\)(?:\s*;|\s*ENGINE|\s*WITH|\s*$)/gi;
  let tableMatch: RegExpExecArray | null;

  let tableIndex = 0;

  while ((tableMatch = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = tableMatch[1];
    const body = tableMatch[2];
    const tableName = cleanIdentifier(rawTableName);
    if (!tableName) continue;

    const columns: ColumnDefinition[] = [];
    const tableIndexes: TableIndex[] = [];
    const primaryKeyCols = new Set<string>();

    // Split body into comma-separated lines (ignoring commas inside parentheses)
    const lines = splitTableBody(body);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for Table-level PRIMARY KEY constraint
      // e.g. PRIMARY KEY (id, user_id) or CONSTRAINT pk_users PRIMARY KEY (id)
      const pkMatch = trimmed.match(/(?:CONSTRAINT\s+[a-zA-Z0-9_"`]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkList = pkMatch[1].split(",").map((c) => cleanIdentifier(c));
        pkList.forEach((col) => primaryKeyCols.add(col));
        continue;
      }

      // Check for Table-level FOREIGN KEY constraint
      // e.g. [CONSTRAINT fk_name] FOREIGN KEY (user_id) REFERENCES users(id) [ON DELETE CASCADE]
      const fkMatch = trimmed.match(
        /(?:CONSTRAINT\s+([a-zA-Z0-9_"`]+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_"`\.\[\]]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+([A-Za-z\s]+))?(?:\s+ON\s+UPDATE\s+([A-Za-z\s]+))?/i
      );
      if (fkMatch) {
        const sourceCols = fkMatch[2].split(",").map((c) => cleanIdentifier(c));
        const targetTable = cleanIdentifier(fkMatch[3]);
        const targetCols = fkMatch[4].split(",").map((c) => cleanIdentifier(c));
        const onDelete = fkMatch[5]?.trim();
        const onUpdate = fkMatch[6]?.trim();

        for (let i = 0; i < sourceCols.length; i++) {
          const sCol = sourceCols[i];
          const tCol = targetCols[i] || targetCols[0];

          relations.push({
            id: `rel_${tableName}_${sCol}_${targetTable}_${tCol}`,
            sourceTable: tableName,
            sourceColumn: sCol,
            targetTable,
            targetColumn: tCol,
            cardinality: "1:N",
            onDelete,
            onUpdate,
          });
        }
        continue;
      }

      // Check for Table-level UNIQUE constraint
      const uniqueMatch = trimmed.match(/(?:CONSTRAINT\s+[a-zA-Z0-9_"`]+\s+)?UNIQUE\s*\(([^)]+)\)/i);
      if (uniqueMatch) {
        const uCols = uniqueMatch[1].split(",").map((c) => cleanIdentifier(c));
        tableIndexes.push({
          name: `uq_${tableName}_${uCols.join("_")}`,
          columns: uCols,
          isUnique: true,
        });
        continue;
      }

      // Check for Table-level CHECK constraint or other noise
      if (/^(?:CONSTRAINT\s+[a-zA-Z0-9_"`]+\s+)?CHECK\s*\(/i.test(trimmed)) {
        continue;
      }

      // Otherwise, parse as Column Definition
      // e.g. "user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE"
      const colDef = parseColumnLine(trimmed, tableName, relations);
      if (colDef) {
        columns.push(colDef);
      }
    }

    // Apply primary keys detected in table constraints
    for (const col of columns) {
      if (primaryKeyCols.has(col.name)) {
        col.isPrimaryKey = true;
        col.isNullable = false;
      }
    }

    // Estimate row size in bytes
    const estimatedRowSize = columns.reduce((acc, col) => acc + estimateColumnByteSize(col.type), 0);

    const palette = COLOR_PALETTE[tableIndex % COLOR_PALETTE.length];

    tablesMap.set(tableName, {
      id: tableName,
      name: tableName,
      columns,
      indexes: tableIndexes,
      position: { x: 0, y: 0 },
      color: palette.border,
      category: categorizeTable(tableName),
      estimatedRowSize,
    });

    tableIndex++;
  }

  // 2. Match standalone ALTER TABLE ADD CONSTRAINT FOREIGN KEY
  // e.g. ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  const alterFkRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?([a-zA-Z0-9_"`\.\[\]]+)\s+ADD\s+(?:CONSTRAINT\s+[a-zA-Z0-9_"`]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_"`\.\[\]]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+([A-Za-z\s]+))?(?:\s+ON\s+UPDATE\s+([A-Za-z\s]+))?/gi;
  let alterMatch: RegExpExecArray | null;

  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const sourceTable = cleanIdentifier(alterMatch[1]);
    const sourceCols = alterMatch[2].split(",").map((c) => cleanIdentifier(c));
    const targetTable = cleanIdentifier(alterMatch[3]);
    const targetCols = alterMatch[4].split(",").map((c) => cleanIdentifier(c));
    const onDelete = alterMatch[5]?.trim();
    const onUpdate = alterMatch[6]?.trim();

    for (let i = 0; i < sourceCols.length; i++) {
      const sCol = sourceCols[i];
      const tCol = targetCols[i] || targetCols[0];

      // Mark foreign key on table column definition
      const sourceTableNode = tablesMap.get(sourceTable);
      if (sourceTableNode) {
        const col = sourceTableNode.columns.find((c) => c.name === sCol);
        if (col) {
          col.isForeignKey = true;
          col.foreignKeyRef = { table: targetTable, column: tCol };
        }
      }

      relations.push({
        id: `rel_${sourceTable}_${sCol}_${targetTable}_${tCol}`,
        sourceTable,
        sourceColumn: sCol,
        targetTable,
        targetColumn: tCol,
        cardinality: "1:N",
        onDelete,
        onUpdate,
      });
    }
  }

  // 3. Match CREATE [UNIQUE] INDEX
  // e.g. CREATE INDEX idx_orders_user ON orders(user_id);
  const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_"`]+)\s+ON\s+([a-zA-Z0-9_"`\.\[\]]+)\s*(?:USING\s+[a-zA-Z0-9_]+\s*)?\(([^)]+)\)/gi;
  let idxMatch: RegExpExecArray | null;

  while ((idxMatch = indexRegex.exec(cleanSql)) !== null) {
    const isUnique = !!idxMatch[1];
    const indexName = cleanIdentifier(idxMatch[2]);
    const tableName = cleanIdentifier(idxMatch[3]);
    const cols = idxMatch[4].split(",").map((c) => cleanIdentifier(c.replace(/\s+(ASC|DESC|NULLS\s+FIRST|NULLS\s+LAST)/gi, "")));

    const table = tablesMap.get(tableName);
    if (table) {
      table.indexes.push({
        name: indexName,
        columns: cols,
        isUnique,
      });
    }
  }

  // 4. Refine Cardinality (1:1, 1:N, N:M)
  const tables = Array.from(tablesMap.values());
  for (const rel of relations) {
    const sourceTable = tablesMap.get(rel.sourceTable);
    if (!sourceTable) continue;

    const sCol = sourceTable.columns.find((c) => c.name === rel.sourceColumn);
    if (sCol) {
      sCol.isForeignKey = true;
      sCol.foreignKeyRef = { table: rel.targetTable, column: rel.targetColumn };
      if (sCol.isPrimaryKey || sCol.isUnique) {
        rel.cardinality = "1:1";
      }
    }

    // Check for junction table (N:M pattern)
    const fkCols = sourceTable.columns.filter((c) => c.isForeignKey);
    const pkCols = sourceTable.columns.filter((c) => c.isPrimaryKey);
    if (fkCols.length >= 2 && sourceTable.columns.length <= 5) {
      const isJunction = fkCols.every((c) => pkCols.some((pk) => pk.name === c.name)) || sourceTable.columns.length <= 4;
      if (isJunction) {
        rel.cardinality = "N:M";
      }
    }
  }

  // 5. Apply auto layout positions
  const positionedTables = applyLayout(tables, relations, "hierarchical");

  return {
    tables: positionedTables,
    relations,
    dialect,
    rawDdl,
    parsedAt: new Date().toISOString(),
  };
}

function splitTableBody(body: string): string[] {
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < body.length; i++) {
    const char = body[i];

    if (!inQuotes && (char === '"' || char === "'" || char === "`")) {
      inQuotes = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (inQuotes && char === quoteChar) {
      inQuotes = false;
      current += char;
      continue;
    }

    if (!inQuotes) {
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;
      else if (char === "," && parenDepth === 0) {
        result.push(current);
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current);
  }

  return result;
}

function parseColumnLine(line: string, currentTable: string, relations: TableRelation[]): ColumnDefinition | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 2) return null;

  const rawName = tokens[0];
  const name = cleanIdentifier(rawName);
  if (!name || isReservedSqlKeyword(name)) return null;

  // Reconstruct the rest of the line
  const rest = line.substring(line.indexOf(tokens[1])).trim();

  let isPrimaryKey = false;
  let isUnique = false;
  let isNullable = true;
  let isForeignKey = false;
  let defaultValue: string | undefined;
  let foreignKeyRef: { table: string; column: string } | undefined;

  // Check PRIMARY KEY
  if (/\bPRIMARY\s+KEY\b/i.test(rest)) {
    isPrimaryKey = true;
    isNullable = false;
  }

  // Check NOT NULL
  if (/\bNOT\s+NULL\b/i.test(rest)) {
    isNullable = false;
  } else if (/\bNULL\b/i.test(rest) && !/\bNOT\s+NULL\b/i.test(rest)) {
    isNullable = true;
  }

  // Check UNIQUE
  if (/\bUNIQUE\b/i.test(rest)) {
    isUnique = true;
  }

  // Check DEFAULT
  const defaultMatch = rest.match(/\bDEFAULT\s+([^,]+)/i);
  if (defaultMatch) {
    defaultValue = defaultMatch[1].trim();
  }

  // Check inline REFERENCES
  // e.g. REFERENCES users(id) ON DELETE CASCADE
  const refMatch = rest.match(/\bREFERENCES\s+([a-zA-Z0-9_"`\.\[\]]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+([A-Za-z\s]+))?(?:\s+ON\s+UPDATE\s+([A-Za-z\s]+))?/i);
  if (refMatch) {
    isForeignKey = true;
    const targetTable = cleanIdentifier(refMatch[1]);
    const targetColumn = cleanIdentifier(refMatch[2]);
    foreignKeyRef = { table: targetTable, column: targetColumn };

    relations.push({
      id: `rel_${currentTable}_${name}_${targetTable}_${targetColumn}`,
      sourceTable: currentTable,
      sourceColumn: name,
      targetTable,
      targetColumn,
      cardinality: "1:N",
      onDelete: refMatch[3]?.trim(),
      onUpdate: refMatch[4]?.trim(),
    });
  }

  // Extract Datatype: take the type part before constraints
  let typePart = rest
    .replace(/\bPRIMARY\s+KEY\b/gi, "")
    .replace(/\bNOT\s+NULL\b/gi, "")
    .replace(/\bNULL\b/gi, "")
    .replace(/\bUNIQUE\b/gi, "")
    .replace(/\bAUTO_INCREMENT\b/gi, "")
    .replace(/\bDEFAULT\s+[^,]+/gi, "")
    .replace(/\bREFERENCES\s+[\s\S]+/gi, "")
    .replace(/\bCHECK\s*\([^)]*\)/gi, "")
    .trim();

  // Normalize type
  const type = typePart || "VARCHAR";

  return {
    name,
    type,
    isPrimaryKey,
    isForeignKey,
    isUnique,
    isNullable,
    defaultValue,
    foreignKeyRef,
  };
}

function isReservedSqlKeyword(word: string): boolean {
  const upper = word.toUpperCase();
  return ["CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "INDEX", "KEY"].includes(upper);
}

function categorizeTable(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("user") || n.includes("auth") || n.includes("account") || n.includes("role") || n.includes("permission") || n.includes("tenant")) {
    return "Identity & Auth";
  }
  if (n.includes("order") || n.includes("payment") || n.includes("invoice") || n.includes("billing") || n.includes("subscription") || n.includes("wallet")) {
    return "Billing & Commerce";
  }
  if (n.includes("product") || n.includes("item") || n.includes("inventory") || n.includes("category") || n.includes("sku")) {
    return "Catalog & Assets";
  }
  if (n.includes("log") || n.includes("audit") || n.includes("metric") || n.includes("history") || n.includes("event")) {
    return "Telemetry & Audit";
  }
  if (n.includes("patient") || n.includes("doctor") || n.includes("appointment") || n.includes("clinic") || n.includes("record")) {
    return "Clinical & Care";
  }
  return "Core Domain";
}

// Layout calculation algorithms
export function applyLayout(
  tables: TableNodeData[],
  relations: TableRelation[],
  mode: CanvasLayoutMode = "hierarchical"
): TableNodeData[] {
  if (!tables.length) return [];

  const CARD_WIDTH = 290;
  const CARD_GAP_X = 140;
  const CARD_GAP_Y = 60;

  if (mode === "grid") {
    const cols = Math.ceil(Math.sqrt(tables.length * 1.6));
    return tables.map((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const estHeight = 70 + t.columns.length * 30;
      return {
        ...t,
        position: {
          x: 100 + col * (CARD_WIDTH + CARD_GAP_X),
          y: 100 + row * (Math.max(estHeight, 260) + CARD_GAP_Y),
        },
      };
    });
  }

  if (mode === "compact") {
    const cols = Math.min(3, tables.length);
    const colHeights = new Array(cols).fill(80);

    return tables.map((t, idx) => {
      const targetCol = idx % cols;
      const x = 80 + targetCol * (CARD_WIDTH + 80);
      const y = colHeights[targetCol];
      const cardHeight = 80 + t.columns.length * 28;
      colHeights[targetCol] += cardHeight + 40;
      return {
        ...t,
        position: { x, y },
      };
    });
  }

  // Hierarchical / DAG layout
  // 1. Calculate incoming dependencies (in-degree) and outgoing relations
  const inDegree = new Map<string, number>();
  const outMap = new Map<string, string[]>();

  tables.forEach((t) => {
    inDegree.set(t.name, 0);
    outMap.set(t.name, []);
  });

  relations.forEach((rel) => {
    // sourceTable has FK pointing to targetTable -> targetTable is the parent/dependency
    if (inDegree.has(rel.sourceTable)) {
      inDegree.set(rel.sourceTable, (inDegree.get(rel.sourceTable) || 0) + 1);
    }
    if (outMap.has(rel.targetTable)) {
      outMap.get(rel.targetTable)!.push(rel.sourceTable);
    }
  });

  // Assign tiers (Level 0 = tables that are dependencies / roots)
  const tiers: string[][] = [];
  const visited = new Set<string>();

  // Roots: inDegree 0
  const roots = tables.filter((t) => (inDegree.get(t.name) || 0) === 0).map((t) => t.name);
  if (roots.length > 0) {
    tiers.push(roots);
    roots.forEach((r) => visited.add(r));
  } else {
    // If circular, pick first table
    tiers.push([tables[0].name]);
    visited.add(tables[0].name);
  }

  while (visited.size < tables.length) {
    const currentTier = tiers[tiers.length - 1];
    const nextTier: string[] = [];

    currentTier.forEach((parent) => {
      const children = outMap.get(parent) || [];
      children.forEach((child) => {
        if (!visited.has(child) && !nextTier.includes(child)) {
          nextTier.push(child);
          visited.add(child);
        }
      });
    });

    if (nextTier.length === 0) {
      // Add any remaining unvisited tables
      const remaining = tables.filter((t) => !visited.has(t.name));
      if (remaining.length > 0) {
        tiers.push(remaining.map((r) => r.name));
        remaining.forEach((r) => visited.add(r.name));
      }
      break;
    }

    tiers.push(nextTier);
  }

  // Calculate coordinates based on tiers
  const tablePosMap = new Map<string, { x: number; y: number }>();

  tiers.forEach((tier, tierIdx) => {
    let currentY = 100;
    const tierX = 100 + tierIdx * (CARD_WIDTH + CARD_GAP_X);

    tier.forEach((tableName) => {
      const tableData = tables.find((t) => t.name === tableName);
      const estHeight = 80 + (tableData ? tableData.columns.length * 30 : 200);
      tablePosMap.set(tableName, { x: tierX, y: currentY });
      currentY += estHeight + CARD_GAP_Y;
    });
  });

  return tables.map((t) => ({
    ...t,
    position: tablePosMap.get(t.name) || { x: 100, y: 100 },
  }));
}
