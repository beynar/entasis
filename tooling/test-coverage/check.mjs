// npm run check:test-coverage
//
// Every component entry of tooling/component-contract/manifest.ts has a browser test, an SSR test
// and, when it owns an overlay or a list (law 12), its `<owner>.attributes.ts`, or an exemption with
// a reason in tooling/test-coverage/exemptions.json. That file only shrinks: an exemption whose
// requirement is met fails the check until it is removed, and with `--base <git ref>` (CI on pull
// requests) a `todo` the base did not have fails too.
//
//   node tooling/test-coverage/check.mjs                 check
//   node tooling/test-coverage/check.mjs --base <ref>    also refuse new `todo` gaps
//   node tooling/test-coverage/check.mjs --write         rewrite the file: drop stale entries and
//                                                        add `todo` for gaps (seeding only)
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadManifest } from '../component-contract/source.mjs';
import { compare, measureCoverage, requirements, seed } from './coverage.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const exemptionsPath = 'tooling/test-coverage/exemptions.json';
const args = process.argv.slice(2);
const baseIndex = args.indexOf('--base');
const base = baseIndex >= 0 ? args[baseIndex + 1] : undefined;

const readExemptions = (text) => JSON.parse(text).exemptions ?? {};

function exemptionsAt(ref) {
	try {
		const text = execFileSync('git', ['show', `${ref}:${exemptionsPath}`], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		});
		return readExemptions(text);
	} catch {
		// The base predates the file: everything in it is new, which only the first PR may do.
		console.warn(`check:test-coverage: ${exemptionsPath} is not in ${ref}; the base check is off.`);
		return undefined;
	}
}

const manifest = await loadManifest();
const measurements = await measureCoverage(root, manifest);
const file = JSON.parse(await readFile(path.join(root, exemptionsPath), 'utf8'));
const exemptions = file.exemptions ?? {};

if (args.includes('--write')) {
	const next = { ...file, exemptions: seed(measurements, exemptions) };
	await writeFile(path.join(root, exemptionsPath), `${JSON.stringify(next, null, '\t')}\n`);
	console.log(`Wrote ${exemptionsPath}.`);
	process.exit(0);
}

const errors = compare(measurements, exemptions, base ? exemptionsAt(base) : undefined);
const todo = Object.values(exemptions).flatMap((entry) =>
	Object.values(entry).filter((reason) => reason === 'todo')
).length;
const totals = Object.keys(requirements)
	.map((name) => {
		const owing = measurements.filter((measured) => name !== 'attributes' || measured.law12);
		return `${name} ${owing.filter((measured) => measured.has[name]).length}/${owing.length}`;
	})
	.join(', ');

if (errors.length) {
	console.error(
		`check:test-coverage failed (${errors.length}):\n${errors.map((e) => `- ${e}`).join('\n')}`
	);
	process.exit(1);
}
console.log(`check:test-coverage passed: ${totals}; ${todo} known gaps marked "todo".`);
