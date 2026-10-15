// Law 8 (read-only) in the documentation: every value control takes `readOnly`, so its MCP docs
// name the prop next to `disabled`, and its Usage card can switch it on.
import { describe, expect, test } from 'vitest';

// Component sources (tests excluded) and MCP docs: every Form input, plus RichTextInput.
const sources = import.meta.glob<string>(
	[
		'../../lib/components/Form/*/*.{svelte,ts}',
		'../../lib/components/RichTextInput/*.{svelte,ts}',
		'!**/*.test.*',
		'!**/*.mcp.ts'
	],
	{ query: '?raw', import: 'default', eager: true }
);
const mcpDocs = import.meta.glob<string>(
	['../../lib/components/Form/*/*.mcp.ts', '../../lib/components/RichTextInput/*.mcp.ts'],
	{ query: '?raw', import: 'default', eager: true }
);
const pages = import.meta.glob<string>('./*/+page.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
});

const directoryOf = (file: string) => file.slice(0, file.lastIndexOf('/'));
const componentName = (dir: string) => dir.slice(dir.lastIndexOf('/') + 1);

/** Component directories whose own source declares or destructures `readOnly`. */
const readOnlyDirs = new Set(
	Object.entries(sources)
		.filter(([, source]) => /^\s*readOnly(\??:|,|\s*=)/m.test(source))
		.map(([file]) => directoryOf(file))
);

// Docs pages whose Usage card renders a value control that accepts `readOnly`.
const valueControlPages = [
	'autocomplete',
	'calendar',
	'checkbox',
	'checkboxes',
	'color-input',
	'color-picker',
	'combobox',
	'date-input',
	'date-selector',
	'file',
	'key-value-input',
	'number-input',
	'password',
	'phone',
	'pin-input',
	'radios',
	'rating-input',
	'rich-text-input',
	'select',
	'slider',
	'switch',
	'tag-group',
	'tags-input',
	'textarea',
	'textinput',
	'time-input',
	'voice-input'
];

describe('readOnly documentation', () => {
	test('every component that accepts readOnly documents it in its MCP doc', () => {
		const checked = Object.entries(mcpDocs).filter(([file]) => readOnlyDirs.has(directoryOf(file)));
		// Guard the filter itself: the value controls are found, not silently skipped.
		expect(checked.map(([file]) => componentName(directoryOf(file)))).toEqual(
			expect.arrayContaining(['DateInput', 'TimeInput', 'TextInput', 'Select', 'RichTextInput'])
		);
		const missing = checked
			.filter(([, source]) => !/\breadOnly\b/.test(source))
			.map(([file]) => file);
		expect(missing).toEqual([]);
	});

	test.each(valueControlPages)('the %s Usage card has a Read only control', (page) => {
		const source = pages[`./${page}/+page.svelte`];
		expect(source).toBeDefined();
		expect(source).toMatch(/name: 'readOnly', type: 'switch'/);
		expect(source).toContain('readOnly={controls.value.readOnly}');
		expect(source).toContain('readOnly={${controls.value.readOnly}}');
	});
});
