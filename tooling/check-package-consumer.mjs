// Compiles every block against the packaged `dist` the way a real consumer would, and
// checks that every bare module `dist` imports is one that consumer's install provides.
// Documentation code fences are checked separately by `check-doc-fences.mjs`.
import { cp, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { createConsumerFixture, listFiles, repositoryRoot } from './consumer-fixture.mjs';

const blockRoot = path.join(repositoryRoot, 'src/routes/blocks');
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
const eventCalendarWitness = `<script lang="ts">
	import {
		EventCalendar,
		type EventCalendarApi,
		type EventCalendarItem,
		type EventCalendarResource
	} from 'entasis/event-calendar';

	type ItemFields = { owner: string };
	type ResourceFields = { capacity: number };

	let items = $state<EventCalendarItem<ItemFields>[]>([
		{
			id: 'planning',
			title: 'Planning',
			start: new Date('2026-09-19T09:00:00Z'),
			end: new Date('2026-09-19T10:00:00Z'),
			owner: 'Arnaud'
		}
	]);
	let resources = $state<EventCalendarResource<ResourceFields>[]>([
		{ id: 'room-a', title: 'Room A', capacity: 8 }
	]);
	let date = $state(new Date('2026-09-19T09:00:00Z'));
	let calendar = $state<EventCalendarApi<ItemFields> | null>(null);
	let owner = $state('');
</script>

<EventCalendar
	bind:this={calendar}
	bind:items
	{resources}
	bind:date
	timeZone="UTC"
	aria-label="Schedule"
	data-owner={owner}
	onkeydown={(event) => {
		owner = event.currentTarget.dataset.owner ?? '';
	}}
>
	{#snippet item({ occurrence })}
		<span>{occurrence.item.owner}</span>
	{/snippet}
	{#snippet resourceHeader({ resource })}
		<span>{resource?.capacity ?? 0}</span>
	{/snippet}
</EventCalendar>

<p>{calendar?.getOccurrence('planning')?.item.owner}</p>
`;

// `skipLibCheck` hides unresolved imports inside `dist/**/*.d.ts`, so svelte-check alone
// cannot prove the package resolves. Read the emitted modules instead: every bare specifier
// must be declared as a dependency or a peer dependency, which is exactly what the fixture
// links. This is what catches a framework import (`$app/*`) or a runtime dependency that
// was moved to an optional peer without its components documenting the install.
// `ts.preProcessFile` sees real imports only, so the import examples inside the docs
// constants (`*.mcp.js`, the icon guide) are not mistaken for dependencies.
const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/g;
// SvelteKit's virtual modules are provided by the `@sveltejs/kit` peer.
const packageOf = (specifier) =>
	specifier.startsWith('$app/') || specifier.startsWith('$env/') || specifier === '$service-worker'
		? '@sveltejs/kit'
		: specifier.startsWith('@')
			? specifier.split('/').slice(0, 2).join('/')
			: specifier.split('/')[0];
const importsOf = (source) =>
	ts.preProcessFile(source, true, true).importedFiles.map((entry) => entry.fileName);

const declared = new Set([
	...Object.keys(manifest.dependencies ?? {}),
	...Object.keys(manifest.peerDependencies ?? {}),
	// The package may reference its own entrypoints, and `svelte/*` is the framework itself.
	'entasis',
	'svelte'
]);
const optionalPeers = new Set(
	Object.entries(manifest.peerDependenciesMeta ?? {})
		.filter(([, meta]) => meta?.optional)
		.map(([name]) => name)
);
// Whatever `files` excludes never reaches a consumer, so it is not consumer surface.
const unpublished = (manifest.files ?? [])
	.filter((entry) => entry.startsWith('!'))
	.map(
		(entry) =>
			new RegExp(
				`^${entry
					.slice(1)
					.replace(/[.+^${}()|[\]\\]/g, '\\$&')
					.replace(/\*\*\/|\*/g, (wildcard) => (wildcard === '*' ? '[^/]*' : '(?:.*/)?'))}$`
			)
	);
const distFiles = await listFiles(path.join(repositoryRoot, 'dist'), (file) => {
	if (!/\.(js|svelte|d\.ts)$/.test(file)) return false;
	const published = path.relative(repositoryRoot, file).split(path.sep).join('/');
	return !unpublished.some((pattern) => pattern.test(published));
});
const undeclared = new Map();
const optionalUse = new Map();
for (const file of distFiles) {
	const source = await readFile(file, 'utf8');
	const specifiers = file.endsWith('.svelte')
		? [...source.matchAll(scriptRe)].flatMap((match) => importsOf(match[1]))
		: importsOf(source);
	for (const specifier of specifiers) {
		if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) {
			continue;
		}
		const name = packageOf(specifier);
		const relative = path.relative(repositoryRoot, file);
		if (!declared.has(name)) {
			if (!undeclared.has(name)) undeclared.set(name, `${specifier} in ${relative}`);
		} else if (optionalPeers.has(name)) {
			if (!optionalUse.has(name)) optionalUse.set(name, new Set());
			optionalUse.get(name).add(path.dirname(relative).split(path.sep).join('/'));
		}
	}
}
if (undeclared.size) {
	throw new Error(
		`The packaged dist imports modules a consumer does not install:\n- ${[...undeclared.values()].join('\n- ')}`
	);
}
const optionalOwners = [...optionalUse]
	.map(([name, owners]) => `${name} (${[...owners].sort().join(', ')})`)
	.sort();
console.log(
	`Packaged imports are all declared (${distFiles.length} modules). Optional peers: ${optionalOwners.join('; ')}.`
);

const blockFiles = await listFiles(
	blockRoot,
	(file) =>
		(file.endsWith('/Block.svelte') && !file.includes('/cta-1/')) ||
		(file.startsWith(path.join(blockRoot, 'catalog') + path.sep) && file.endsWith('.svelte'))
);
if (blockFiles.length === 0) throw new Error('No package-consumer blocks found.');

const fixture = await createConsumerFixture();
try {
	await fixture.write('src/EventCalendarConsumer.svelte', eventCalendarWitness);
	const imports = [];
	const components = [];
	for (const [index, blockFile] of blockFiles.entries()) {
		const relativeFile = path.relative(blockRoot, blockFile);
		const destination = path.join(fixture.root, 'src/blocks', relativeFile);
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(blockFile, destination);
		imports.push(`import Block${index} from './blocks/${relativeFile.split(path.sep).join('/')}';`);
		components.push(`<Block${index} />`);
	}
	await fixture.write(
		'src/App.svelte',
		`<script lang="ts">\n${imports.join('\n')}\n</script>\n${components.join('\n')}\n`
	);

	const errors = (await fixture.svelteCheck()).filter((d) => d.type === 'ERROR');
	if (errors.length) {
		throw new Error(
			`Package-consumer fixture failed:\n- ${errors
				.map((e) => `${e.file}:${e.line}:${e.column} ${e.message}`)
				.join('\n- ')}`
		);
	}
	console.log(
		`Package-consumer fixture passed (${blockFiles.length} blocks + EventCalendar witness).`
	);
} finally {
	await fixture.dispose();
}
