import { execFile } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
	canonicalSkillDir,
	packageDocsDir,
	packageSkillDir,
	writePackageDocs
} from './component-contract/agent-docs.mjs';
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

// The consumer typechecks with `skipLibCheck: false`, so a broken shipped `.d.ts` fails. The
// declarations of entasis's own dependencies are left to them: an error located in a package
// other than these is reported and ignored. Errors in typescript's and svelte's own types stay,
// as an entasis global augmentation is what makes them fail.
const checkedPackages = new Set(['entasis', 'typescript', 'svelte']);
// Errors in entasis's shipped declarations that predate the strict check. Each is a bug to fix;
// remove its entry with the fix. Paths are relative to the consumer's node_modules.
// Each entry has `file` (a path or a pattern), `message` (a substring of the error) and `bug` (what
// is wrong). The list is empty: src/lib/declarations.source.test.ts guards the source patterns that
// produced its former entries.
/** @type {{ file: string | RegExp, message: string, bug: string }[]} */
const knownDeclarationErrors = [];

async function typecheckConsumer() {
	let stdout;
	try {
		({ stdout } = await exec(
			path.join(fixtureRoot, 'node_modules/.bin/svelte-check'),
			[
				'--workspace',
				fixtureRoot,
				'--tsconfig',
				path.join(fixtureRoot, 'tsconfig.json'),
				'--output',
				'machine'
			],
			{ cwd: fixtureRoot, maxBuffer: 20 * 1024 * 1024 }
		));
	} catch (error) {
		if (typeof error.stdout !== 'string') throw error;
		stdout = error.stdout;
	}
	const failures = [];
	const foreign = new Map();
	const known = new Set();
	for (const line of stdout.split('\n')) {
		const match = line.match(/^\d+ ERROR "([^"]+)" (\d+):(\d+) "(.*)"$/);
		if (!match) continue;
		const [, file, row, column, message] = match;
		const at = file.lastIndexOf('node_modules/');
		const modulePath = at === -1 ? null : file.slice(at + 'node_modules/'.length);
		if (modulePath) {
			const segments = modulePath.split('/');
			const name = segments[0].startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
			if (!checkedPackages.has(name)) {
				foreign.set(name, (foreign.get(name) ?? 0) + 1);
				continue;
			}
			const entry = knownDeclarationErrors.find(
				(candidate) =>
					(typeof candidate.file === 'string'
						? candidate.file === modulePath
						: candidate.file.test(modulePath)) && message.includes(candidate.message)
			);
			if (entry) {
				known.add(entry);
				continue;
			}
		}
		failures.push(`${modulePath ?? path.relative(fixtureRoot, file)}:${row}:${column} ${message}`);
	}
	if (!stdout.includes('COMPLETED')) throw new Error(`svelte-check did not complete:\n${stdout}`);
	if (failures.length)
		throw new Error(`The packed library does not typecheck:\n- ${failures.join('\n- ')}`);
	if (foreign.size)
		console.log(
			`Ignored errors in dependency declarations: ${[...foreign].map(([name, count]) => `${name} (${count})`).join(', ')}.`
		);
	for (const entry of known) console.warn(`Known declaration bug, still present: ${entry.bug}.`);
	for (const entry of knownDeclarationErrors.filter((candidate) => !known.has(candidate)))
		console.warn(`Known declaration bug no longer reported, remove its entry: ${entry.bug}.`);
}

// Relative Markdown links of a packed page that do not resolve inside the package.
async function brokenLinks(file, packageRoot) {
	const broken = [];
	const source = await readFile(file, 'utf8');
	for (const [, target] of source.matchAll(/\]\(([^)\s]+)\)/g)) {
		if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
		const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
		if (!resolved.startsWith(packageRoot)) broken.push(`${target} (outside the package)`);
		else if (
			!(await access(resolved).then(
				() => true,
				() => false
			))
		)
			broken.push(target);
	}
	return broken;
}

