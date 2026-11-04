// A class member or function without a declared type is emitted fully expanded, and every consumer's
// type check pays for it: one such member once took half of an app's check. These declarations have
// named types to keep small. Run after `svelte-package`.
import { stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'dist/components/Form');
const LIMIT_KB = 32;
const files = [
	'Form/form.state.svelte.d.ts',
	'MultiStepForm/multiStepForm.state.svelte.d.ts',
	'Form/visibility.d.ts'
];

const failures = [];
for (const file of files) {
	const { size } = await stat(path.join(root, file));
	if (size > LIMIT_KB * 1024) failures.push(`${file}: ${Math.round(size / 1024)} KB`);
}
if (failures.length > 0) {
	console.error(
		`Declarations over ${LIMIT_KB} KB, so probably expanded by an inferred type; declare it:\n- ${failures.join('\n- ')}`
	);
	process.exit(1);
}
console.log(`Declaration size check passed (${files.length} files under ${LIMIT_KB} KB).`);
