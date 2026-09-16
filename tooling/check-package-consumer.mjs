// Compiles every block against the packaged `dist` the way a real consumer would.
// Documentation code fences are checked separately by `check-doc-fences.mjs`.
import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createConsumerFixture, listFiles, repositoryRoot } from './consumer-fixture.mjs';

const blockRoot = path.join(repositoryRoot, 'src/routes/blocks');

const blockFiles = await listFiles(
	blockRoot,
	(file) =>
		(file.endsWith('/Block.svelte') && !file.includes('/cta-1/')) ||
		(file.startsWith(path.join(blockRoot, 'catalog') + path.sep) && file.endsWith('.svelte'))
);
if (blockFiles.length === 0) throw new Error('No package-consumer blocks found.');

const fixture = await createConsumerFixture();
try {
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
			`Package-consumer blocks failed:\n- ${errors
				.map((e) => `${e.file}:${e.line}:${e.column} ${e.message}`)
				.join('\n- ')}`
		);
	}
	console.log(`Package-consumer blocks passed (${blockFiles.length} blocks).`);
} finally {
	await fixture.dispose();
}
