# remark-gitbook

A [remark](https://github.com/remarkjs/remark) plugin that converts [GitBook](https://www.gitbook.com/)-flavored Markdown into [Docusaurus](https://docusaurus.io/)-compatible syntax.

If you're migrating from GitBook to Docusaurus — or running both in parallel — this plugin lets Docusaurus render GitBook Markdown without manual conversion.

## What it converts

| GitBook syntax | Docusaurus output |
|---|---|
| `{% hint style="info\|warning\|danger\|success" %}` | `:::info` / `:::warning` / `:::danger` / `:::tip` admonitions |
| `{% tabs %}{% tab title="..." %}` | `<Tabs><TabItem>` components |
| `{% stepper %}{% step %}` | Numbered step containers (CSS-styleable) |

## Install

```bash
npm install remark-gitbook
```

## Usage with Docusaurus

Add the plugin to your `docusaurus.config.js`:

```js
import remarkGitbook from 'remark-gitbook';

export default {
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          beforeDefaultRemarkPlugins: [remarkGitbook],
        },
      },
    ],
  ],
};
```

### Disable specific transformers

```js
beforeDefaultRemarkPlugins: [
  [remarkGitbook, { tabs: false }],  // keep GitBook tab syntax as-is
],
```

## Usage with unified

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGitbook from 'remark-gitbook';

const result = await unified()
  .use(remarkParse)
  .use(remarkGitbook)
  .use(remarkStringify)
  .process(gitbookMarkdown);
```

## Standalone preprocessor

If you need text-level transformation without the unified pipeline:

```js
import { preprocess } from 'remark-gitbook';

const docusaurusMarkdown = preprocess(gitbookMarkdown);

// With options
const docusaurusMarkdown = preprocess(gitbookMarkdown, { stepper: false });
```

## Conversion examples

### Hints → Admonitions

```markdown
{% hint style="warning" %}
You **must** call `initialize()` before using the SDK.
{% endhint %}
```

becomes:

```markdown
:::warning
You **must** call `initialize()` before using the SDK.
:::
```

### Tabs → Docusaurus Tabs

```markdown
{% tabs %}
{% tab title="Swift" %}
​```swift
let sdk = try KapeSDK()
​```
{% endtab %}
{% tab title="Kotlin" %}
​```kotlin
val sdk = KapeSDK()
​```
{% endtab %}
{% endtabs %}
```

becomes:

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="swift" label="Swift">

​```swift
let sdk = try KapeSDK()
​```

</TabItem>
<TabItem value="kotlin" label="Kotlin">

​```kotlin
val sdk = KapeSDK()
​```

</TabItem>
</Tabs>
```

### Stepper → Numbered steps

```markdown
{% stepper %}
{% step %}
## Install the SDK
Run `npm install kape-sdk`.
{% endstep %}
{% step %}
## Configure
Add your API key.
{% endstep %}
{% endstepper %}
```

becomes:

```html
<div className="steps-container">
<div className="step">
<div className="step-number">1</div>
<div className="step-content">

## Install the SDK
Run `npm install kape-sdk`.

</div>
</div>
<div className="step">
<div className="step-number">2</div>
<div className="step-content">

## Configure
Add your API key.

</div>
</div>
</div>
```

#### Stepper CSS

The stepper outputs semantic HTML. Add this CSS to your Docusaurus `custom.css` to style it:

```css
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.step {
  display: flex;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ifm-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.step-content {
  flex: 1;
  min-width: 0;
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `hints` | `boolean` | `true` | Convert `{% hint %}` to admonitions |
| `tabs` | `boolean` | `true` | Convert `{% tabs %}` to `<Tabs>` components |
| `stepper` | `boolean` | `true` | Convert `{% stepper %}` to numbered step containers |

## License

[MIT](LICENSE)
