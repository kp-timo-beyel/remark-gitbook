/**
 * Fixes MDX compatibility issues in GitBook Markdown.
 *
 * 1. Escapes lone `{` and `}` outside of code blocks/fences
 *    (MDX interprets these as JSX expressions)
 *
 * 2. Strips unsupported GitBook tags like `{% openapi-operation %}`,
 *    `{% swagger %}`, etc. that have no Docusaurus equivalent
 */

// GitBook tags with no Docusaurus equivalent — strip them entirely
const UNSUPPORTED_BLOCK_TAGS_RE =
  /{% (?:openapi-operation|swagger|swagger-description|swagger-parameter|swagger-response|embed|file)\s[^%]*%}/g;
const UNSUPPORTED_END_TAGS_RE =
  /{% (?:endswagger|endswagger-description|endswagger-parameter|endswagger-response|endembed|endfile)\s*%}/g;

export function transformMdxCompat(markdown: string): string {
  let result = markdown;

  // Strip unsupported GitBook block tags
  result = result.replace(UNSUPPORTED_BLOCK_TAGS_RE, "");
  result = result.replace(UNSUPPORTED_END_TAGS_RE, "");

  // Escape curly braces outside code blocks
  result = escapeCurlyBraces(result);

  return result;
}

/**
 * Escapes `{` and `}` that appear outside of code fences and inline code.
 * MDX treats these as JSX expression delimiters, causing parse errors
 * for things like `{location_id}` in URL paths.
 */
function escapeCurlyBraces(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    // Track code fences
    if (line.trimStart().startsWith("```")) {
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }

    // Don't touch content inside code fences
    if (inCodeFence) {
      result.push(line);
      continue;
    }

    // Skip lines that are JSX (our own output like <Tabs>, <TabItem>, etc.)
    const trimmed = line.trimStart();
    if (
      trimmed.startsWith("<") ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ")
    ) {
      result.push(line);
      continue;
    }

    // Escape braces outside of inline code spans
    const parts = line.split(/(`[^`]*`)/);
    const escaped = parts.map((part) => {
      // Don't touch inline code
      if (part.startsWith("`") && part.endsWith("`")) return part;
      // Escape lone braces
      return part.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
    });

    result.push(escaped.join(""));
  }

  return result.join("\n");
}
