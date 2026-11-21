/**
 * Deterministic O(N) CSV line parser.
 * Replaces catastrophic backtracking regular expressions to prevent ReDoS attacks.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function extractTitlesFromCsv(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse headers using safe parser
  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  let titleIndex = headers.findIndex(h => h === 'title' || h === 'name');

  if (titleIndex === -1) {
    titleIndex = 0; // Default to first column
  }

  const titles: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCsvLine(lines[i]).map(col => col.replace(/^["']|["']$/g, '').trim());
    if (columns[titleIndex]) {
      titles.push(columns[titleIndex]);
    }
  }

  // Deduplicate
  return Array.from(new Set(titles.filter(t => t.length > 0)));
}
