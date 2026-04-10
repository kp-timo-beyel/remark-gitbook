/**
 * Fixes MDX compatibility issues in GitBook Markdown.
 *
 * 1. Escapes lone `{` and `}` outside of code blocks/fences
 *    (MDX interprets these as JSX expressions)
 *
 * 2. Strips unsupported GitBook tags like `{% openapi-operation %}`,
 *    `{% swagger %}`, etc. that have no Docusaurus equivalent
 */

// OpenAPI operation tags → links to generated API pages
const OPENAPI_OPERATION_RE =
  /{% openapi-operation\s+spec="[^"]*"\s+path="([^"]*)"\s+method="([^"]*)"\s*%}/g;

// OpenAPI schema tags → info note
const OPENAPI_SCHEMAS_RE =
  /{% openapi-schemas\s[^%]*%}[\s\S]*?{% endopenapi-schemas %}/g;
const OPENAPI_SCHEMAS_SINGLE_RE =
  /{% openapi-schemas\s[^%]*%}/g;

// GitBook tags with no Docusaurus equivalent — strip them entirely
const UNSUPPORTED_BLOCK_TAGS_RE =
  /{% (?:swagger|swagger-description|swagger-parameter|swagger-response|embed|file)\s[^%]*%}/g;
const UNSUPPORTED_END_TAGS_RE =
  /{% (?:endswagger|endswagger-description|endswagger-parameter|endswagger-response|endembed|endfile)\s*%}/g;

export function transformMdxCompat(markdown: string): string {
  let result = markdown;

  // Replace OpenAPI operation tags with links to generated API docs
  result = result.replace(OPENAPI_OPERATION_RE, (_match, path: string, method: string) => {
    const methodUpper = method.toUpperCase();
    // Clean path for display: /srs2/subscription_receipts → /srs2/subscription_receipts
    const displayPath = path;
    return `> **${methodUpper}** \`${displayPath}\`\n>\n> See the [API Reference](/api/) for request/response details.`;
  });

  // Strip OpenAPI schema blocks (with or without end tag)
  result = result.replace(OPENAPI_SCHEMAS_RE, "");
  result = result.replace(OPENAPI_SCHEMAS_SINGLE_RE, "");

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
