/**
 * Static fixtures for the design-review stress test route.
 * Everything here is inert sample data: no network calls, no CDN assets.
 */
import type { Colors, Density, Sizes } from '$lib/types/theme.js';

export const colors = [
	'primary',
	'secondary',
	'neutral',
	'danger',
	'success',
	'warning',
	'info'
] as const satisfies readonly Colors[];

export const sizes = ['small', 'normal', 'large'] as const satisfies readonly Sizes[];

export const densities = ['compact', 'normal', 'comfortable'] as const satisfies readonly Density[];

/** 20ms of silence. Keeps AudioPlayer renderable without hitting the network. */
export const silentAudio =
	'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';

const svgAsset = (hue: number, label: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue} 70% 55%)"/><stop offset="100%" stop-color="hsl(${hue + 40} 70% 35%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><text x="160" y="108" font-family="system-ui,sans-serif" font-size="22" fill="white" text-anchor="middle">${label}</text></svg>`
	)}`;

export const imageOne = svgAsset(210, 'Landscape 1');
export const imageTwo = svgAsset(150, 'Landscape 2');
export const imageThree = svgAsset(30, 'Landscape 3');
export const posterImage = svgAsset(280, 'Video poster');

export const avatarItems = [
	{ name: 'Ari Martin' },
	{ name: 'Sam Lee' },
	{ name: 'Noa Chen' },
	{ name: 'Joan Kim' },
	{ name: 'Ines Roy' }
];

export const selectItems = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'review', label: 'In review' },
	{ value: 'published', label: 'Published' },
	{ value: 'archived', label: 'Archived', disabled: true }
];

export const comboboxItems = [
	{ value: 'svelte', label: 'Svelte', description: 'Compiler-first UI framework' },
	{ value: 'tailwind', label: 'Tailwind', description: 'Utility-first CSS' },
	{ value: 'vite', label: 'Vite', description: 'Dev server and bundler' }
];

export const checkboxOptions = [
	{ value: 'email', label: 'Email', description: 'Weekly digest' },
	{ value: 'sms', label: 'SMS' },
	{ value: 'push', label: 'Push', disabled: true }
];

export const radioOptions = [
	{ value: 'starter', label: 'Starter', description: '1 seat' },
	{ value: 'team', label: 'Team', description: 'Up to 20 seats' },
	{ value: 'enterprise', label: 'Enterprise', disabled: true }
];

export const tagGroupOptions = [
	{ value: 'design', label: 'Design' },
	{ value: 'engineering', label: 'Engineering' },
	{ value: 'product', label: 'Product' }
];

export const tableHeader = { member: 'Member', event: 'Event', time: 'Time' };
export const tableRows = [
	{ cells: { member: 'Ari Martin', event: 'Published report', time: '2m ago' } },
	{ cells: { member: 'Sam Lee', event: 'Updated roadmap', time: '18m ago' } },
	{ cells: { member: 'Noa Chen', event: 'Invited 3 members', time: '1h ago' } }
];

export type Person = {
	id: string;
	name: string;
	department: string;
	status: 'active' | 'paused';
	salary: number;
};

export const people: Person[] = [
	{ id: 'p1', name: 'Ari Martin', department: 'Design', status: 'active', salary: 92000 },
	{ id: 'p2', name: 'Sam Lee', department: 'Engineering', status: 'active', salary: 118000 },
	{ id: 'p3', name: 'Noa Chen', department: 'Product', status: 'paused', salary: 104000 },
	{ id: 'p4', name: 'Joan Kim', department: 'Engineering', status: 'active', salary: 127000 },
	{ id: 'p5', name: 'Ines Roy', department: 'Design', status: 'paused', salary: 88000 }
];

export const treePaths = [
	'app.html',
	'src/app.css',
	'src/lib/components/Button.svelte',
	'src/lib/components/Tree/Tree.svelte',
	'src/routes/+layout.svelte',
	'src/routes/+page.svelte',
	'vite.config.ts'
] as const;

export const carouselItems = [
	{ title: 'Signal', body: 'A compact slide.' },
	{ title: 'Orbit', body: 'The second slide.' },
	{ title: 'Focus', body: 'The third slide.' },
	{ title: 'Scale', body: 'The fourth slide.' },
	{ title: 'Preview', body: 'The fifth slide.' }
];

export const sampleCode = `export const greet = (name: string) => {
	return \`Hello \${name}\`;
};`;

export const sampleMarkdown = `## Markdown heading

Body copy with **bold**, _italic_ and \`inline code\`.

- First item
- Second item

> A blockquote for tone checking.`;

export const samplePatch = `diff --git a/src/greet.ts b/src/greet.ts
--- a/src/greet.ts
+++ b/src/greet.ts
@@ -1,3 +1,3 @@
-export const greet = (name) => {
-	return 'Hello ' + name;
+export const greet = (name: string) => {
+	return \`Hello \${name}\`;
 };
`;
