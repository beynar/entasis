// Law 8 (read-only) in the documentation: every value control takes `readOnly`, so its MCP docs
// name the prop next to `disabled`, and its Usage card can switch it on.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../..');
const formDir = path.join(root, 'src/lib/components/Form');

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
	test('every Form input MCP doc that lists disabled also documents readOnly', () => {
		const missing = readdirSync(formDir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.flatMap((entry) =>
				readdirSync(path.join(formDir, entry.name))
					.filter((file) => file.endsWith('.mcp.ts'))
					.map((file) => path.join(entry.name, file))
			)
			.filter((file) => {
				const source = readFileSync(path.join(formDir, file), 'utf8');
				return /^- \*\*disabled\*\*/m.test(source) && !/\breadOnly\b/.test(source);
			});
		expect(missing).toEqual([]);
	});

	test.each(valueControlPages)('the %s Usage card has a Read only control', (page) => {
		const source = readFileSync(
			path.join(root, 'src/routes/components', page, '+page.svelte'),
			'utf8'
		);
		expect(source).toMatch(/name: 'readOnly', type: 'switch'/);
		expect(source).toContain('readOnly={controls.value.readOnly}');
		expect(source).toContain('readOnly={${controls.value.readOnly}}');
	});
});
