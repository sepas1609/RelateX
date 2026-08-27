import React from "react";
import {
  X,
  BookOpen,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  Table as TableIcon,
  Star,
  Activity,
} from "lucide-react";
import { ErdNotationMode } from "../types";

interface NotationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotation: ErdNotationMode;
  onSelectNotation: (notation: ErdNotationMode) => void;
}

interface NotationGuideItem {
  id: ErdNotationMode;
  name: string;
  creator: string;
  year: string;
  tagline: string;
  badgeColor: string;
  icon: string;
  primaryUseCases: string[];
  keySymbols: {
    symbol: string;
    meaning: string;
  }[];
  overview: string;
}

const NOTATION_GUIDES: NotationGuideItem[] = [
  {
    id: "crows_foot",
    name: "Crow's Foot Notation",
    creator: "Clive Finkelstein & James Martin",
    year: "1976 / 1981",
    tagline: "The industry standard for relational physical & logical database design",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    icon: "🦅",
    overview:
      "Crow's Foot notation represents entities as structured tables with divided compartments for primary keys, foreign keys, and regular columns. Relationships use three-pronged 'crow's feet' to indicate 'many' and cross-bars or circles to indicate mandatory ('1') or optional ('0') cardinality.",
    primaryUseCases: [
      "Physical relational schema modeling (PostgreSQL, MySQL, SQLite, Oracle)",
      "Database administration and SQL index optimization",
      "ORMs & backend schema migrations (Prisma, Drizzle, TypeORM, Django)",
    ],
    keySymbols: [
      { symbol: "|| (Cross bars)", meaning: "Mandatory Exactly One (1:1)" },
      { symbol: "o| (Circle + Bar)", meaning: "Zero or One (0:1 optional)" },
      { symbol: "|{ (Bar + Crow)", meaning: "Mandatory One or Many (1:N)" },
      { symbol: "o{ (Circle + Crow)", meaning: "Optional Zero or Many (0:N)" },
    ],
  },
  {
    id: "chen",
    name: "Chen's Notation (Classic ERD)",
    creator: "Dr. Peter Pin-Shan Chen",
    year: "1976",
    tagline: "The pioneering academic standard for conceptual entity-relationship modeling",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    icon: "🔷",
    overview:
      "Peter Chen's model separates concepts into distinct geometric shapes: Rectangles for Entities, Diamonds for Relationships, and Ellipses/Ovals for Attributes. It emphasizes semantic purity between entities before physical storage constraints are decided.",
    primaryUseCases: [
      "Conceptual domain analysis and academic database coursework",
      "Requirements gathering with non-technical business stakeholders",
      "Ontology and knowledge graph design",
    ],
    keySymbols: [
      { symbol: "Rectangle [ ]", meaning: "Strong Entity (Independent table)" },
      { symbol: "Double Rectangle [[ ]]", meaning: "Weak Entity (Dependent child table)" },
      { symbol: "Diamond < >", meaning: "Relationship with verb label (e.g. PLACES, BELONGS_TO)" },
      { symbol: "Oval ( ) with underline", meaning: "Primary Key Attribute" },
      { symbol: "Dashed Oval", meaning: "Foreign Key / Derived Attribute" },
    ],
  },
  {
    id: "uml",
    name: "UML Class & IDEF1X Diagram",
    creator: "OMG (Object Management Group) & US Air Force (IDEF1X)",
    year: "1985 / 1997",
    tagline: "Standard for Object-Relational Mapping (ORM) and domain-driven design",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    icon: "📐",
    overview:
      "UML Class diagrams represent database tables as software classes with «entity» stereotypes, explicit visibility indicators (+ for public columns, # for foreign keys), distinct primary key compartments, and operations/indexes sections.",
    primaryUseCases: [
      "Domain Driven Design (DDD) and Object-Oriented software architectures",
      "Mapping database schemas to TypeScript, Java, C#, or Python entity classes",
      "Enterprise software integration specifications",
    ],
    keySymbols: [
      { symbol: "«entity»", meaning: "Stereotype indicating persistent relational entity" },
      { symbol: "+ col: type {PK}", meaning: "Public Primary Key attribute with constraint" },
      { symbol: "# col: type {FK}", meaning: "Protected Foreign Key relationship attribute" },
      { symbol: "0..*, 1..1, 1..*", meaning: "Multiplicity range indicators" },
    ],
  },
  {
    id: "bachman",
    name: "Bachman Data Structure Diagram (DSD)",
    creator: "Charles W. Bachman (Turing Award 1973)",
    year: "1969",
    tagline: "Navigational data model emphasizing record sets and graph pointer links",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    icon: "🕸️",
    overview:
      "Charles Bachman's diagram standard represents database entities as Record Types with 1:N Set links. Arrows indicate navigational paths from Owner Records to Member Records, forming the foundation of network and graph databases.",
    primaryUseCases: [
      "Navigational data modeling, CODASYL systems, and document graphs",
      "Mapping hierarchical ownership structures (e.g. Company -> Department -> Employees)",
      "High-throughput transactional graph link inspection",
    ],
    keySymbols: [
      { symbol: "Record Box [R]", meaning: "Named Record Type definition" },
      { symbol: "Owner Record", meaning: "Parent 1-side entity governing the set" },
      { symbol: "Member Record", meaning: "Child N-side entity in the collection" },
      { symbol: "Navigational Arrow", meaning: "Directed 1:N pointer chain link" },
    ],
  },
  {
    id: "star_snowflake",
    name: "Star & Snowflake Dimensional Model",
    creator: "Dr. Ralph Kimball",
    year: "1996",
    tagline: "The gold standard for Data Warehousing, OLAP, and Business Intelligence",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: "⭐",
    overview:
      "Kimball dimensional modeling organizes analytical data into central Fact Tables (holding numeric measurement metrics like revenue, quantity, duration) surrounded by Dimension Tables (giving business context like Customer, Product, Date, Store).",
    primaryUseCases: [
      "Modern Data Stacks (Snowflake, BigQuery, ClickHouse, Databricks, Redshift)",
      "Business Intelligence and reporting dashboards (PowerBI, Looker, Tableau)",
      "ETL / ELT data pipeline structuring and dimensional grain definition",
    ],
    keySymbols: [
      { symbol: "⭐ Fact Hub", meaning: "High-volume table with numerical measures & FKs" },
      { symbol: "❄️ Dimension", meaning: "Contextual lookup table with hierarchical attributes" },
      { symbol: "Σ Measures", meaning: "Additive/semi-additive numeric calculations" },
      { symbol: "Surrogate Key (SK)", meaning: "Synthetic integer sequence primary key" },
    ],
  },
];

