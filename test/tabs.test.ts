import { describe, it, expect } from "vitest";
import { transformTabs } from "../src/transformers/tabs.js";

describe("transformTabs", () => {
  it("converts a simple two-tab block", () => {
    const input = `{% tabs %}
{% tab title="Swift" %}
\`\`\`swift
let x = 1
\`\`\`
{% endtab %}
{% tab title="Kotlin" %}
\`\`\`kotlin
val x = 1
\`\`\`
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    expect(result).toContain("import Tabs from '@theme/Tabs';");
    expect(result).toContain("import TabItem from '@theme/TabItem';");
    expect(result).toContain('<Tabs>');
    expect(result).toContain('<TabItem value="swift" label="Swift">');
    expect(result).toContain('<TabItem value="kotlin" label="Kotlin">');
    expect(result).toContain("</Tabs>");
  });

  it("deduplicates tab values", () => {
    const input = `{% tabs %}
{% tab title="Example" %}
First
{% endtab %}
{% tab title="Example" %}
Second
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    expect(result).toContain('<TabItem value="example" label="Example">');
    expect(result).toContain('<TabItem value="example-2" label="Example">');
  });

  it("does not add imports when no tabs exist", () => {
    const input = "# Just a heading\n\nSome text.";
    const result = transformTabs(input);
    expect(result).not.toContain("import Tabs");
    expect(result).toBe(input);
  });

  it("adds imports after frontmatter", () => {
    const input = `---
description: Some page
---

{% tabs %}
{% tab title="A" %}
Content A
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    const lines = result.split("\n");
    // Frontmatter should come first
    expect(lines[0]).toBe("---");
    // Imports should appear after frontmatter
    const importIndex = result.indexOf("import Tabs");
    const frontmatterEnd = result.indexOf("---", 3) + 3;
    expect(importIndex).toBeGreaterThan(frontmatterEnd);
  });

  it("handles multiple tab blocks in one file", () => {
    const input = `{% tabs %}
{% tab title="A" %}
First block
{% endtab %}
{% endtabs %}

Some text.

{% tabs %}
{% tab title="B" %}
Second block
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    // Should have exactly one import
    const importCount = (result.match(/import Tabs/g) || []).length;
    expect(importCount).toBe(1);
    // Should have two <Tabs> blocks
    const tabsCount = (result.match(/<Tabs>/g) || []).length;
    expect(tabsCount).toBe(2);
  });

  it("converts tab titles with special characters to clean values", () => {
    const input = `{% tabs %}
{% tab title="C++" %}
code
{% endtab %}
{% tab title="C#" %}
code
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    // C++ → "c" (special chars stripped), C# → "c" (duplicate) → "c-2"
    expect(result).toContain('<TabItem value="c" label="C++">');
    expect(result).toContain('<TabItem value="c-2" label="C#">');
  });

  it("does not duplicate imports if already present", () => {
    const input = `import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

{% tabs %}
{% tab title="X" %}
content
{% endtab %}
{% endtabs %}`;

    const result = transformTabs(input);
    const importCount = (result.match(/import Tabs/g) || []).length;
    expect(importCount).toBe(1);
  });
});
