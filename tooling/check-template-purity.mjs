// Templates are stress tests of the design system: they may use entasis components, their props,
// the layout primitives and the theme tokens — nothing else. This check fails on every way a
// template could fake a look instead of exercising the library.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'src/routes/templates');
const files = [];
const walk = (dir) => {
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) walk(full);
		else if (full.endsWith('.svelte')) files.push(full);
	}
};
walk(root);

const rules = [
	{
		name: 'arbitrary value or variant (`[...]`) in a class',
		regex: /class(?:Name)?=(?:"[^"]*\[|\{[^}]*\[)/g
	},
	{
		name: 'arbitrary class in a string constant',
		regex: /['"`][^'"`\n]*(?:^|\s)[a-z-]*\[[^\]]+\][^'"`\n]*['"`]/g
	},
	{ name: 'component theme override', regex: /\btheme=\{/g },
	{ name: 'inline style outside the root token block', regex: /\bstyle=(?!\{templateStyle\})/g },
	{ name: 'raw pixel value', regex: /\b\d+px\b/g },
	{ name: 'hex colour', regex: /#[0-9a-fA-F]{3,8}\b/g },
	{ name: 'data-slot / data-sidebar selector', regex: /\[data-(?:slot|sidebar)/g }
];

const errors = [];
for (const file of files) {
	const source = readFileSync(file, 'utf8');
	// The root token block (the one `style={templateStyle}` element and the constants feeding it)
	// is the single place hex colours and px are allowed; it is marked with `<!-- tokens -->` /
	// `// tokens` fences so everything else is checked.
	const checked = source.replace(/\/\/ tokens:start[\s\S]*?\/\/ tokens:end/g, '');
	for (const rule of rules) {
		for (const match of checked.matchAll(rule.regex)) {
			const line = checked.slice(0, match.index).split('\n').length;
			errors.push(
				`${path.relative(process.cwd(), file)}:${line}: ${rule.name} — ${match[0].slice(0, 80)}`
			);
		}
	}
}

if (errors.length) {
	console.error(`Template purity check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
	process.exit(1);
}
console.log(`Template purity check passed (${files.length} template files).`);
