/**
 * Fixes MDX compatibility issues in GitBook Markdown.
 *
 * 1. Escapes lone `{` and `}` outside of code blocks/fences
 *    (MDX interprets these as JSX expressions)
 *
 * 2. Strips unsupported GitBook tags like `{% openapi-operation %}`,
 *    `{% swagger %}`, etc. that have no Docusaurus equivalent
 */

// OpenAPI operation blocks → links to generated API pages
// Matches the full block: {% openapi-operation ... %} ... {% endopenapi-operation %}
const OPENAPI_OPERATION_BLOCK_RE =
  /{% openapi-operation\s+spec="[^"]*"\s+path="([^"]*)"\s+method="([^"]*)"\s*%}[\s\S]*?{% endopenapi-operation %}/g;
// Also match standalone (without end tag)
const OPENAPI_OPERATION_SINGLE_RE =
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

/**
 * Resolve an OpenAPI path + method to the generated API doc page slug.
 * Falls back to undefined if no match is found.
 *
 * The docusaurus-plugin-openapi-docs generates slugs by combining
 * the operation's tag, method, and operationId. Since we don't have
 * the full spec at transform time, we use a static lookup for known endpoints.
 * Add entries here when new {% openapi-operation %} tags are used in GitBook docs.
 */
const API_SLUG_MAP: Record<string, string> = {
  "post:/srs2/subscription_receipts": "post-subscription-receipt-subscription-receipts",
  "post:/srs2/connection_token": "post-connection-token-connection-token",
  "get:/srs2/s2s/entitlements/{customer_id}": "gets-2-s-subscription-entitlements",
  "get:/ids2/locations": "get-instance-discovery-ids-locations",
  "get:/ids2/locations/{location_id}/instances": "get-instance-discovery-ids-locations-instances",
  "post:/iap": "send-iap-receipt",
  "post:/subscription_features": "post-features-subscription-entitlements",
};

function resolveApiSlug(path: string, method: string): string | undefined {
  return API_SLUG_MAP[`${method.toLowerCase()}:${path}`];
}

export function transformMdxCompat(markdown: string): string {
  let result = markdown;

  // Replace OpenAPI operation blocks with links to generated API endpoint pages
  function openapiReplace(_match: string, path: string, method: string): string {
    const methodUpper = method.toUpperCase();
    const slug = resolveApiSlug(path, method);
    const link = slug ? `/api/${slug}` : "/api/";
    const linkText = slug ? "View full API details" : "API Reference";
    return `> **${methodUpper}** \`${path}\`\n>\n> [${linkText}](${link})`;
  }
  result = result.replace(OPENAPI_OPERATION_BLOCK_RE, openapiReplace);
  // Also handle standalone tags (without end tag)
  result = result.replace(OPENAPI_OPERATION_SINGLE_RE, openapiReplace);

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

    // Escape braces outside of inline code spans. Use HTML entities rather
    // than backslash escapes (`\{`) because Docusaurus' MDX pipeline treats
    // a backslash-escaped brace as still triggering expression parsing in
    // some contexts (e.g. `\{n\}` inside a paragraph). HTML entities render
    // identically and are safe everywhere in MDX.
    const parts = line.split(/(`[^`]*`)/);
    const escaped = parts.map((part) => {
      // Don't touch inline code
      if (part.startsWith("`") && part.endsWith("`")) return part;
      return part.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
    });

    result.push(escaped.join(""));
  }

  return result.join("\n");
}
