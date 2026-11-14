// Which manifest components have the tests the library requires of every component, and which
// styling-hook maps law 12 requires of overlay and list owners. `check.mjs` compares the result with
// the exemptions file; this module only measures, so the node:test suite can run it on a fixture.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/** What every component entry owes, by requirement name. */
export const requirements = {
	browser: 'a `*.browser.test.ts` in its directory, or one that imports it directly',
	ssr: 'a `*.ssr.test.ts` in its directory, or one that imports it directly',
	attributes: 'an `<owner>.attributes.ts` exporting its data attributes and CSS variables (law 12)'
};

// Law 12: overlays and lists write the shared styling hooks and export them from
// `<owner>.attributes.ts`. Every Overlays and Menus entry is one, except a menu row; these list and
// disclosure owners are the others. Tree is left out: its rows are drawn by @pierre/trees.
const law12Categories = new Set(['Overlays', 'Menus']);
const law12NotOwners = new Set(['menu-option']);
const law12Owners = new Set([
	'select',
	'combobox',
	'autocomplete',
	'command',
	'navigation-menu',
	'accordion',
	'collapsible'
]);

export function isLaw12Owner(entry) {
	if (law12NotOwners.has(entry.id)) return false;
	return law12Owners.has(entry.id) || entry.docs.some((doc) => law12Categories.has(doc.category));
}

/** Component entries with a directory of their own, the unit the requirements apply to. */
export function componentEntries(manifest) {
	return manifest
		.filter((entry) => entry.capabilities.includes('component') && !entry.sourceIndex.includes('*'))
		.map((entry) => ({ ...entry, directory: path.posix.dirname(entry.sourceIndex) }));
}

async function listFiles(root, directory) {
	const files = [];
	let entries;
	try {
		entries = await readdir(path.join(root, directory), { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') return files;
		throw error;
	}
	for (const entry of entries) {
		const relative = path.posix.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(root, relative)));
		else files.push(relative);
	}
	return files;
}

const browserTest = /\.browser\.(test|spec)\.[jt]s$/;
const ssrTest = /\.ssr\.(test|spec)\.[jt]s$/;
const attributesFile = /\.attributes\.ts$/;

/** Module specifiers and path-like string literals a test file names. */
function referencedSpecifiers(source, filename) {
	const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, false);
	const specifiers = new Set();
	const visit = (node) => {
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			// A type-only import proves nothing about rendering.
			const typeOnly = ts.isImportDeclaration(node)
				? node.importClause?.isTypeOnly
				: node.isTypeOnly;
			if (!typeOnly) specifiers.add(node.moduleSpecifier.text);
			return;
		} else if (ts.isStringLiteralLike(node) && /^(\.\.?\/|\$lib\/|entasis\/)/.test(node.text)) {
			// Dynamic imports and table-driven tests (`load('./Form/Select/Select.svelte')`).
			specifiers.add(node.text);
		}
		ts.forEachChild(node, visit);
	};
	visit(file);
	return specifiers;
}

/**
 * Measures every component entry. `root` is the repository; `manifest` the loaded contract.
 * Returns `{ id, directory, law12, has: { browser, ssr, attributes } }` per entry.
 */
