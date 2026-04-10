/**
 * Fixes HTML constructs that are invalid in MDX.
 *
 * MDX uses JSX parsing, which requires:
 * - Void elements to be self-closing: `<br />`, `<img ... />`
 * - `class` → `className`
 * - No mismatched tags
 *
 * Content inside `<table>` blocks is treated specially:
 * - Kept as JSX-compatible HTML (not converted to markdown)
 * - `class` attributes → `className`
 * - Void elements self-closed
 *
 * Content outside tables:
 * - `<figure><img>` → markdown images
 * - `<pre><code>` → fenced code blocks
 * - `<code>` → backtick code
 * - `<strong>/<em>` → markdown bold/italic
 * - `<p>` tags removed
 */

// Figure blocks → markdown images
const FIGURE_RE =
  /<figure>\s*<img\s+([^>]*?)>\s*(?:<figcaption>(.*?)<\/figcaption>)?\s*<\/figure>/gi;

function parseFigure(_match: string, attrs: string, _caption: string): string {
  const src = attrs.match(/src="([^"]*)"/)?.[1] ?? "";
  const alt = attrs.match(/alt="([^"]*)"/)?.[1] ?? "";
  return `![${alt}](${src})`;
}

/**
 * Make an HTML table block JSX-compatible without converting to markdown.
 * This preserves the table structure (including <pre><code> inside <td>)
 * while fixing JSX compatibility issues.
 */
function fixTableForJsx(table: string): string {
  let result = table;

  // class → className (JSX requirement)
  result = result.replace(/\bclass="/g, 'className="');

  // Remove <p>, <strong>, <em> — these create paragraph/formatting boundaries
  // that break MDX parsing inside table cells.
  result = result.replace(/<\/?p>/gi, "");
  result = result.replace(/<\/?strong>/gi, "**");
  result = result.replace(/<\/?em>/gi, "*");

  // Remove <a> tags but keep the text content
  result = result.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, "$1");

  // Escape content inside <code> tags so MDX doesn't parse { } as expressions.
  // Matches <code> or <code className="..."> with content up to </code>.
  result = result.replace(
    /(<code(?:\s[^>]*)?>)([\s\S]*?)(<\/code>)/gi,
    (_m, open: string, content: string, close: string) => {
      const escaped = content
        .replace(/\{/g, "&#123;")
        .replace(/\}/g, "&#125;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "&#10;");
      return `${open}${escaped}${close}`;
    }
  );

  // Self-close void elements inside tables
  result = result.replace(/<br\s*(?<!\/)>/gi, "<br />");
  result = result.replace(/<img(\s[^>]*?)(?<!\/)>/gi, "<img$1 />");
  result = result.replace(/<hr\s*(?<!\/)>/gi, "<hr />");

  return result;
}

/**
 * Transform non-table HTML content for MDX compatibility.
 */
function fixNonTableHtml(content: string): string {
  let result = content;

  // Figures → markdown images
  result = result.replace(FIGURE_RE, parseFigure);

  // <pre><code> → fenced code blocks (extracts language from class)
  result = result.replace(
    /<pre(?:\s[^>]*)?>(?:\s*)<code(?:\s[^>]*)?>([\s\S]*?)<\/code>(?:\s*)<\/pre>/gi,
    (match, code: string) => {
      const langMatch = match.match(/class="(?:language|lang)-(\w+)"/);
      const lang = langMatch?.[1] ?? "";
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    }
  );

  // Inline <code> → backtick code
  result = result.replace(/<code(?:\s[^>]*)?>([^<]*?)<\/code>/gi, (_m, code: string) => `\`${code}\``);

  // HTML formatting tags → markdown equivalents
  result = result.replace(/<\/?p>/gi, "");
  result = result.replace(/<\/?strong>/gi, "**");
  result = result.replace(/<\/?em>/gi, "*");

  // Self-close void elements
  result = result.replace(/<img(\s[^>]*?)(?<!\/)>/gi, "<img$1 />");
  result = result.replace(/<br\s*(?<!\/)>/gi, "<br />");
  result = result.replace(/<hr\s*(?<!\/)>/gi, "<hr />");
  result = result.replace(/<input(\s[^>]*?)(?<!\/)>/gi, "<input$1 />");

  return result;
}

/**
 * Split content into table and non-table segments, apply appropriate
 * transformations to each, then rejoin.
 */
export function transformHtml(markdown: string): string {
  // Match <table>...</table> blocks (may span multiple lines)
  const TABLE_RE = /<table[\s>][\s\S]*?<\/table>/gi;

  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const tableRe = new RegExp(TABLE_RE.source, "gi");
  while ((match = tableRe.exec(markdown)) !== null) {
    // Process non-table content before this table
    if (match.index > lastIndex) {
      parts.push(fixNonTableHtml(markdown.slice(lastIndex, match.index)));
    }
    // Process the table block
    parts.push(fixTableForJsx(match[0]));
    lastIndex = match.index + match[0].length;
  }

  // Process remaining non-table content
  if (lastIndex < markdown.length) {
    parts.push(fixNonTableHtml(markdown.slice(lastIndex)));
  }

  return parts.join("");
}
