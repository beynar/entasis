<script lang="ts">
	// What an agent reaches on a page, in the shapes that test it: decorative copies, names a
	// screen reader computes, zones the app takes from agents, a long list and an overlay.
	import Button from '$lib/components/Button/Button.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import Marquee from '$lib/components/Marquee/Marquee.svelte';
	import type { FormInputs } from '$lib/components/Form/Form/form.js';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Tabs from '$lib/components/Tabs/Tabs.svelte';
	import Theme from '$lib/components/Theme/Theme.svelte';
	import type { OpenChangeHandler } from '$lib/utils/openChange.js';

	let {
		scenario,
		off = true,
		count = 0,
		onOpenChange,
		onValueChange
	}: {
		scenario: 'decorative' | 'names' | 'off' | 'off-context' | 'off-form' | 'many' | 'popover';
		/** `off`: the value of the zone's attribute. */
		off?: boolean;
		/** `many`: how many buttons. */
		count?: number;
		onOpenChange?: OpenChangeHandler;
		onValueChange?: (value: unknown) => void;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const labelledByCaption: Record<string, string> = { 'aria-labelledby': 'caption' };
	const tabs = [
		{ value: 'a', label: 'First' },
		{ value: 'b', label: 'Second' }
	];
	const inputs = {
		email: { type: 'email', label: 'Email' },
		note: { type: 'text', label: 'Note' }
	} satisfies FormInputs;
	const hiddenInputs = { secret: { type: 'text', label: 'Secret' } } satisfies FormInputs;
</script>

<Theme webmcp>
	{#if scenario === 'decorative'}
		<!-- Marquee repeats its content in aria-hidden copies, for the eye only. -->
		<Marquee><Button>Open</Button></Marquee>
		<div aria-hidden="true"><Button>Decor</Button></div>
	{:else if scenario === 'names'}
		<Button>Save <kbd aria-hidden="true">⌘S</kbd></Button>
		<span id="caption">Archive the thread</span>
		<!-- Button takes no aria-labelledby prop; the attribute still reaches its element. -->
		<Button {...labelledByCaption}>Go</Button>
		<Button label="Close panel">×</Button>
	{:else if scenario === 'off'}
		<Button>Outside</Button>
		<section data-webmcp-off={off}>
			<p>Private notes about Ada</p>
			<Button>Inside</Button>
			<Tabs items={tabs} />
		</section>
	{:else if scenario === 'off-context'}
		{#each ['one', 'two'] as row (row)}
			<div>
				<p data-webmcp-off>Secret of row {row}</p>
				<span>Row {row}</span>
				<Button>Open</Button>
			</div>
		{/each}
	{:else if scenario === 'off-form'}
		<Form title="Profile" {inputs} {onValueChange} />
		<div data-webmcp-off>
			<Form title="Vault" inputs={hiddenInputs} onSubmit={() => {}} />
		</div>
	{:else if scenario === 'many'}
		{#each Array.from({ length: count }, (_, index) => index) as index (index)}
			<Button>{`Item ${index}`}</Button>
		{/each}
	{:else if scenario === 'popover'}
		<Popover transition={zero} trigger={{ content: 'Details' }} {onOpenChange}>
			<p>Body</p>
		</Popover>
	{/if}
</Theme>
