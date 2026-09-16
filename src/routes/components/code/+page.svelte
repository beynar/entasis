<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Code from '$lib/components/Code/Code.svelte';

	const controls = createComponentControls([
		{ name: 'showHeader', type: 'switch', label: 'Header', value: true },
		{ name: 'showLineNumbers', type: 'switch', label: 'Line numbers', value: false },
		{ name: 'wrap', type: 'switch', label: 'Wrap', value: false }
	]);

	const tsCode = `import { createHighlighter } from './highlighter.js';

export type User = {
	id: string;
	name: string;
	admin?: boolean;
};

// Fetch a user by id, falling back to a guest.
export async function getUser(id: string): Promise<User> {
	const res = await fetch(\`/api/users/\${id}?include=permissions,preferences,teams,projects,notifications,security-settings\`);
	if (!res.ok) return { id: 'guest', name: 'Guest' };
	return res.json();
}`;

	const longLineCode = `const message = "This is a deliberately very long single line of code that would normally force a horizontal scrollbar, but with wrap enabled it soft-wraps onto the next visual line instead.";`;

	const tabbedCode = `function greet(name) {
	if (name) {
		return \`Hello, \${name}!\`;
	}
	return 'Hello!';
}`;

	const svelteCode = `<script lang="ts">
	let count = $state(0);
	const double = $derived(count * 2);
</scr${'ipt'}>

<button onclick={() => count++}>
	clicked {count} {count === 1 ? 'time' : 'times'}
</button>
<p>double: {double}</p>`;

	const cssCode = `.card {
	display: grid;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: var(--color-surface);
	color: var(--color-neutral);
	/* adapts to the active theme */
	box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
}`;

	const jsonCode = `{
	"name": "svelai",
	"version": "1.0.0",
	"private": true,
	"scripts": {
		"dev": "vite dev",
		"build": "vite build"
	},
	"dependencies": {
		"@tanstack/highlight": "^0.1.0"
	}
}`;

	const bashCode = `# install dependencies
pnpm install

# start the dev server
pnpm dev --open`;

	const pythonCode = `from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float

    def distance(self, other: "Point") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5


origin = Point(0, 0)
print(f"distance = {origin.distance(Point(3, 4))}")`;
</script>

<DocPage
	title="Code"
	subtitle="Syntax-highlighted code blocks with a copy button, optional line numbers, and header/footer slots. Colors adapt to light and dark automatically from the design tokens."
	component="Code"
	features={[
		'TanStack Highlight with every language bundled',
		'SSR-safe synchronous highlighter',
		'One-click copy with copied feedback',
		'ScrollArea for long code blocks',
		'CSS-variable theme adapts light/dark'
	]}
>
	<ComponentCard
		{controls}
		description="Pass a language id and source string — colors adapt to the active theme."
		class="!min-h-fit"
		code={`<Code
	language="typescript"
	code={tsCode}
	showHeader={${controls.value.showHeader}}
	showLineNumbers={${controls.value.showLineNumbers}}
	wrap={${controls.value.wrap}}
/>`}
	>
		<div class="w-full max-w-2xl">
			<Code
				language="typescript"
				code={tsCode}
				showHeader={controls.value.showHeader}
				showLineNumbers={controls.value.showLineNumbers}
				wrap={controls.value.wrap}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="One bundled, SSR-safe highlighter covers many grammars. Pass a string language id — aliases like ts, js, sh resolve automatically."
			class="!min-h-fit"
			code={`<Code language="typescript" code={tsCode} />
<Code language="svelte" code={svelteCode} />
<Code language="css" code={cssCode} />
<Code language="json" code={jsonCode} />
<Code language="bash" code={bashCode} />
<Code language="python" code={pythonCode} />`}
		>
			<div class="grid w-full max-w-2xl gap-4">
				<Code language="typescript" code={tsCode} />
				<Code language="svelte" code={svelteCode} />
				<Code language="css" code={cssCode} />
				<Code language="json" code={jsonCode} />
				<Code language="bash" code={bashCode} />
				<Code language="python" code={pythonCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Set a custom title in the header and toggle the line-number gutter."
			class="!min-h-fit"
			code={`<Code language="typescript" title="get-user.ts" showLineNumbers code={tsCode} />`}
		>
			<div class="w-full max-w-2xl">
				<Code language="typescript" title="get-user.ts" showLineNumbers code={tsCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Add a footer row for hints, a token count, or a run action."
			class="!min-h-fit"
			code={`<Code language="bash" title="Terminal" code={bashCode}>
	{#snippet footer()}
		<span>Run from your project root.</span>
		<span class="font-mono">2 commands</span>
	{/snippet}
</Code>`}
		>
			<div class="w-full max-w-2xl">
				<Code language="bash" title="Terminal" code={bashCode}>
					{#snippet footer()}
						<span>Run from your project root.</span>
						<span class="font-mono">2 commands</span>
					{/snippet}
				</Code>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Set copyable={false} to hide the copy control while keeping the header label."
			class="!min-h-fit"
			code={`<Code language="json" copyable={false} code={jsonCode} />`}
		>
			<div class="w-full max-w-2xl">
				<Code language="json" copyable={false} code={jsonCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="showHeader={false} renders only the code; hover to reveal the floating copy button top-right."
			class="!min-h-fit"
			code={`<Code language="typescript" showHeader={false} code={tsCode} />`}
		>
			<div class="w-full max-w-2xl">
				<Code language="typescript" showHeader={false} code={tsCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Set maxHeight to cap the block and scroll long code via the ScrollArea."
			class="!min-h-fit"
			code={`<Code language="typescript" title="get-user.ts" maxHeight={220} showLineNumbers code={tsCode} />`}
		>
			<div class="w-full max-w-2xl">
				<Code
					language="typescript"
					title="get-user.ts"
					maxHeight={220}
					showLineNumbers
					code={tsCode}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Long lines scroll horizontally via the ScrollArea (hover to reveal the scrollbar)."
			class="!min-h-fit"
			code={`<Code language="typescript" title="long-line.ts" code={longLineCode} />`}
		>
			<div class="w-full max-w-sm">
				<Code language="typescript" title="long-line.ts" code={longLineCode} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="wrap soft-wraps long lines; tabSize sets the tab width."
			class="!min-h-fit"
			code={`<Code language="typescript" title="wrapped" wrap code={longLineCode} />
<Code language="typescript" title="tabSize=4" tabSize={4} code={tabbedCode} />`}
		>
			<div class="grid w-full max-w-2xl gap-6">
				<Code language="typescript" title="wrapped" wrap code={longLineCode} />
				<Code language="typescript" title="tabSize=4" tabSize={4} code={tabbedCode} />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