export async function measureCoverage(root, manifest) {
	const entries = componentEntries(manifest);
	// Deepest directory first, so `Form/Select` owns its files before a shallower entry could.
	const byDepth = [...entries].sort((a, b) => b.directory.length - a.directory.length);
	const ownerOf = (file) =>
		byDepth.find((entry) => file === entry.directory || file.startsWith(`${entry.directory}/`));
	const subpaths = new Map(
		manifest
			.filter((entry) => entry.subpath && !entry.sourceIndex.includes('*'))
			.map((entry) => [`entasis/${entry.subpath.slice(2)}`, path.posix.dirname(entry.sourceIndex)])
	);

	const resolve = (specifier, from) => {
		if (specifier.startsWith('$lib/')) return path.posix.join('src/lib', specifier.slice(5));
		if (specifier.startsWith('entasis/')) return subpaths.get(specifier);
		if (specifier.startsWith('.')) return path.posix.join(path.posix.dirname(from), specifier);
		return undefined;
	};

	const files = await listFiles(root, 'src');
	const covered = { browser: new Set(), ssr: new Set() };
	for (const file of files) {
		const kind = browserTest.test(file) ? 'browser' : ssrTest.test(file) ? 'ssr' : undefined;
		if (!kind) continue;
		const owners = new Set([ownerOf(file)?.id]);
		const source = await readFile(path.join(root, file), 'utf8');
		for (const specifier of referencedSpecifiers(source, file)) {
			const target = resolve(specifier, file);
			if (target) owners.add(ownerOf(target)?.id);
		}
		for (const id of owners) if (id) covered[kind].add(id);
	}

	const withAttributes = new Set(
		files.filter((file) => attributesFile.test(file)).map((file) => ownerOf(file)?.id)
	);

	return entries.map((entry) => ({
		id: entry.id,
		directory: entry.directory,
		law12: isLaw12Owner(entry),
		has: {
			browser: covered.browser.has(entry.id),
			ssr: covered.ssr.has(entry.id),
			attributes: withAttributes.has(entry.id)
		}
	}));
}

/** Requirement names an entry owes. */
export const owed = (measured) =>
	Object.keys(requirements).filter((name) => name !== 'attributes' || measured.law12);

/**
 * Compares measurements with exemptions (`{ [id]: { [requirement]: reason } }`). `baseExemptions`,
 * when given, is the file at the merge base: a `todo` it did not have is refused, so the list of
 * known gaps can only shrink.
 */
export function compare(measurements, exemptions, baseExemptions) {
	const errors = [];
	const byId = new Map(measurements.map((measured) => [measured.id, measured]));

	for (const measured of measurements) {
		for (const requirement of owed(measured)) {
			if (measured.has[requirement]) continue;
			if (exemptions[measured.id]?.[requirement]) continue;
			errors.push(
				`${measured.id} (${measured.directory}) has no ${requirement} coverage: add ${requirements[requirement]}, or an exemption with a reason.`
			);
		}
	}

	for (const [id, entryExemptions] of Object.entries(exemptions)) {
		const measured = byId.get(id);
		if (!measured) {
			errors.push(
				`Exemption for ${id}, which is not a component entry in the manifest: remove it.`
			);
			continue;
		}
		for (const [requirement, reason] of Object.entries(entryExemptions)) {
			if (!(requirement in requirements)) {
				errors.push(`Exemption ${id}.${requirement} names an unknown requirement.`);
			} else if (!owed(measured).includes(requirement)) {
				errors.push(`Exemption ${id}.${requirement} exempts a requirement ${id} does not owe.`);
			} else if (typeof reason !== 'string' || !reason.trim()) {
				errors.push(`Exemption ${id}.${requirement} needs a reason ("todo" for a known gap).`);
			} else if (measured.has[requirement]) {
				errors.push(
					`Exemption ${id}.${requirement} is stale: the requirement is met now, remove the exemption.`
				);
			} else if (baseExemptions && reason.trim() === 'todo' && !baseExemptions[id]?.[requirement]) {
				errors.push(
					`Exemption ${id}.${requirement} is a new "todo": known gaps only shrink. Add the test, or give a reason it cannot exist.`
				);
			}
		}
	}
	return errors;
}

/** The exemptions that would make today's tree pass: kept reasons, `todo` for new gaps. */
export function seed(measurements, exemptions) {
	const next = {};
	for (const measured of measurements) {
		for (const requirement of owed(measured)) {
			if (measured.has[requirement]) continue;
			next[measured.id] ??= {};
			next[measured.id][requirement] = exemptions[measured.id]?.[requirement] ?? 'todo';
		}
	}
	return next;
}
