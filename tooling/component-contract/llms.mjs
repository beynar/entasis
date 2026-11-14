// Markdown documentation for agents, built from the component contract and the MCP descriptions.
// Pure functions shared by the docs site (`/llms.txt`, `/components/<id>.md`), the packed
// `docs/` folder and the generated skill reference, so the three never say different things.
// No Node imports: the docs site bundles this module into its Cloudflare worker.

/**
 * @typedef {object} InventoryDoc
 * @property {string} id
 * @property {string} route
 * @property {string} category
 * @property {string} label
 */

/**
 * The shape of `componentInventory` in `src/lib/generated/componentContract.ts`.
 * @typedef {object} InventoryEntry
 * @property {string} id
 * @property {string | null} subpath Public specifier, such as `entasis/card`.
 * @property {readonly string[] | { readonly pattern: readonly string[]; readonly modules: Readonly<Record<string, readonly string[]>> }} exportedSymbols
 * @property {readonly InventoryDoc[]} docs
 * @property {readonly string[]} capabilities
 * @property {readonly string[]} relatedComponents
 * @property {'public' | 'internal'} visibility
 */

/**
 * One Markdown page: a documentation id (`card`, `grid-span`) and the entry that owns it.
 * @typedef {object} AgentPage
 * @property {string} id
 * @property {InventoryEntry} entry
 * @property {InventoryDoc | undefined} doc
 */

export const siteUrl = 'https://entasis.beynar.workers.dev';

/** Where an id's Markdown lives, relative to the site root and to the packed `docs/` folder. */
export const markdownPath = (/** @type {string} */ id) => `components/${id}.md`;

/**
 * Every public documentation id with a description, in manifest order.
 * @param {readonly InventoryEntry[]} inventory
 * @param {(id: string) => boolean} hasDescription
 * @returns {AgentPage[]}
 */
export function agentPages(inventory, hasDescription) {
	/** @type {AgentPage[]} */
	const pages = [];
	const seen = new Set();
	for (const entry of inventory) {
		if (entry.visibility !== 'public' || !entry.subpath) continue;
		for (const id of [entry.id, ...entry.docs.map((doc) => doc.id)]) {
			if (seen.has(id) || !hasDescription(id)) continue;
			seen.add(id);
			pages.push({ id, entry, doc: entry.docs.find((doc) => doc.id === id) });
		}
	}
	return pages;
}

/** @param {AgentPage} page */
export const pageTitle = (page) => page.doc?.label ?? page.entry.subpath ?? page.id;

/**
 * The first sentence of a description's first prose paragraph, for one-line indexes.
 * @param {string} description
 */
export function summarize(description) {
	const paragraphs = description
		.replace(/```[\s\S]*?```/g, '')
		.split(/\n\s*\n/)
		.map((paragraph) =>
			paragraph
				.trim()
				.replace(/\s+/g, ' ')
				// "Import X from `entasis/x`." says nothing the index does not already show.
				.replace(/^Import\b[^.]*?\bfrom `[^`]+`\.?\s*/i, '')
		)
		.filter((paragraph) => paragraph && !/^(#|[-*|>@]|\d+\.|`[^`]*`$)/.test(paragraph));
	const paragraph = paragraphs[0] ?? '';
	const sentence = paragraph.match(/^.+?[.!?](?=\s+[A-Z`(]|$)/)?.[0] ?? paragraph;
	return sentence.length > 240 ? `${sentence.slice(0, 237).trimEnd()}…` : sentence;
}

/** @param {InventoryEntry} entry */
function importLine(entry) {
	const symbols = entry.exportedSymbols;
	if (!entry.subpath) return null;
	if (Array.isArray(symbols)) {
		if (!symbols.length) return `\`${entry.subpath}\``;
		return `\`${entry.subpath}\`, exporting ${symbols.map((name) => `\`${name}\``).join(', ')}`;
	}
	const pattern = /** @type {{ pattern: readonly string[] }} */ (symbols).pattern;
	return `\`${entry.subpath.replace('*', '<name>')}\`, each exporting ${pattern
		.map((name) => `\`${name.replaceAll('{name}', '<name>')}\``)
		.join(', ')}`;
}

/**
 * The Markdown page of one id: its MCP description, then where it comes from.
 * @param {object} options
 * @param {AgentPage} options.page
 * @param {string} options.description
 * @param {readonly InventoryEntry[]} options.inventory
 * @param {string} [options.version] Package version, written into the page.
 * @param {string} [options.base] Site origin for the HTML page link.
 */
export function componentMarkdown({ page, description, inventory, version, base = siteUrl }) {
	const body = description.trim();
	const heading = /^#\s/.test(body) ? '' : `# ${pageTitle(page)}\n\n`;
	const labels = new Map();
	for (const entry of inventory) {
		for (const doc of entry.docs) labels.set(doc.id, doc.label);
		if (!labels.has(entry.id)) labels.set(entry.id, entry.subpath ?? entry.id);
	}
	const related = page.entry.relatedComponents
		.filter((id) => labels.has(id))
		.map((id) => `[${labels.get(id)}](${id}.md)`);
	const lines = [
		`- Import: ${importLine(page.entry)}`,
		page.doc ? `- Category: ${page.doc.category}` : null,
		page.doc ? `- Documentation page: ${base}${page.doc.route}` : null,
		related.length ? `- Related: ${related.join(', ')}` : null,
		version ? `- Package version: entasis ${version}` : null
	].filter(Boolean);
	return `${heading}${body}\n\n## Package\n\n${lines.join('\n')}\n`;
}

/**
 * The llms.txt index: one line per component and utility, linking its Markdown page.
 * @param {object} options
 * @param {readonly InventoryEntry[]} options.inventory
 * @param {(id: string) => string | undefined} options.describe The MCP description of an id.
 * @param {string} [options.version]
 * @param {string} [options.base] Prefix of every link: the site origin plus `/`, or `''` for links relative to the packed `docs/` folder.
 * @param {string} [options.footer] Extra Markdown placed before the index.
 */
export function llmsIndex({ inventory, describe, version, base = '', footer = '' }) {
	const pages = agentPages(inventory, (id) => describe(id) !== undefined);
	/** @type {Map<string, string[]>} */
	const sections = new Map();
	for (const page of pages) {
		const section = page.doc?.category ?? 'Utilities and entrypoints';
		const summary = summarize(describe(page.id) ?? '');
		const specifier = page.doc ? ` \`${page.entry.subpath}\`.` : '';
		const line = `- [${pageTitle(page)}](${base}${markdownPath(page.id)}):${specifier}${summary ? ` ${summary}` : ''}`;
		sections.set(section, [...(sections.get(section) ?? []), line]);
	}
	const entrypoints = sections.get('Utilities and entrypoints');
	sections.delete('Utilities and entrypoints');
	if (entrypoints) sections.set('Utilities and entrypoints', entrypoints);
	const intro = [
		'# entasis',
		'',
		'> A Svelte 5 component library for SvelteKit, configured through props and themed by a Tailwind CSS plugin. Every component and utility is imported from its own subpath, such as `entasis/button`; there is no root import.',
		'',
		`${version ? `Version ${version}. ` : ''}Each link below is the Markdown documentation of one component or entrypoint: its props, data model, theme parts and accessibility notes, the same text the entasis MCP server returns.`,
		footer ? `\n${footer.trim()}` : null
	].filter((line) => line !== null);
	return `${intro.join('\n')}\n\n${[...sections]
		.map(([section, lines]) => `## ${section}\n\n${lines.join('\n')}`)
		.join('\n\n')}\n`;
}
