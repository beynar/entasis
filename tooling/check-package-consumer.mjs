import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'svelte/compiler';
import ts from 'typescript';

const exec = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, '..');
const fixtureRoot = path.join(repositoryRoot, '.package-consumer');
const packageRoot = path.join(fixtureRoot, 'node_modules/svelai');
const blockRoot = path.join(repositoryRoot, 'src/routes/blocks');
const documentationRoots = [
	path.join(repositoryRoot, 'src/lib/components'),
	path.join(repositoryRoot, '.agents/skills/svelai'),
	path.join(repositoryRoot, '.claude/skills/svelai')
];

const listFiles = async (directory, predicate) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(file, predicate)));
		else if (predicate(file)) files.push(file);
	}
	return files;
};

const validateDocumentationFences = async () => {
	const errors = [];
	const files = (
		await Promise.all(
			documentationRoots.map((directory) =>
				listFiles(directory, (file) => file.endsWith('.mcp.ts') || file.endsWith('.md'))
			)
		)
	).flat();
	const fence = /(?:\\?`){3}(svelte|typescript|ts)\s*\n([\s\S]*?)(?:\\?`){3}/g;

	for (const file of files) {
		const source = await readFile(file, 'utf8');
		let index = 0;
		for (const match of source.matchAll(fence)) {
			index += 1;
			const language = match[1];
			const code = match[2].replaceAll('\\`', '`');
			try {
				if (language === 'svelte') {
					parse(code, { filename: `${file}#${index}`, modern: true });
				} else {
					const output = ts.transpileModule(code, {
						compilerOptions: {
							module: ts.ModuleKind.ESNext,
							target: ts.ScriptTarget.ES2022
						},
						reportDiagnostics: true
					});
					for (const diagnostic of output.diagnostics ?? []) {
						if (diagnostic.category === ts.DiagnosticCategory.Error) {
							throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
						}
					}
				}
			} catch (error) {
				errors.push(`${path.relative(repositoryRoot, file)} fence ${index}: ${error.message}`);
			}
		}
	}

	if (errors.length) {
		throw new Error(`Documented example syntax check failed:\n- ${errors.join('\n- ')}`);
	}
};

const buildConsumerFixture = async () => {
	const blockFiles = await listFiles(
		blockRoot,
		(file) =>
			(file.endsWith('/Block.svelte') && !file.includes('/cta-1/')) ||
			(file.startsWith(path.join(blockRoot, 'catalog') + path.sep) && file.endsWith('.svelte'))
	);
	if (blockFiles.length === 0) {
		throw new Error('No package-consumer blocks found.');
	}

	await rm(fixtureRoot, { recursive: true, force: true });
	await mkdir(path.join(fixtureRoot, 'src/blocks'), { recursive: true });
	await mkdir(packageRoot, { recursive: true });
	await cp(path.join(repositoryRoot, 'dist'), path.join(packageRoot, 'dist'), { recursive: true });
	await cp(path.join(repositoryRoot, 'package.json'), path.join(packageRoot, 'package.json'));

	const imports = [];
	const components = [];
	for (const [index, blockFile] of blockFiles.entries()) {
		const relativeFile = path.relative(blockRoot, blockFile);
		const destination = path.join(fixtureRoot, 'src/blocks', relativeFile);
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(blockFile, destination);
		imports.push(`import Block${index} from './blocks/${relativeFile.split(path.sep).join('/')}';`);
		components.push(`<Block${index} />`);
	}

	await writeFile(
		path.join(fixtureRoot, 'src/App.svelte'),
		`<script lang="ts">\n${imports.join('\n')}\n</script>\n${components.join('\n')}\n`
	);
	await writeFile(
		path.join(fixtureRoot, 'tsconfig.json'),
		JSON.stringify(
			{
				compilerOptions: {
					allowJs: true,
					checkJs: true,
					esModuleInterop: true,
					isolatedModules: true,
					module: 'ESNext',
					moduleResolution: 'Bundler',
					skipLibCheck: true,
					strict: true,
					target: 'ES2022'
				},
				include: ['src/**/*.svelte', 'src/**/*.ts']
			},
			null,
			2
		)
	);
	await writeFile(
		path.join(fixtureRoot, 'svelte.config.js'),
		"import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\nexport default { preprocess: vitePreprocess() };\n"
	);
	try {
		await exec(
			path.join(repositoryRoot, 'node_modules/.bin/svelte-check'),
			['--workspace', fixtureRoot, '--tsconfig', path.join(fixtureRoot, 'tsconfig.json')],
			{ cwd: fixtureRoot, maxBuffer: 1024 * 1024 * 20 }
		);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
};

await validateDocumentationFences();
await buildConsumerFixture();
console.log('Package-consumer blocks and documented example syntax passed.');
