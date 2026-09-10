<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Code } from 'svelai/code';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { copyIcon } from 'svelai/icons/copy';
	let active = $state(0);
	let feedback = $state('');
	const commands = ['npm install svelai', 'pnpm add svelai', 'bun add svelai'];
	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(commands[active]);
			feedback = 'Command copied.';
		} catch {
			feedback = 'Clipboard is unavailable. Select and copy the command above.';
		}
	}
</script>

<section class="mx-auto grid max-w-5xl items-center gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col items-start gap-xl">
		<Chip variant="soft">Built for Svelte</Chip><Heading as="h2" size="h1" weight="bold"
			>A good start is a simple one.</Heading
		>
		<p class="text-neutral/70">
			Add the library to your project, connect your theme, and compose your first screen.
		</p>
		<Button href="/docs" variant="outline" suffix={arrowRightIcon}>Read the setup guide</Button>
	</div>
	<Card title="Install the package" variant="outline"
		><Stack gap="lg"
			><Tabbar items={['npm', 'pnpm', 'bun']} bind:value={active} /><Code
				language="shell"
				code={commands[active]}
			/><Button variant="outline" prefix={copyIcon} onclick={copyCommand}>Copy command</Button
			>{#if feedback}<p class="text-sm text-neutral/60" role="status">{feedback}</p>{/if}<Separator
			/>
			<div class="flex flex-wrap gap-sm">
				<Chip size="small" variant="outline">Svelte 5</Chip><Chip size="small" variant="outline"
					>TypeScript</Chip
				><Chip size="small" variant="outline">One theme</Chip>
			</div></Stack
		></Card
	>
</section>