export const NotationGuideModal: React.FC<NotationGuideModalProps> = ({
  isOpen,
  onClose,
  currentNotation,
  onSelectNotation,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="notation-guide-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>ER Diagram Visualization Guide</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  5 Notation Standards
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore and switch between Crow's Foot, Peter Chen's ER, UML Class, Bachman Network, and Kimball Star Schema.
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

        {/* Content list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {NOTATION_GUIDES.map((item) => {
            const isCurrent = currentNotation === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-slate-850/90 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-semibold ${item.badgeColor}`}>
                          {item.creator} ({item.year})
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            CURRENT ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectNotation(item.id);
                      onClose();
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      isCurrent
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500"
                    }`}
                  >
                    {isCurrent ? "Active View" : "Switch to this Notation"}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {item.overview}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  {/* Left: Key Symbols */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] uppercase font-mono font-semibold text-slate-400 block">
                      Notation Symbols & Cardinalities:
                    </span>
                    <div className="space-y-1">
                      {item.keySymbols.map((sym, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800"
                        >
                          <span className="font-bold text-cyan-400 shrink-0">{sym.symbol}</span>
                          <span className="text-slate-400 font-sans text-[11px]">&rarr; {sym.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Best Use Cases */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] uppercase font-mono font-semibold text-slate-400 block">
                      Best Suited For:
                    </span>
                    <ul className="space-y-1">
                      {item.primaryUseCases.map((useCase, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-[11.5px] text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs text-slate-400">
          <span>Tip: You can drag and position nodes freely in any visualization notation mode.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
