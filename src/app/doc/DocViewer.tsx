'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Terminal,
  Key,
  Film,
  Tv,
  Clock,
  Layers,
  Search,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Info,
  AlertTriangle,
  Lightbulb,
  Zap,
} from 'lucide-react';

export interface DocItem {
  slug: string;
  title: string;
  filename: string;
  content: string;
}

interface DocViewerProps {
  docs: DocItem[];
  initialSlug?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  overview: <BookOpen className="w-4 h-4" />,
  'curl-cheatsheet': <Terminal className="w-4 h-4 text-emerald-400" />,
  authentication: <Key className="w-4 h-4 text-amber-400" />,
  movies: <Film className="w-4 h-4 text-blue-400" />,
  series: <Tv className="w-4 h-4 text-orange-400" />,
  'last-seen-imdb': <Clock className="w-4 h-4 text-purple-400" />,
  'library-utilities': <Layers className="w-4 h-4 text-indigo-400" />,
  advanced: <Zap className="w-4 h-4 text-amber-400" />,
};

export default function DocViewer({ docs, initialSlug }: DocViewerProps) {
  const [activeSlug, setActiveSlug] = useState<string>(() => {
    if (initialSlug && docs.some((d) => d.slug === initialSlug)) {
      return initialSlug;
    }
    return docs[0]?.slug || 'overview';
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeDoc = useMemo(() => {
    return docs.find((d) => d.slug === activeSlug) || docs[0];
  }, [docs, activeSlug]);

  const filteredDocs = useMemo(() => {
    if (!searchFilter.trim()) return docs;
    const q = searchFilter.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
    );
  }, [docs, searchFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Switch to another doc if a link within markdown references it (e.g. ./MOVIES_API.md)
  const handleDocLinkClick = (href: string) => {
    const filename = href.replace(/^\.\//, '').split('#')[0];
    const match = docs.find((d) => d.filename.toLowerCase() === filename.toLowerCase());
    if (match) {
      setActiveSlug(match.slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Library</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                API Documentation
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                v1.0 (REST)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/api-keys"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Get API Key</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar / Doc Index */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 transition outline-none"
            />
          </div>

          {/* Navigation Links */}
          <nav className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              API Reference Guides
            </p>
            {filteredDocs.map((doc) => {
              const isActive = doc.slug === activeDoc?.slug;
              return (
                <button
                  key={doc.slug}
                  onClick={() => {
                    setActiveSlug(doc.slug);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {ICON_MAP[doc.slug] || <BookOpen className="w-4 h-4" />}
                    <span className="truncate">{doc.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Quick Info Box */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Base URL</span>
            </div>
            <code className="block bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 select-all">
              http://localhost:3001
            </code>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All endpoints support CORS (<code className="text-slate-300">*</code>) and Bearer token auth.
            </p>
          </div>
        </aside>

        {/* Right Content Area: Markdown Renderer */}
        <main className="flex-1 min-w-0 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
          {activeDoc ? (
            <article className="prose prose-invert max-w-none">
              <MarkdownContent
                content={activeDoc.content}
                onLinkClick={handleDocLinkClick}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            </article>
          ) : (
            <div className="text-center py-16 text-slate-500 text-sm">
              No matching document found.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Markdown Renderer Component (Zero external dependencies)
// -------------------------------------------------------------

interface MarkdownContentProps {
  content: string;
  onLinkClick: (href: string) => boolean;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

function MarkdownContent({ content, onLinkClick, onCopy, copiedId }: MarkdownContentProps) {
  // Parse markdown into high-level blocks
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const content = <InlineText text={block.text} onLinkClick={onLinkClick} />;
          if (block.level === 1) {
            return (
              <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pb-3 border-b border-slate-800 mb-6 mt-2">
                {content}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={idx} className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-6 pb-2 border-b border-slate-800/80 mt-8 mb-4 flex items-center gap-2">
                {content}
              </h2>
            );
          }
          if (block.level === 3) {
            return (
              <h3 key={idx} className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight pt-4 mt-6 mb-2">
                {content}
              </h3>
            );
          }
          return (
            <h4 key={idx} className="text-sm sm:text-base font-semibold text-slate-200 mt-4 mb-2">
              {content}
            </h4>
          );
        }

        if (block.type === 'code') {
          const codeId = `code-block-${idx}`;
          const isCopied = copiedId === codeId;
          return (
            <div key={idx} className="relative group my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
                <span className="font-mono text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  {block.language || 'text'}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(block.code, codeId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium text-[11px]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-200 leading-relaxed selection:bg-amber-500/30">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'alert') {
          const alertTheme = {
            NOTE: {
              border: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
              icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
              title: 'Note',
            },
            TIP: {
              border: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
              icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
              title: 'Tip',
            },
            WARNING: {
              border: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
              icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
              title: 'Warning',
            },
            IMPORTANT: {
              border: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200',
              icon: <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />,
              title: 'Important',
            },
          }[block.alertType] || {
            border: 'border-slate-700 bg-slate-800/40 text-slate-300',
            icon: <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
            title: 'Info',
          };

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-xl border my-4 ${alertTheme.border}`}
            >
              {alertTheme.icon}
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block mb-0.5">{alertTheme.title}:</span>
                <InlineText text={block.text} onLinkClick={onLinkClick} />
              </div>
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-slate-800 shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-200 font-semibold">
                    {block.headers.map((h, i) => (
                      <th key={i} className="px-4 py-3">
                        <InlineText text={h} onLinkClick={onLinkClick} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono text-[11px]">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40 transition">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 text-slate-300">
                          <InlineText text={cell} onLinkClick={onLinkClick} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={idx}
              className={`my-3 space-y-1 text-xs text-slate-300 pl-6 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="leading-relaxed">
                  <InlineText text={item} onLinkClick={onLinkClick} />
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'hr') {
          return <hr key={idx} className="my-8 border-slate-800/80" />;
        }

        return (
          <p key={idx} className="my-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <InlineText text={block.text} onLinkClick={onLinkClick} />
          </p>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// Markdown Inline Parser & Highlighter
// -------------------------------------------------------------

function InlineText({
  text,
  onLinkClick,
}: {
  text: string;
  onLinkClick: (href: string) => boolean;
}) {
  // Regex tokenizes markdown links, inline code, bold, italic, and HTTP method badges
  const parts = useMemo(() => {
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern matching inline elements
    // 1. Link [label](url)
    // 2. Code `code`
    // 3. Bold **text**
    // 4. HTTP Method tags GET/POST/PUT/DELETE/PATCH
    const regex = /(\[.*?\]\(.*?\)|\`.*?\`|\*\*.*?\*\*|\b(?:GET|POST|PUT|PATCH|DELETE)\b)/g;

    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(remaining.substring(lastIndex, match.index));
      }

      const matchText = match[0];

      if (matchText.startsWith('[') && matchText.includes('](')) {
        const linkMatch = matchText.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          const isDocRelative = url.endsWith('.md') || url.startsWith('./');
          tokens.push(
            <a
              key={keyIdx++}
              href={url}
              onClick={(e) => {
                if (isDocRelative && onLinkClick(url)) {
                  e.preventDefault();
                }
              }}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium transition inline-flex items-center gap-0.5"
              target={isDocRelative ? undefined : '_blank'}
              rel={isDocRelative ? undefined : 'noreferrer'}
            >
              <span>{label}</span>
              {!isDocRelative && <ExternalLink className="w-3 h-3 inline" />}
            </a>
          );
        } else {
          tokens.push(matchText);
        }
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        const codeContent = matchText.slice(1, -1);
        tokens.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700/60"
          >
            {codeContent}
          </code>
        );
      } else if (matchText.startsWith('**') && matchText.endsWith('**')) {
        tokens.push(
          <strong key={keyIdx++} className="font-semibold text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (/^(GET|POST|PUT|PATCH|DELETE)$/.test(matchText)) {
        const methodBadges: Record<string, string> = {
          GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        };
        tokens.push(
          <span
            key={keyIdx++}
            className={`inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border uppercase tracking-wider mx-0.5 ${
              methodBadges[matchText] || 'bg-slate-800 text-white'
            }`}
          >
            {matchText}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      tokens.push(remaining.substring(lastIndex));
    }

    return tokens;
  }, [text, onLinkClick]);

  return <>{parts}</>;
}

// -------------------------------------------------------------
// Markdown Block Parsing Helper
// -------------------------------------------------------------

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'alert'; alertType: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

function parseMarkdownBlocks(raw: string): Block[] {
  const lines = raw.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal Rule
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Code Block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      });
      i++; // Skip closing ```
      continue;
    }

    // Alert Callout (e.g. > [!NOTE] or > [!WARNING])
    if (line.startsWith('> [!')) {
      const match = line.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*(.*)$/i);
      const alertType = match ? match[1].toUpperCase() : 'NOTE';
      const textLines: string[] = match && match[2] ? [match[2]] : [];
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        textLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'alert',
        alertType,
        text: textLines.join(' '),
      });
      continue;
    }

    // Heading (#, ##, ###, ####)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Markdown Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|') && lines[i].endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
        const headers = parseRow(tableLines[0]);
        // line 1 is separator |:---|:---|
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({ type: 'table', headers, rows });
      }
      continue;
    }

    // Lists (unordered - or * or ordered 1.)
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (
        i < lines.length &&
        ((ordered && /^\s*\d+\.\s+/.test(lines[i])) ||
          (!ordered && /^\s*[-*]\s+/.test(lines[i])))
      ) {
        const itemText = ordered
          ? lines[i].replace(/^\s*\d+\.\s+/, '')
          : lines[i].replace(/^\s*[-*]\s+/, '');
        items.push(itemText);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> [!') &&
      !lines[i].startsWith('|') &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' '),
    });
  }

  return blocks;
}
