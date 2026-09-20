import { execFile } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { listSources, loadManifest, repositoryRoot } from './component-contract/source.mjs';

const exec = promisify(execFile);
const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'entasis-consumer-'));

async function run(command, args, cwd = fixtureRoot) {
	try {
		return await exec(command, args, { cwd, maxBuffer: 20 * 1024 * 1024 });
	} catch (error) {
		if (error.stdout) process.stderr.write(error.stdout);
		if (error.stderr) process.stderr.write(error.stderr);
		throw error;
	}
}

try {
	const { stdout } = await run(
		'npm',
		['pack', '--ignore-scripts', '--json', '--pack-destination', fixtureRoot],
		repositoryRoot
	);
	const [packed] = JSON.parse(stdout);
	const dependencies = { entasis: `file:${path.join(fixtureRoot, packed.filename)}` };
	for (const dependency of [
		'svelte',
		'typescript',
		'@sveltejs/vite-plugin-svelte',
		'tailwindcss'
	]) {
		const installed = JSON.parse(
			await readFile(path.join(repositoryRoot, 'node_modules', dependency, 'package.json'), 'utf8')
		);
		dependencies[dependency] = installed.version;
	}
	await writeFile(
		path.join(fixtureRoot, 'package.json'),
		JSON.stringify({ name: 'entasis-consumer-check', private: true, type: 'module', dependencies })
	);
	await run('npm', [
		'install',
		'--ignore-scripts',
		'--no-audit',
		'--no-fund',
		'--package-lock=false'
	]);

	const packageRoot = path.join(fixtureRoot, 'node_modules/entasis');
	const manifest = await loadManifest();
	const metadata = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
	if (metadata.license !== 'MIT')
		throw new Error('The packed package must declare the MIT license.');
	const license = await readFile(path.join(packageRoot, 'LICENSE'), 'utf8');
	if (license !== (await readFile(path.join(repositoryRoot, 'LICENSE'), 'utf8'))) {
		throw new Error('The packed license differs from LICENSE.');
	}

	const imports = [];
	let symbolIndex = 0;
	let entrypointCount = 0;
	const importSymbols = (specifier, symbols) => {
		imports.push(
			`import type { ${symbols.map((symbol) => `${symbol} as PublicSymbol${symbolIndex++}`).join(', ')} } from '${specifier}';`
		);
		entrypointCount += 1;
	};

	for (const entry of manifest) {
		if (!entry.subpath || !entry.exports) continue;
		const targets =
			typeof entry.exports === 'string' ? [entry.exports] : Object.values(entry.exports);
		if (!entry.subpath.includes('*')) {
			for (const target of targets) await access(path.join(packageRoot, target));
			if (Array.isArray(entry.exportedSymbols) && entry.exportedSymbols.length) {
				importSymbols(`entasis${entry.subpath.slice(1)}`, entry.exportedSymbols);
			}
			continue;
		}

		const typeTarget = typeof entry.exports === 'string' ? entry.exports : entry.exports.types;
		const [prefix, suffix] = typeTarget.split('*');
		const modules = await listSources(
			path.join(packageRoot, path.dirname(typeTarget)),
			(filename) => filename.endsWith(suffix)
		);
		if (modules.length === 0) throw new Error(`No packed modules match ${entry.subpath}.`);
		for (const filename of modules) {
			const relativeFile = `./${path.relative(packageRoot, filename).split(path.sep).join('/')}`;
			if (!relativeFile.startsWith(prefix)) continue;
			const name = relativeFile.slice(prefix.length, -suffix.length);
			for (const target of targets) await access(path.join(packageRoot, target.replace('*', name)));
			const symbols =
				entry.exportedSymbols.modules[name] ??
				entry.exportedSymbols.pattern.map((symbol) => symbol.replaceAll('{name}', name));
			importSymbols(`entasis${entry.subpath.slice(1).replace('*', name)}`, symbols);
		}
	}

	await mkdir(path.join(fixtureRoot, 'src'));
	await writeFile(path.join(fixtureRoot, 'src/public-api.ts'), `${imports.join('\n')}\n`);
	await writeFile(
		path.join(fixtureRoot, 'src/PublicContract.svelte'),
		await readFile(path.join(repositoryRoot, 'tooling/component-contract/consumer.svelte'), 'utf8')
	);
	await writeFile(
		path.join(fixtureRoot, 'tsconfig.json'),
		JSON.stringify({
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
			include: ['src/**/*.ts', 'src/**/*.svelte']
		})
	);
	await writeFile(
		path.join(fixtureRoot, 'svelte.config.js'),
		"import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\nexport default { preprocess: vitePreprocess() };\n"
	);
	await run(path.join(repositoryRoot, 'node_modules/.bin/svelte-check'), [
		'--workspace',
		fixtureRoot,
		'--tsconfig',
		path.join(fixtureRoot, 'tsconfig.json')
	]);
	await run(process.execPath, [
		'--input-type=module',
		'-e',
		"import plugin from 'entasis/tailwind-plugin'; if (typeof plugin !== 'function') throw new Error('The Tailwind entrypoint must export its plugin.');"
	]);
	console.log(
		`Packed library passed: ${entrypointCount} entrypoints and ${symbolIndex} symbols, installed from ${packed.filename}.`
	);
} finally {
	await rm(fixtureRoot, { recursive: true, force: true });
}
