export const jsonEditorDescription = `
# JsonEditor Component

JsonEditor edits a JSON value through the right control for each field. Give it a JSON Schema and it builds a complete editor with the schema's guards. Give it only a value and it infers the shape, with every type left changeable.

## Basic usage

\`\`\`svelte
<script lang="ts">
	import { JsonEditor, type JsonSchema, type JsonValue } from 'entasis/json-editor';

	const schema: JsonSchema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', title: 'Name', maxLength: 32 },
			replicas: { type: 'integer', title: 'Replicas', minimum: 1, default: 2 },
			public: { type: 'boolean', title: 'Public' },
			region: { enum: ['eu', 'us'], title: 'Region' },
			tags: { type: 'array', items: { type: 'string' } }
		}
	};

	let value = $state<JsonValue | null>({ name: 'api' });
</script>

<JsonEditor {schema} bind:value label="Deployment" />
\`\`\`

Without a schema, the value is enough:

\`\`\`svelte
<script lang="ts">
	import { JsonEditor, type JsonValue } from 'entasis/json-editor';

	let value = $state<JsonValue | null>({ title: 'Report', views: 12, tags: ['q3'] });
</script>

<JsonEditor bind:value />
\`\`\`

## Props

- **schema**: JsonSchema - Left out, the shape is inferred from the value, every type stays changeable and nothing is reported.
- **value**: JsonValue | null (bindable), **defaultValue**, **onValueChange** - The JSON value. Without either, it starts from the schema: its \`default\` or \`const\`, else the shape of a required object or array. A required scalar with no default stays absent until it is filled.
- **mode**: 'tree' | 'json' (bindable, default 'tree'), **onModeChange** - The tree of controls, or the JSON text. Text that parses is the value at once; text that does not stays a draft and changes nothing.
- **controls**: boolean | ('expand' | 'copy' | 'mode')[] (default true) - The toolbar.
- **typeIcons**: boolean (default true) - An icon for the type of each value. Where a value may change type, the icon opens the list of types.
- **expandDepth**: number (default 2) - How many levels start open. Closed rows are not mounted, so a low depth keeps a large document fast.
- **descriptions**: 'inline' | 'tooltip' | 'none' (default 'inline') - Where a schema's \`description\` shows.
- **keyWidth**: string (default '38%') - Width of the key column.
- **size**: 'small' | 'normal' | 'large' (default 'small') - Geometry of the rows and controls.
- **density**: 'compact' | 'normal' | 'comfortable' - Space between rows.
- **api**: JsonEditorApi (bindable, browser only) - \`issues\`, \`validate()\`, \`expandAll()\`, \`collapseAll()\`, \`focus(path)\`.
- **onIssuesChange**: (issues) => void - Called when the list of problems changes.
- **validationMode**: 'submit' | 'blur' | 'change' - \`'change'\` shows every problem at once. Otherwise a problem shows once its value has been left, and all of them on \`validate()\` or a Form submit.
- **i18n**: Partial<Messages> - Per-instance catalog overrides.
- **label**, **description**, **helper**, **required**, **disabled**, **readOnly**, **name**, **form**, **messages**, **onValidate**, **errors**, **class**, **theme** - As on every field.

## The controls a schema picks

| Schema | Control |
| --- | --- |
| \`type: 'string'\` | TextInput, with \`maxLength\` as a native limit |
| \`format: 'textarea'\`, \`contentMediaType: 'text/…'\`, \`maxLength\` of 200 or more, or a text with several lines | TextArea |
| \`format: 'email'\`, \`'uri'\` | TextInput of that type |
| \`format: 'password'\`, or \`writeOnly\` | PasswordInput |
| \`format: 'date'\`, \`'time'\`, \`'date-time'\` | DateInput, TimeInput, or both side by side |
| \`format: 'color'\` | ColorInput |
| \`type: 'number'\`, \`'integer'\` | NumberInput, with \`minimum\`, \`maximum\` and \`multipleOf\` as its limits and step; an integer refuses decimals |
| \`type: 'boolean'\` | Switch |
| \`enum\`, or \`oneOf\` of \`const\` with titles | Select that writes the JSON value; \`x-enumNames\` names the options |
| \`const\` | Read-only value |
| \`type: 'array'\` with unique \`enum\` items | Select with \`multiple\` |
| \`type: 'array'\` | Rows: add, remove, duplicate, move |
| \`type: 'object'\` | Rows; new keys when \`additionalProperties\` or \`patternProperties\` allows them |
| \`oneOf\`, \`anyOf\` | A branch picker, named by each branch's \`title\` or the \`const\` that tells it apart |
| \`type: ['string', 'null']\` | The type icon switches between them |

Dates stay the text they are in JSON and never pass through a time zone: changing the date of \`2024-05-01T23:30:00+02:00\` keeps its time and offset.

## Keywords

\`$ref\` inside the document (\`$defs\`, \`definitions\`, \`$anchor\`, \`$id\`, recursion included), \`allOf\`, \`anyOf\`, \`oneOf\`, \`not\`, \`if\` / \`then\` / \`else\`, \`dependentRequired\`, \`dependentSchemas\`, \`dependencies\`, \`required\`, \`properties\`, \`patternProperties\`, \`additionalProperties\`, \`propertyNames\`, \`minProperties\`, \`maxProperties\`, \`items\`, \`prefixItems\`, \`additionalItems\`, \`minItems\`, \`maxItems\`, \`uniqueItems\`, \`contains\`, \`minContains\`, \`maxContains\`, \`type\`, \`enum\`, \`const\`, \`minLength\`, \`maxLength\`, \`pattern\`, \`format\`, \`minimum\`, \`maximum\`, \`exclusiveMinimum\`, \`exclusiveMaximum\`, \`multipleOf\`, \`title\`, \`description\`, \`default\`, \`examples\` (the placeholder), \`readOnly\`, \`writeOnly\`, \`deprecated\`, and \`errorMessage\` to reword a value's problems. Nothing is fetched: a \`$ref\` that leaves the document is ignored.

Conditions apply as the value triggers them: a key that \`then\` requires appears when \`if\` holds.

Emptying a control removes an optional key. A required key is removed too and reported missing; a row of a list stays, blank.

## Without a schema

\`inferJsonSchema(value)\` reads types, string formats (date, date-time, time, email, uri, uuid, color), the properties of objects and the shape the items of a list share. The editor infers once per value handed in, not after each edit, so a control never changes under the user as a text stops looking like an email. Every key can be renamed and removed, every type changed, and a new row looks like its siblings. Emptying a text keeps the key.

## Validating elsewhere

\`validateJson(value, schema)\` returns the problems as \`{ path, code, params }\`, for a server or a test. A \`JsonEditorApi\` issue also carries \`text\`, the message from the i18n catalog.

## In a Form

\`\`\`svelte
<script lang="ts">
	import { Form } from 'entasis/form';
	import type { JsonSchema } from 'entasis/json-editor';

	const schema: JsonSchema = {
		type: 'object',
		required: ['url'],
		properties: { url: { type: 'string', format: 'uri' } }
	};
</script>

<Form inputs={{ config: { type: 'json', label: 'Config', schema } }} />
\`\`\`

The whole value is one field: a problem anywhere stops the submit, shows every problem and opens the rows that hold one. In a native form, the JSON text is submitted under \`name\` and the rows submit nothing.

## Keyboard

- **Cmd+Z** or **Ctrl+Z** takes back the last edit in the tree, and **Shift+Cmd+Z**, **Shift+Ctrl+Z** or **Ctrl+Y** puts it back. Keystrokes in one field are one edit until a pause, and focus moves to what came back. The JSON view and a key still being named use the browser's own undo. A change from outside the editor clears the history.
- **Enter** in a row of a list of text or numbers adds the next row; **Backspace** in an empty one removes it.
- **Alt+Up / Alt+Down** in a control moves its row; **Up / Down** on the grip moves it too, and a move is announced.
- **Enter** on the grip opens its menu: duplicate, move, remove.
- **Enter** in a new key settles the name and moves to its value; **Escape** abandons it.

## Styling hooks

Rows carry \`data-slot="json-editor-row"\`, \`data-json-path\` (the path as JSON), \`data-json-type\` and \`data-invalid\`. The root carries \`data-slot="json-editor"\`, \`data-mode\` and \`data-size\`.

## Theme Structure

The theme object contains: inputContainer, root, toolbar, toolbarGroup, toolbarButton, issueCount, tree, rows, row, key, guide, keyContent, toggle, handle, typeIcon, keyLabel, keyInput, required, info, valueCell, valueRow, summary, preview, nestedIssues, fixedValue, setButton, variantSelect, actions, removeButton, addRow, inlineAdd, addButton, empty, description, rowError, raw, rawIssues, rawIssue, rawIssuePath.
`;
