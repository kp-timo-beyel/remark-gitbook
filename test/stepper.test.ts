import { describe, it, expect } from "vitest";
import { transformStepper } from "../src/transformers/stepper.js";

describe("transformStepper", () => {
  it("converts a stepper block with numbered steps", () => {
    const input = `{% stepper %}
{% step %}
## First Step
Do something.
{% endstep %}
{% step %}
## Second Step
Do something else.
{% endstep %}
{% endstepper %}`;

    const result = transformStepper(input);
    expect(result).toContain('<div className="steps-container">');
    expect(result).toContain('<div className="step-number">1</div>');
    expect(result).toContain('<div className="step-number">2</div>');
    expect(result).toContain("## First Step");
    expect(result).toContain("## Second Step");
    expect(result).toContain("Do something.");
    expect(result).toContain("Do something else.");
  });

  it("handles a single step", () => {
    const input = `{% stepper %}
{% step %}
## Only Step
Content here.
{% endstep %}
{% endstepper %}`;

    const result = transformStepper(input);
    expect(result).toContain('<div className="step-number">1</div>');
    expect(result).not.toContain('<div className="step-number">2</div>');
  });

  it("leaves non-stepper content untouched", () => {
    const input = "# Just a heading\n\nSome text.";
    expect(transformStepper(input)).toBe(input);
  });

  it("preserves content around the stepper", () => {
    const input = `# Title

Some intro text.

{% stepper %}
{% step %}
## Step One
Content.
{% endstep %}
{% endstepper %}

Footer text.`;

    const result = transformStepper(input);
    expect(result).toContain("# Title");
    expect(result).toContain("Some intro text.");
    expect(result).toContain("Footer text.");
    expect(result).toContain('<div className="steps-container">');
  });

  it("handles steps with code blocks inside", () => {
    const input = `{% stepper %}
{% step %}
## Configure

\`\`\`swift
let sdk = try KapeSDK()
\`\`\`
{% endstep %}
{% endstepper %}`;

    const result = transformStepper(input);
    expect(result).toContain("```swift");
    expect(result).toContain("let sdk = try KapeSDK()");
  });
});
