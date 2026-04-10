import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGitbook from "../src/index.js";

async function process(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGitbook)
    .use(remarkStringify)
    .process(markdown);
  return String(result);
}

describe("remarkGitbook (integration)", () => {
  it("transforms hints, tabs, and stepper in a single document", async () => {
    const input = `# Setup Guide

{% hint style="warning" %}
Read this first.
{% endhint %}

{% tabs %}
{% tab title="Swift" %}
\`\`\`swift
import SDK
\`\`\`
{% endtab %}
{% tab title="Kotlin" %}
\`\`\`kotlin
import sdk
\`\`\`
{% endtab %}
{% endtabs %}

{% stepper %}
{% step %}
## Install
Run the installer.
{% endstep %}
{% endstepper %}`;

    const result = await process(input);

    // Hints
    expect(result).toContain(":::warning");

    // Tabs
    expect(result).toContain("import Tabs from '@theme/Tabs'");
    expect(result).toContain("<Tabs>");
    expect(result).toContain('<TabItem value="swift" label="Swift">');

    // Stepper
    expect(result).toContain('className="steps-container"');
    expect(result).toContain('className="step-number"');
  });

  it("can selectively disable transformers", async () => {
    const input = `{% hint style="info" %}
A hint.
{% endhint %}

{% tabs %}
{% tab title="A" %}
Content
{% endtab %}
{% endtabs %}`;

    const result = await unified()
      .use(remarkParse)
      .use(remarkGitbook, { tabs: false })
      .use(remarkStringify)
      .process(input);

    const output = String(result);

    // Hints should be transformed
    expect(output).toContain(":::info");
    // Tabs should remain as-is
    expect(output).toContain("{% tabs %}");
    expect(output).not.toContain("<Tabs>");
  });
});
