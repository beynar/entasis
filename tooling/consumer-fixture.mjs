// Shared "package consumer" fixture: a throwaway SvelteKit-less project under
// `.package-consumer/` whose `node_modules/svelai` is the freshly packaged `dist`.
// Checks write source files into it and run svelte-check so imports resolve exactly
// the way they do for a real consumer of the published package.
import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
export const repositoryRoot = path.resolve(import.meta.dirname, '..');
// Unique per process so parallel checks (CI matrix, several agents) never share a fixture.
export const fixtureRoot = path.join(
	repositoryRoot,
	`.package-consumer-${process.pid.toString(36)}`
);
export const packageRoot = path.join(fixtureRoot, 'node_modules/svelai');

export const listFiles = async (directory, predicate) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(file, predicate)));
		else if (predicate(file)) files.push(file);
	}
	return files;
};

export async function createConsumerFixture() {
	await rm(fixtureRoot, { recursive: true, force: true });
	await mkdir(path.join(fixtureRoot, 'src'), { recursive: true });
	await mkdir(packageRoot, { recursive: true });
	await cp(path.join(repositoryRoot, 'dist'), path.join(packageRoot, 'dist'), { recursive: true });
	await cp(path.join(repositoryRoot, 'package.json'), path.join(packageRoot, 'package.json'));
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

	return {
		root: fixtureRoot,
		packageRoot,
		async write(relativePath, content) {
			const destination = path.join(fixtureRoot, relativePath);
			await mkdir(path.dirname(destination), { recursive: true });
			await writeFile(destination, content);
			return destination;
		},
		/**
		 * Runs svelte-check and returns every diagnostic as `{ type, file, line, column, message, code }`.
		 * Pass `include` (tsconfig globs) to check a subset — large fixtures are checked in batches.
		 */
		async svelteCheck(include = ['src/**/*.svelte', 'src/**/*.ts']) {
			const tsconfig = JSON.parse(await readFile(path.join(fixtureRoot, 'tsconfig.json'), 'utf8'));
			await writeFile(
				path.join(fixtureRoot, 'tsconfig.json'),
				JSON.stringify({ ...tsconfig, include }, null, 2)
			);
			let stdout = '';
			try {
				({ stdout } = await exec(
					path.join(repositoryRoot, 'node_modules/.bin/svelte-check'),
					[
						'--workspace',
						fixtureRoot,
						'--tsconfig',
						path.join(fixtureRoot, 'tsconfig.json'),
						'--output',
						'machine-verbose'
					],
					{
						cwd: fixtureRoot,
						maxBuffer: 1024 * 1024 * 40,
						env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=6144' }
					}
				));
			} catch (error) {
				if (!error.stdout) throw error;
				stdout = error.stdout;
			}
			const diagnostics = [];
			for (const line of stdout.split('\n')) {
				const json = line.slice(line.indexOf(' ') + 1);
				if (!json.startsWith('{')) continue;
				try {
					const entry = JSON.parse(json);
					if (!entry.filename) continue;
					diagnostics.push({
						type: entry.type,
						file: path.relative(fixtureRoot, path.resolve(fixtureRoot, entry.filename)),
						line: (entry.start?.line ?? 0) + 1,
						column: (entry.start?.character ?? 0) + 1,
						message: entry.message,
						code: entry.code,
						source: entry.source
					});
				} catch {
					// not a diagnostic line
				}
			}
			return diagnostics;
		},
		async dispose() {
			await rm(fixtureRoot, { recursive: true, force: true });
		}
	};
}
