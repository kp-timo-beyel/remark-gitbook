/**
 * Transforms GitBook hint blocks into Docusaurus admonitions.
 *
 * Input:
 * ```
 * {% hint style="info" %}
 * Some content here.
 * {% endhint %}
 * ```
 *
 * Output:
 * ```
 * :::info
 * Some content here.
 * :::
 * ```
 *
 * Style mapping:
 * - info    → info
 * - warning → warning
 * - danger  → danger
 * - success → tip
 */

const GITBOOK_STYLE_TO_DOCUSAURUS: Record<string, string> = {
  info: "info",
  warning: "warning",
  danger: "danger",
  success: "tip",
};

// Match `{% hint style="..." %}` blocks. Allow extra attributes (e.g.
// `icon="..."`) before or after `style=` — GitBook permits these in real
// content even though the simplest form only has `style`.
const HINT_BLOCK_RE =
  /{% hint\s+[^%]*?style="([^"]*)"[^%]*%}\s*\n([\s\S]*?)\n\s*{% endhint %}/g;

export function transformHints(markdown: string): string {
  return markdown.replace(HINT_BLOCK_RE, (_match, style: string, content: string) => {
    const admonitionType =
      GITBOOK_STYLE_TO_DOCUSAURUS[style] ?? "info";
    const trimmedContent = content.trimEnd();
    return `:::${admonitionType}\n${trimmedContent}\n:::`;
  });
}
