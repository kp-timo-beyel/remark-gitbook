/**
 * Fixes internal markdown links for Docusaurus compatibility.
 *
 * GitBook uses `.md` extensions in links: `[Label](path/to/page.md)`
 * Docusaurus routes don't include the `.md` extension.
 *
 * This transformer:
 * 1. Strips `.md` from relative link targets
 * 2. Converts `README.md` references to directory links (e.g., `./auth/README.md` → `./auth/`)
 */

// Matches markdown links with .md extension (but not http/https URLs)
const MD_LINK_RE = /\[([^\]]*)\]\((?!https?:\/\/)([^)]*?)\.md(\)?)/g;

export function transformLinks(markdown: string): string {
  return markdown.replace(MD_LINK_RE, (_match, label: string, path: string, closeParen: string) => {
    // README.md → directory index
    let cleanPath = path.replace(/\/README$/, "/");

    // Handle bare README → ./
    if (cleanPath === "README") {
      cleanPath = "./";
    }

    return `[${label}](${cleanPath}${closeParen}`;
  });
}
