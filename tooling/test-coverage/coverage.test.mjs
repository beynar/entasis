// node --test tooling/test-coverage/coverage.test.mjs (part of npm run test:contracts)
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { compare, measureCoverage, seed } from './coverage.mjs';

const entry = (id, directory, category) => ({
	id,
	subpath: `./${id}`,
	sourceIndex: `src/lib/components/${directory}/index.ts`,
	capabilities: ['svelte', 'component'],
	docs: [{ id, route: `/components/${id}`, category, label: id }]
});

const manifest = [
	entry('dialog', 'Dialog', 'Overlays'),
	entry('select', 'Form/Select', 'Forms'),
	entry('button', 'Button', 'Actions'),
	entry('stack', 'Stack', 'Layout'),
	{ ...entry('icons', 'Icons', 'Icons'), sourceIndex: 'src/lib/components/Icons/*.ts' }
];

async function fixture(files) {
	const root = await mkdtemp(path.join(os.tmpdir(), 'entasis-coverage-'));
	for (const [file, source] of Object.entries(files)) {
		await mkdir(path.dirname(path.join(root, file)), { recursive: true });
		await writeFile(path.join(root, file), source);
	}
	return root;
}

test('credits tests in the owner directory and tests that import the component', async () => {
	const root = await fixture({
		'src/lib/components/Dialog/dialog.browser.test.ts': '',
		'src/lib/components/Dialog/dialog.attributes.ts': '',
		'src/lib/components/Form/Select/select.ssr.test.ts': '',
		// A shared SSR test: a static import, a table-driven path, and a public subpath.
		'src/lib/components/links.ssr.test.ts': [
			"import Button from './Button/Button.svelte';",
			"const load = (p) => import(p); load('./Dialog/Dialog.svelte');",
			"import 'entasis/stack';"
		].join('\n'),
		// A type-only import credits nothing.
		'src/lib/components/types.browser.test.ts': "import type { X } from './Stack/stack.props.js';"
	});
	try {
		const byId = Object.fromEntries(
			(await measureCoverage(root, manifest)).map((measured) => [measured.id, measured])
		);
		assert.equal(byId.icons, undefined, 'wildcard entries have no directory of their own');
		assert.deepEqual(byId.dialog.has, { browser: true, ssr: true, attributes: true });
		assert.equal(byId.dialog.law12, true);
		assert.equal(byId.select.law12, true, 'select is a list owner');
		assert.deepEqual(byId.select.has, { browser: false, ssr: true, attributes: false });
		assert.deepEqual(byId.button.has, { browser: false, ssr: true, attributes: false });
		assert.equal(byId.button.law12, false);
		assert.deepEqual(byId.stack.has, { browser: false, ssr: true, attributes: false });
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('gaps need an exemption, and exemptions only shrink', () => {
	const measured = [
		{
			id: 'dialog',
			directory: 'd',
			law12: true,
			has: { browser: true, ssr: false, attributes: true }
		},
		{
			id: 'button',
			directory: 'b',
			law12: false,
			has: { browser: false, ssr: true, attributes: false }
		}
	];

	assert.match(compare(measured, {}).join('\n'), /dialog .*no ssr coverage/);
	assert.match(compare(measured, {}).join('\n'), /button .*no browser coverage/);
	assert.deepEqual(seed(measured, {}), { dialog: { ssr: 'todo' }, button: { browser: 'todo' } });

	const exemptions = { dialog: { ssr: 'todo' }, button: { browser: 'renders no markup' } };
	assert.deepEqual(compare(measured, exemptions), []);
	assert.deepEqual(compare(measured, exemptions, exemptions), []);

	// A met requirement makes its exemption stale.
	const stale = compare(measured, { ...exemptions, dialog: { ssr: 'todo', browser: 'todo' } });
	assert.match(stale.join('\n'), /dialog\.browser is stale/);

	// A `todo` the base did not have is refused; a reasoned exemption is not.
	const grown = compare(measured, exemptions, { button: { browser: 'renders no markup' } });
	assert.deepEqual(grown.length, 1);
	assert.match(grown[0], /dialog\.ssr is a new "todo"/);

	// Unknown ids, requirements an entry does not owe, and empty reasons.
	const wrong = compare(measured, {
		...exemptions,
		gone: { ssr: 'todo' },
		button: { browser: 'x', attributes: 'todo' },
		dialog: { ssr: ' ' }
	}).join('\n');
	assert.match(wrong, /gone, which is not a component entry/);
	assert.match(wrong, /button\.attributes exempts a requirement button does not owe/);
	assert.match(wrong, /dialog\.ssr needs a reason/);
});
