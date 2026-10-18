// Shared "package consumer" fixture: a throwaway SvelteKit-less project whose
// `node_modules/entasis` is the freshly packaged `dist`. Checks write source files into it
// and run svelte-check so imports resolve exactly the way they do for a real consumer.
//
// The fixture lives outside the repository and gets an explicit `node_modules`: only
// entasis's own `dependencies`, its peers — including the OPTIONAL peers (Chart's TanStack
// Charts + D3, RichTextInput's Lexical, Globe's cobe) a consumer of those components
// installs — and the two toolchain packages the fixture's own config imports. Nothing
// resolves by walking up into the repository's `node_modules`, so a missing peer fails
// here instead of passing by accident.
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
export const repositoryRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
// What a consumer who uses every component has installed, plus what the fixture's own
// `svelte.config.js` and svelte-check need. `entasis` itself is the packaged `dist`.
export const fixtureDependencies = [
	...Object.keys(manifest.dependencies ?? {}),
	...Object.keys(manifest.peerDependencies ?? {}),
	'typescript',
	'@sveltejs/vite-plugin-svelte'
].sort();

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
	// Unique per process so parallel checks (CI matrix, several agents) never share a fixture.
	const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'entasis-package-consumer-'));
	const packageRoot = path.join(fixtureRoot, 'node_modules/entasis');
	await mkdir(path.join(fixtureRoot, 'src'), { recursive: true });
	await mkdir(packageRoot, { recursive: true });
	await cp(path.join(repositoryRoot, 'dist'), path.join(packageRoot, 'dist'), { recursive: true });
	await cp(path.join(repositoryRoot, 'package.json'), path.join(packageRoot, 'package.json'));
	for (const dependency of fixtureDependencies) {
		const source = path.join(repositoryRoot, 'node_modules', dependency);
		try {
			await readFile(path.join(source, 'package.json'));
		} catch {
			throw new Error(`The consumer fixture needs ${dependency} installed in the repository.`);
		}
		const link = path.join(fixtureRoot, 'node_modules', dependency);
		await mkdir(path.dirname(link), { recursive: true });
		await symlink(source, link, 'dir');
	}
	await writeFile(
		path.join(fixtureRoot, 'package.json'),
		JSON.stringify(
			{
				name: 'entasis-package-consumer',
				private: true,
				type: 'module',
				dependencies: Object.fromEntries(
					['entasis', ...fixtureDependencies].map((name) => [name, '*'])
				)
			},
			null,
			2
		)
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
			let stdout;
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
