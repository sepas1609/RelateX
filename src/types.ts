export type SqlDialect =
  | "PostgreSQL"
  | "MySQL"
  | "SQLite"
  | "Snowflake"
  | "SQL Server";

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  defaultValue?: string;
  comment?: string;
  foreignKeyRef?: {
    table: string;
    column: string;
  };
}

export interface TableIndex {
  name: string;
  columns: string[];
  isUnique: boolean;
  type?: string;
}

export interface TableNodeData {
  id: string;
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
  indexes: TableIndex[];
  position: { x: number; y: number };
  color?: string;
  category?: string;
  estimatedRowSize?: number; // bytes
}

export interface TableRelation {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: "1:1" | "1:N" | "N:M";
  onDelete?: string;
  onUpdate?: string;
}

export interface DatabaseSchema {
  tables: TableNodeData[];
  relations: TableRelation[];
  dialect: SqlDialect;
  rawDdl: string;
  parsedAt: string;
}

export interface MissingIndexItem {
  table: string;
  columns: string[];
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  impact: string;
  sql: string;
}

export interface CompositeIndexItem {
  table: string;
  columns: string[];
  reason: string;
  targetQueryPattern: string;
  sql: string;
}

export interface AntiPatternItem {
  table: string;
  issue: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
}

export interface NormalizationAnalysis {
  score: number;
  firstNormalForm: string;
  secondNormalForm: string;
  thirdNormalForm: string;
  recommendations: string;
}

export interface OptimizationReport {
  summary: string;
  healthScore: number;
  normalizationScore: number;
  estimatedQuerySpeedup: string;
  missingIndexes: MissingIndexItem[];
  compositeIndexes: CompositeIndexItem[];
  antiPatterns: AntiPatternItem[];
  orphanTables: string[];
  normalizationAnalysis: NormalizationAnalysis;
  sqlPatchScript: string;
}

export interface QueryPlanNode {
  id: string;
  nodeType: "Seq Scan" | "Index Scan" | "Index Only Scan" | "Hash Join" | "Nested Loop" | "Merge Join" | "Aggregate" | "Sort" | "CTE Scan" | "Filter" | "Limit";
  relationName?: string;
  indexName?: string;
  cost: number;
  rows: number;
  filterCondition?: string;
  isBottleneck?: boolean;
  bottleneckReason?: string;
  children?: QueryPlanNode[];
}

export interface QueryExplanationResult {
  summary: string;
  estimatedCost: number;
  estimatedSpeedup: string;
  bottlenecks: {
    type: "FULL_TABLE_SCAN" | "UNINDEXED_JOIN" | "EXPENSIVE_SORT" | "TEMP_FILE_USAGE" | "CARTESIAN_PRODUCT" | "INEFFICIENT_FILTER";
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    affectedTable?: string;
    remediation: string;
  }[];
  visualPlan: QueryPlanNode;
  stepByStepExecution: {
    step: number;
    title: string;
    description: string;
    involvedTables: string[];
  }[];
  indexImpact: {
    table: string;
    status: "USED" | "MISSING" | "SUBOPTIMAL";
    indexName?: string;
    columns: string[];
    recommendation: string;
  }[];
  optimizedSql: string;
  optimizationTechniques: string[];
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sqlSnippet?: string;
}

export type CanvasLayoutMode = "hierarchical" | "grid" | "force" | "compact";

export type ErdNotationMode =
  | "crows_foot"
  | "chen"
  | "uml"
  | "bachman"
  | "star_snowflake";

