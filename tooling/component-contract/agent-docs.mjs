// The documentation an agent reads from the installed package, written at pack time:
//
// - `docs/llms.txt`, the index, and `docs/components/<id>.md`, one page per public component or
//   entrypoint, from the same `*.mcp.ts` descriptions the MCP server and the docs site serve;
// - `skills/entasis/`, a copy of the generated skill (`.claude/skills/entasis`).
//
// Both folders are git-ignored and listed in package.json `files`, so each published version
// carries the docs of its own source. `npm run generate:package-docs` writes them; prepack and
// `tooling/check-packed-library.mjs` run it before packing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { agentPages, componentMarkdown, llmsIndex, markdownPath } from './llms.mjs';
import { loadManifest } from './source.mjs';

export const packageDocsDir = 'docs';
export const packageSkillDir = 'skills/entasis';
export const canonicalSkillDir = '.claude/skills/entasis';

/** The public view of a manifest entry, as `componentInventory` publishes it. */
export function inventoryEntry(entry) {
	return {
		id: entry.id,
		subpath:
			entry.subpath === null
				? null
				: entry.subpath === './package.json'
					? 'entasis/package.json'
					: `entasis/${entry.subpath.slice(2)}`,
		sourceIndex: entry.sourceIndex,
		exportedSymbols: entry.exportedSymbols,
		docs: entry.docs,
		capabilities: entry.capabilities,
		relatedComponents: entry.relatedComponents,
		visibility: entry.visibility
	};
}

/**
 * The MCP description of every registry id (an entry's id and its documentation ids), read from
 * the `*.mcp.ts` sources without running them. A description is a string or a template with no
 * substitutions, which `generate.mjs` already requires.
 */
export async function readMcpDescriptions(entries, root) {
	const descriptions = new Map();
	for (const entry of entries) {
		if (!entry.mcp) continue;
		const file = path.join(root, 'src/lib', entry.mcp.source.replace(/\.js$/, '.ts'));
		let source;
		try {
			source = await fs.readFile(file, 'utf8');
		} catch (error) {
			if (error.code === 'ENOENT') continue;
			throw error;
		}
		const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
		let text;
		for (const statement of sourceFile.statements) {
			if (!ts.isVariableStatement(statement)) continue;
			for (const declaration of statement.declarationList.declarations) {
				if (!ts.isIdentifier(declaration.name) || declaration.name.text !== entry.mcp.exportName)
					continue;
				const initializer = declaration.initializer;
				if (initializer && ts.isStringLiteralLike(initializer)) text = initializer.text;
				else
					throw new Error(
						`${path.relative(root, file)}: ${entry.mcp.exportName} must be a string without substitutions`
					);
			}
		}
		if (text === undefined) continue;
		for (const id of new Set([entry.id, ...entry.docs.map((doc) => doc.id)]))
			descriptions.set(id, text);
	}
	return descriptions;
}

async function listFiles(directory) {
	const files = [];
	for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(filename)));
		else files.push(filename);
	}
	return files;
}

/** Writes `docs/` and `skills/entasis/` for the package. Returns what it wrote. */
export async function writePackageDocs(root) {
	const { version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
	const entries = await loadManifest();
	const inventory = entries.map(inventoryEntry);
	const descriptions = await readMcpDescriptions(entries, root);
	const pages = agentPages(inventory, (id) => descriptions.has(id));

	const docsRoot = path.join(root, packageDocsDir);
	await fs.rm(path.join(docsRoot, 'components'), { recursive: true, force: true });
	await fs.mkdir(path.join(docsRoot, 'components'), { recursive: true });
	for (const page of pages) {
		await fs.writeFile(
			path.join(docsRoot, markdownPath(page.id)),
			componentMarkdown({ page, description: descriptions.get(page.id), inventory, version })
		);
	}
	await fs.writeFile(
		path.join(docsRoot, 'llms.txt'),
		llmsIndex({
			inventory,
			describe: (id) => descriptions.get(id),
			version,
			footer:
				'This folder ships in the `entasis` package and matches the installed version. The agent skill that tells you how to build, make agent-ready and test an interface with entasis is `../skills/entasis/SKILL.md`.'
		})
	);

	const skillRoot = path.join(root, packageSkillDir);
	await fs.rm(skillRoot, { recursive: true, force: true });
	const skillFiles = (await listFiles(path.join(root, canonicalSkillDir))).filter((file) =>
		file.endsWith('.md')
	);
	for (const file of skillFiles) {
		const target = path.join(skillRoot, path.relative(path.join(root, canonicalSkillDir), file));
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.copyFile(file, target);
	}
	return { version, pages: pages.length, skillFiles: skillFiles.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const root = path.resolve(import.meta.dirname, '../..');
	const { version, pages, skillFiles } = await writePackageDocs(root);
	console.log(
		`Package docs for entasis ${version}: ${pages} pages in ${packageDocsDir}/, ${skillFiles} skill files in ${packageSkillDir}/.`
	);
}
