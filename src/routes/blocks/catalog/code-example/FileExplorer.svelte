<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Code } from 'svelai/code';
	let selected = $state(0);
	const files = [
		{
			name: 'Counter.svelte',
			language: 'svelte',
			note: 'The component owns the interactive state.',
			code: "<script>\n  import { Button } from 'svelai/button';\n  let count = $state(0);\n\u003c/script>\n\n<Button onclick={() => count += 1}>\n  Count: {count}\n</Button>"
		},
		{
			name: 'counter.css',
			language: 'css',
			note: 'Theme tokens let the interface adapt to its host.',
			code: '.counter {\n  display: flex;\n  gap: var(--space-lg);\n  color: var(--color-neutral);\n}'
		},
		{
			name: 'README.md',
			language: 'markdown',
			note: 'Documentation explains how a component is intended to be used.',
			code: '# Counter\n\nA local click counter composed with Svelai Button.\n\nClick to increment the displayed value.'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Anatomy of a component
		</p>
		<Heading size="h2" weight="bold">Small files. Clear responsibilities.</Heading>
	</header>
	<div class="grid overflow-hidden rounded-lg border border-neutral/15 md:grid-cols-[13rem_1fr]">
		<nav aria-label="Example files" class="flex flex-col gap-sm p-lg bg-surface-recessed">
			<span class="mb-lg text-xs uppercase tracking-widest text-neutral/50">counter/</span
			>{#each files as file, i (file.name)}<Button
					variant={selected === i ? 'soft' : 'ghost'}
					color={selected === i ? 'primary' : 'neutral'}
					onclick={() => (selected = i)}
					class="justify-start">{file.name}</Button
				>{/each}
		</nav>
		<div class="min-w-0 p-lg">
			<Code
				code={files[selected].code}
				language={files[selected].language}
				title={files[selected].name}
				showLineNumbers
			/>
			<p class="mt-lg text-sm text-neutral/60">{files[selected].note}</p>
		</div>
	</div>
</section>
