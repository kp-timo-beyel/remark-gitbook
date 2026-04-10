import { describe, it, expect } from "vitest";
import { transformHints } from "../src/transformers/hints.js";

describe("transformHints", () => {
  it("converts info hint to admonition", () => {
    const input = `{% hint style="info" %}
This is an info hint.
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::info
This is an info hint.
:::`);
  });

  it("converts warning hint", () => {
    const input = `{% hint style="warning" %}
Be careful with this.
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::warning
Be careful with this.
:::`);
  });

  it("converts danger hint", () => {
    const input = `{% hint style="danger" %}
This is dangerous!
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::danger
This is dangerous!
:::`);
  });

  it("maps success to tip", () => {
    const input = `{% hint style="success" %}
Great job!
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::tip
Great job!
:::`);
  });

  it("falls back to info for unknown styles", () => {
    const input = `{% hint style="custom" %}
Unknown style.
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::info
Unknown style.
:::`);
  });

  it("preserves multiline content", () => {
    const input = `{% hint style="warning" %}
You **must** forward incoming URLs via \`onOpenURL\`.

\`\`\`swift
.onOpenURL { url in
    auth.handleCallbackURL(url)
}
\`\`\`
{% endhint %}`;

    expect(transformHints(input)).toBe(`:::warning
You **must** forward incoming URLs via \`onOpenURL\`.

\`\`\`swift
.onOpenURL { url in
    auth.handleCallbackURL(url)
}
\`\`\`
:::`);
  });

  it("converts multiple hints in the same file", () => {
    const input = `# Title

{% hint style="info" %}
First hint.
{% endhint %}

Some text in between.

{% hint style="warning" %}
Second hint.
{% endhint %}`;

    const result = transformHints(input);
    expect(result).toContain(":::info\nFirst hint.\n:::");
    expect(result).toContain(":::warning\nSecond hint.\n:::");
    expect(result).toContain("Some text in between.");
  });

  it("leaves non-hint content untouched", () => {
    const input = `# Just a heading

Some paragraph text.`;

    expect(transformHints(input)).toBe(input);
  });
});
