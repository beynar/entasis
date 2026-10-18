import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join, relative } from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const packageJson = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'));
const viewerDistDirectories = [
	join(repositoryRoot, 'dist/components/DocumentViewer'),
	join(repositoryRoot, 'dist/components/PDFViewer')
];
const forbiddenDependencies = [
	'@silurus/ooxml',
	'office-oxide-wasm',
	'papaparse',
	'pdfjs-dist',
	'react',
	'react-dom',
	'xlsx'
];

const listFiles = async (directory) =>
	(
		await Promise.all(
			(await readdir(directory, { withFileTypes: true })).map((entry) => {
				const path = join(directory, entry.name);
				return entry.isDirectory() ? listFiles(path) : [path];
			})
		)
	).flat();

const errors = [];
const dependencies = packageJson.dependencies ?? {};
for (const dependency of forbiddenDependencies) {
	if (dependency in dependencies) errors.push(`heavy runtime dependency: ${dependency}`);
}

if (packageJson.exports?.['./pdf-viewer']) errors.push('legacy ./pdf-viewer export');
if (!packageJson.exports?.['./document-viewer']) errors.push('missing ./document-viewer export');

const files = (await Promise.all(viewerDistDirectories.map(listFiles))).flat();
for (const file of files) {
	const name = relative(repositoryRoot, file);
	if (extname(file) === '.wasm') errors.push(`bundled WebAssembly asset: ${name}`);
	if (/\.worker\.(?:js|mjs)$/i.test(file)) errors.push(`bundled worker asset: ${name}`);
	if (extname(file) !== '.js') continue;

	const source = await readFile(file, 'utf8');
	for (const dependency of forbiddenDependencies) {
		const escaped = dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const staticImport = new RegExp(`(?:from\\s*|import\\s*)["']${escaped}(?:[\\/"'])`);
		if (staticImport.test(source)) errors.push(`static ${dependency} import in ${name}`);
	}
}

if (errors.length) {
	throw new Error(`DocumentViewer package boundary failed:\n- ${errors.join('\n- ')}`);
}

console.log(
	`DocumentViewer package boundary passed (${files.length} emitted files, no heavy dependencies, WASM, or worker bundles).`
);