// The agent docs and the skill ship in the package and must describe this version.
async function checkAgentDocs(packageRoot, version, expectedPages) {
	const problems = [];
	const llms = path.join(packageRoot, packageDocsDir, 'llms.txt');
	const llmsText = await readFile(llms, 'utf8').catch(() => null);
	if (llmsText === null) throw new Error(`The package must ship ${packageDocsDir}/llms.txt.`);
	if (!llmsText.includes(`Version ${version}.`))
		problems.push(`${packageDocsDir}/llms.txt does not name version ${version}`);
	const pages = await listSources(path.join(packageRoot, packageDocsDir, 'components'), (file) =>
		file.endsWith('.md')
	);
	if (pages.length !== expectedPages)
		problems.push(`${pages.length} packed component pages, expected ${expectedPages}`);
	const links = [...llmsText.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].length;
	if (links !== expectedPages)
		problems.push(`${packageDocsDir}/llms.txt links ${links} pages, expected ${expectedPages}`);
	for (const page of pages) {
		if (!(await readFile(page, 'utf8')).includes(`- Package version: entasis ${version}`)) {
			problems.push(`${path.relative(packageRoot, page)} does not name version ${version}`);
			break;
		}
	}
	const skillFiles = await listSources(path.join(packageRoot, packageSkillDir), (file) =>
		file.endsWith('.md')
	);
	const sourceSkillFiles = await listSources(path.join(repositoryRoot, canonicalSkillDir), (file) =>
		file.endsWith('.md')
	);
	if (!skillFiles.some((file) => file.endsWith(`${path.sep}SKILL.md`)))
		problems.push(`${packageSkillDir}/SKILL.md is not packed`);
	if (skillFiles.length !== sourceSkillFiles.length)
		problems.push(
			`${skillFiles.length} packed skill files, expected the ${sourceSkillFiles.length} of ${canonicalSkillDir}`
		);
	for (const file of [llms, ...skillFiles, ...pages]) {
		for (const target of await brokenLinks(file, packageRoot))
			problems.push(`${path.relative(packageRoot, file)} links to missing ${target}`);
	}
	if (problems.length)
		throw new Error(`Packed agent docs are incomplete:\n- ${problems.join('\n- ')}`);
	return { pages: pages.length, skillFiles: skillFiles.length };
}

try {
	// Written at pack time (git-ignored), so a standalone run packs the current docs too.
	const agentDocs = await writePackageDocs(repositoryRoot);
	const { stdout } = await run(
		'npm',
		['pack', '--ignore-scripts', '--json', '--pack-destination', fixtureRoot],
		repositoryRoot
	);
	// npm 11 prints `[record]`, npm 12 `{ "<name>": record }`; both carry the same record.
	const parsed = JSON.parse(stdout);
	const [packed] = Array.isArray(parsed) ? parsed : Object.values(parsed);
	const dependencies = { entasis: `file:${path.join(fixtureRoot, packed.filename)}` };
	for (const dependency of [
		'svelte',
		'typescript',
		'@sveltejs/vite-plugin-svelte',
		'tailwindcss',
		'svelte-check'
	]) {
		const installed = JSON.parse(
			await readFile(path.join(repositoryRoot, 'node_modules', dependency, 'package.json'), 'utf8')
		);
		dependencies[dependency] = installed.version;
	}
	// `ENTASIS_CHECK_SVELTE_VERSION=5.32.0` installs that Svelte in the consumer instead of the
	// repository's, so CI can run this check against the oldest version the peer range admits.
	if (process.env.ENTASIS_CHECK_SVELTE_VERSION) {
		dependencies.svelte = process.env.ENTASIS_CHECK_SVELTE_VERSION;
		// The repository's vite-plugin-svelte (7.x) requires Svelte 5.46.4 or later, so npm cannot
		// resolve it next to an older Svelte. 6.x is the newest line that accepts every Svelte 5.
		dependencies['@sveltejs/vite-plugin-svelte'] = '^6.2.4';
		// npm installs the SvelteKit peer itself, and the newest match (3.x) needs Svelte 5.56.4 and
		// vite-plugin-svelte 7: an app on the oldest Svelte is on SvelteKit 2.
		dependencies['@sveltejs/kit'] = '^2.43.5';
		console.log(`Consumer Svelte pinned to ${dependencies.svelte}.`);
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
	const packedDocs = await checkAgentDocs(packageRoot, metadata.version, agentDocs.pages);

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
	// An app-defined Form input: module augmentation of 'entasis/form' and its registration.
	await writeFile(
		path.join(fixtureRoot, 'src/form-input.ts'),
		await readFile(
			path.join(repositoryRoot, 'tooling/component-contract/consumer-form-input.ts'),
			'utf8'
		)
	);
	await writeFile(
		path.join(fixtureRoot, 'src/MoneyInput.svelte'),
		await readFile(
			path.join(repositoryRoot, 'tooling/component-contract/consumer-money-input.svelte'),
			'utf8'
		)
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
				skipLibCheck: false,
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
	// The consumer's own svelte-check: the repository's resolves its own Svelte for the component
	// shims, so a consumer on another Svelte would see two unrelated `Snippet` types.
	await typecheckConsumer();
	await run(process.execPath, [
		'--input-type=module',
		'-e',
		"import plugin from 'entasis/tailwind-plugin'; if (typeof plugin !== 'function') throw new Error('The Tailwind entrypoint must export its plugin.');"
	]);
	console.log(
		`Packed library passed: ${entrypointCount} entrypoints and ${symbolIndex} symbols, ${packedDocs.pages} Markdown pages and ${packedDocs.skillFiles} skill files, installed from ${packed.filename}.`
	);
} finally {
	await rm(fixtureRoot, { recursive: true, force: true });
}
