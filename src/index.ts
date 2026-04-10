import type { Root } from "mdast";
import type { Plugin, Processor } from "unified";
import { transformHints } from "./transformers/hints.js";
import { transformTabs } from "./transformers/tabs.js";
import { transformStepper } from "./transformers/stepper.js";
import { transformHtml } from "./transformers/html.js";
import { transformCode } from "./transformers/code.js";
import { transformMdxCompat } from "./transformers/mdx-compat.js";
import { transformLinks } from "./transformers/links.js";

export interface RemarkGitbookOptions {
  /**
   * Enable or disable specific transformers.
   * All are enabled by default.
   */
  hints?: boolean;
  tabs?: boolean;
  stepper?: boolean;
  code?: boolean;
  html?: boolean;
  links?: boolean;
  mdxCompat?: boolean;
}

/**
 * Preprocess GitBook-flavored Markdown into Docusaurus-compatible syntax.
 * Can be used standalone without the unified pipeline.
 */
export function preprocess(
  markdown: string,
  options: RemarkGitbookOptions = {}
): string {
  const {
    hints = true,
    tabs = true,
    stepper = true,
    code = true,
    html = true,
    links = true,
    mdxCompat = true,
  } = options;

  let result = markdown;
  if (html) result = transformHtml(result);
  if (code) result = transformCode(result);
  if (hints) result = transformHints(result);
  if (tabs) result = transformTabs(result);
  if (stepper) result = transformStepper(result);
  if (links) result = transformLinks(result);
  // mdxCompat must run last — it escapes braces that other transformers may have produced
  if (mdxCompat) result = transformMdxCompat(result);
  return result;
}

/**
 * Remark plugin that converts GitBook-flavored Markdown syntax
 * to Docusaurus-compatible Markdown/MDX.
 *
 * Works by wrapping the parser so transformations happen BEFORE
 * the Markdown AST is built.
 *
 * Handles:
 * - `{% hint style="..." %}` → `:::info` / `:::warning` / etc.
 * - `{% tabs %}{% tab title="..." %}` → `<Tabs><TabItem>` JSX
 * - `{% stepper %}{% step %}` → `<Steps>` component
 */
const remarkGitbook: Plugin<[RemarkGitbookOptions?], Root> = function (
  this: Processor,
  options = {}
) {
  const opts = options;
  const originalParser = this.parser;

  if (originalParser) {
    // Wrap the existing parser to preprocess GitBook syntax
    // before the Markdown AST is built.
    this.parser = (doc, file) => {
      // Skip .mdx files — they contain valid JSX that should not be transformed.
      // GitBook syntax only appears in .md files.
      const filePath = typeof file === "string" ? "" : file.path || "";
      if (filePath.endsWith(".mdx")) {
        return originalParser(String(doc), file);
      }
      const transformed = preprocess(String(doc), opts);
      return originalParser(transformed, file);
    };
  }
};

export default remarkGitbook;
export { transformHints } from "./transformers/hints.js";
export { transformTabs } from "./transformers/tabs.js";
export { transformStepper } from "./transformers/stepper.js";
export { transformHtml } from "./transformers/html.js";
export { transformCode } from "./transformers/code.js";
export { transformMdxCompat } from "./transformers/mdx-compat.js";
export { transformLinks } from "./transformers/links.js";
