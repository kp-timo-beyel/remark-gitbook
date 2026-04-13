/**
 * Transforms GitBook tab blocks into Docusaurus Tabs/TabItem JSX.
 *
 * Input:
 * ```
 * {% tabs %}
 * {% tab title="Swift" %}
 * some swift code
 * {% endtab %}
 * {% tab title="Kotlin" %}
 * some kotlin code
 * {% endtab %}
 * {% endtabs %}
 * ```
 *
 * Output:
 * ```mdx
 * import Tabs from '@theme/Tabs';
 * import TabItem from '@theme/TabItem';
 *
 * <Tabs>
 * <TabItem value="swift" label="Swift">
 *
 * some swift code
 *
 * </TabItem>
 * <TabItem value="kotlin" label="Kotlin">
 *
 * some kotlin code
 *
 * </TabItem>
 * </Tabs>
 * ```
 *
 * The import statement is added once at the top of the file if any tabs are found.
 */

// Match an INNERMOST `{% tabs %}` block — one whose body contains no further
// `{% tabs %}` opening. By processing innermost first and looping until no
// matches remain, we correctly handle nested tabs without needing balanced
// regex (which JS regex can't express).
const TABS_BLOCK_RE =
  /{% tabs %}\s*\n((?:(?!{% tabs %})[\s\S])*?)\n\s*{% endtabs %}/g;
const TAB_RE = /{% tab title="([^"]*)" %}\s*\n([\s\S]*?)\n\s*{% endtab %}/g;

const TABS_IMPORT =
  `import Tabs from '@theme/Tabs';\nimport TabItem from '@theme/TabItem';`;

function titleToValue(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function convertTabsBlock(tabsContent: string): string {
  const usedValues = new Set<string>();
  const tabItems: string[] = [];

  let match: RegExpExecArray | null;
  // Reset lastIndex for the non-global usage within each block
  const tabRe = new RegExp(TAB_RE.source, "gs");

  while ((match = tabRe.exec(tabsContent)) !== null) {
    const title = match[1];
    const content = match[2].trimEnd();

    // Deduplicate values
    let value = titleToValue(title);
    if (!value) value = `tab-${usedValues.size + 1}`;
    let deduped = value;
    let counter = 1;
    while (usedValues.has(deduped)) {
      deduped = `${value}-${++counter}`;
    }
    usedValues.add(deduped);

    tabItems.push(
      `<TabItem value="${deduped}" label="${title}">\n\n${content}\n\n</TabItem>`
    );
  }

  if (tabItems.length === 0) return tabsContent;

  return `<Tabs>\n${tabItems.join("\n")}\n</Tabs>`;
}

export function transformTabs(markdown: string): string {
  let hasTabs = false;
  let result = markdown;
  // Loop because each pass only converts the innermost tabs (regex requires
  // captured body to not contain another `{% tabs %}`). Outer tabs become
  // matchable on the next pass once their inner blocks have been replaced.
  let prev: string;
  do {
    prev = result;
    result = result.replace(TABS_BLOCK_RE, (_match, content: string) => {
      hasTabs = true;
      return convertTabsBlock(content);
    });
  } while (result !== prev);

  if (!hasTabs) return result;

  // Add imports at the top of the file, after any frontmatter
  return insertImport(result, TABS_IMPORT);
}

/**
 * Inserts an import statement after frontmatter (if present) or at the top.
 * Skips insertion if the import already exists.
 */
function insertImport(markdown: string, importStatement: string): string {
  if (markdown.includes("@theme/Tabs")) return markdown;

  // Check for YAML frontmatter
  const frontmatterEnd = findFrontmatterEnd(markdown);

  if (frontmatterEnd === -1) {
    return `${importStatement}\n\n${markdown}`;
  }

  const before = markdown.slice(0, frontmatterEnd);
  const after = markdown.slice(frontmatterEnd);
  return `${before}\n${importStatement}\n${after}`;
}

function findFrontmatterEnd(markdown: string): number {
  if (!markdown.startsWith("---")) return -1;

  const secondDash = markdown.indexOf("\n---", 3);
  if (secondDash === -1) return -1;

  // Position right after the closing --- and its newline
  const end = markdown.indexOf("\n", secondDash + 4);
  return end === -1 ? secondDash + 4 : end + 1;
}
