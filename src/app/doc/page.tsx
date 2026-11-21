import fs from 'fs/promises';
import path from 'path';
import DocViewer, { DocItem } from './DocViewer';

export const metadata = {
  title: 'API Documentation | Watch Library',
  description: 'Interactive REST API documentation and cURL examples for Watch Library',
};

const DOC_CONFIG: { slug: string; title: string; filename: string }[] = [
  { slug: 'overview', title: 'Overview & Index', filename: 'README.md' },
  { slug: 'curl-cheatsheet', title: 'cURL Cheatsheet', filename: 'CURL_CHEATSHEET.md' },
  { slug: 'authentication', title: 'Auth & API Keys', filename: 'AUTHENTICATION_AND_KEYS.md' },
  { slug: 'movies', title: 'Movies API', filename: 'MOVIES_API.md' },
  { slug: 'series', title: 'Series API', filename: 'SERIES_API.md' },
  { slug: 'last-seen-imdb', title: 'Last Seen & IMDb', filename: 'LAST_SEEN_AND_IMDB_API.md' },
  { slug: 'library-utilities', title: 'Library & Utilities', filename: 'LIBRARY_AND_UTILITIES_API.md' },
  { slug: 'advanced', title: 'Stats, Search & Webhooks', filename: 'ADVANCED_ENDPOINTS.md' },
];

async function loadDocs(): Promise<DocItem[]> {
  const docsDir = path.join(process.cwd(), 'doc');
  const items: DocItem[] = [];

  for (const cfg of DOC_CONFIG) {
    try {
      const filePath = path.join(docsDir, cfg.filename);
      const content = await fs.readFile(filePath, 'utf-8');
      items.push({
        slug: cfg.slug,
        title: cfg.title,
        filename: cfg.filename,
        content,
      });
    } catch (err) {
      console.warn(`Could not read doc file ${cfg.filename}:`, err);
    }
  }

  return items;
}

export default async function DocPage() {
  const docs = await loadDocs();
  return <DocViewer docs={docs} initialSlug="overview" />;
}
