/**
 * Transforms GitBook stepper blocks into a clean HTML/MDX representation.
 *
 * Input:
 * ```
 * {% stepper %}
 * {% step %}
 * ## Step Title
 * Some content here.
 * {% endstep %}
 * {% step %}
 * ## Another Step
 * More content.
 * {% endstep %}
 * {% endstepper %}
 * ```
 *
 * Output:
 * ```mdx
 * <div className="steps-container">
 * <div className="step">
 * <div className="step-number">1</div>
 * <div className="step-content">
 *
 * ## Step Title
 * Some content here.
 *
 * </div>
 * </div>
 * <div className="step">
 * <div className="step-number">2</div>
 * <div className="step-content">
 *
 * ## Another Step
 * More content.
 *
 * </div>
 * </div>
 * </div>
 * ```
 *
 * Consumers should provide CSS for `.steps-container`, `.step`,
 * `.step-number`, and `.step-content` to style the stepper.
 */

const STEPPER_BLOCK_RE =
  /{% stepper %}\s*\n([\s\S]*?)\n\s*{% endstepper %}/g;
const STEP_RE = /{% step %}\s*\n([\s\S]*?)\n\s*{% endstep %}/g;

function convertStepperBlock(stepperContent: string): string {
  const steps: string[] = [];
  let stepNumber = 0;

  let match: RegExpExecArray | null;
  const stepRe = new RegExp(STEP_RE.source, "gs");

  while ((match = stepRe.exec(stepperContent)) !== null) {
    stepNumber++;
    const content = match[1].trimEnd();

    steps.push(
      `<div className="step">\n` +
        `<div className="step-number">${stepNumber}</div>\n` +
        `<div className="step-content">\n\n${content}\n\n</div>\n` +
        `</div>`
    );
  }

  if (steps.length === 0) return stepperContent;

  return `<div className="steps-container">\n${steps.join("\n")}\n</div>`;
}

export function transformStepper(markdown: string): string {
  return markdown.replace(
    STEPPER_BLOCK_RE,
    (_match, content: string) => convertStepperBlock(content)
  );
}
