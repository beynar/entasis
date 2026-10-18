// Feature chips on docs pages (`<DocPage features={[…]}>`) come in two kinds:
//   'Plain description'                         → informational, rendered without a check mark
//   { label: 'Escape restores focus', test: 'a11y:dialog.escape-restores-focus' }
//                                               → verified: `test` must name an existing test
// Any plain chip that makes an accessibility or keyboard claim must be the verified kind,
// so a docs page cannot advertise behaviour that nothing exercises.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { listFiles, repositoryRoot } from './consumer-fixture.mjs';

const pages = await listFiles(path.join(repositoryRoot, 'src/routes'), (file) =>
	file.endsWith('/+page.svelte')
);
const testFiles = [
	...(await listFiles(path.join(repositoryRoot, 'src'), (f) => /\.test\.ts$/.test(f))),
	...(await listFiles(path.join(repositoryRoot, 'e2e'), (f) => /\.test\.ts$/.test(f)))
];
const testSources = await Promise.all(testFiles.map((f) => readFile(f, 'utf8')));
// A test satisfies an id when its name starts with the id: test('a11y:x.y') or test('a11y:x.y does z').
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasTest = (id) => {
	const re = new RegExp(`['"\`]${escapeRe(id)}[ '"\`]`);
	return testSources.some((source) => re.test(source));
};

const claimRe =
	/\b(aria|wai-aria|a11y|accessib|keyboard|arrow[- ]key|focus|screen[- ]reader|escape|roving|typeahead)\b/i;
const failures = [];
let chips = 0;
let verified = 0;

for (const page of pages) {
	const source = await readFile(page, 'utf8');
	const match = source.match(/\bfeatures=\{(\[[\s\S]*?\])\}/);
	if (!match) continue;
	const relative = path.relative(repositoryRoot, page);
	const file = ts.createSourceFile(
		'features.ts',
		`const features = ${match[1]};`,
		ts.ScriptTarget.ES2022
	);
	const array = file.statements[0].declarationList.declarations[0].initializer;
	if (!ts.isArrayLiteralExpression(array)) {
		failures.push(`${relative}: features must be an array literal`);
		continue;
	}
	for (const element of array.elements) {
		chips += 1;
		if (ts.isStringLiteralLike(element)) {
			if (claimRe.test(element.text)) {
				failures.push(
					`${relative}: "${element.text}" claims accessibility/keyboard behaviour — use { label, test } backed by a test`
				);
			}
			continue;
		}
		if (!ts.isObjectLiteralExpression(element)) {
			failures.push(`${relative}: feature chips must be strings or { label, test } objects`);
			continue;
		}
		const props = Object.fromEntries(
			element.properties
				.filter((p) => ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer))
				.map((p) => [p.name.getText(file), p.initializer.text])
		);
		if (!props.label || !props.test) {
			failures.push(`${relative}: verified chip needs string \`label\` and \`test\``);
			continue;
		}
		verified += 1;
		if (!hasTest(props.test)) {
			failures.push(
				`${relative}: "${props.label}" references test '${props.test}' but no test file contains it`
			);
		}
	}
}

if (failures.length) {
	console.error(`Feature chip check failed:\n- ${failures.join('\n- ')}`);
	process.exit(1);
}
console.log(`Feature chips passed (${chips} chips, ${verified} verified by tests).`);
