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

const HINT_BLOCK_RE =
  /{% hint style="([^"]*)" %}\s*\n([\s\S]*?)\n\s*{% endhint %}/g;

export function transformHints(markdown: string): string {
  return markdown.replace(HINT_BLOCK_RE, (_match, style: string, content: string) => {
    const admonitionType =
      GITBOOK_STYLE_TO_DOCUSAURUS[style] ?? "info";
    const trimmedContent = content.trimEnd();
    return `:::${admonitionType}\n${trimmedContent}\n:::`;
  });
}
