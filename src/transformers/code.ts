/**
 * Transforms GitBook `{% code %}` wrapper blocks.
 *
 * Input:
 * ```
 * {% code title="Example" lineNumbers="true" %}
 * ```swift
 * let x = 1
 * ```
 * {% endcode %}
 * ```
 *
 * Output:
 * ```swift title="Example"
 * let x = 1
 * ```
 *
 * If no inner code fence is found, the content is wrapped in a plain code block.
 */

// Match {% code ... %} ... {% endcode %}, capturing attributes and content
const CODE_BLOCK_RE =
  /{% code\s*([^%]*?)%}\s*\n([\s\S]*?)\n\s*{% endcode %}/g;

function parseAttrs(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrs)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

export function transformCode(markdown: string): string {
  return markdown.replace(CODE_BLOCK_RE, (_match, rawAttrs: string, content: string) => {
    const attrs = parseAttrs(rawAttrs);
    const title = attrs.title;

    // Check if content already has a code fence
    const fenceMatch = content.match(/^```(\w*)/);
    if (fenceMatch) {
      if (title) {
        // Add title attribute to existing fence
        return content.replace(/^```(\w*)/, `\`\`\`$1 title="${title}"`);
      }
      return content;
    }

    // No code fence — wrap content in one
    const lang = "text";
    const titleAttr = title ? ` title="${title}"` : "";
    return `\`\`\`${lang}${titleAttr}\n${content.trim()}\n\`\`\``;
  });
}
