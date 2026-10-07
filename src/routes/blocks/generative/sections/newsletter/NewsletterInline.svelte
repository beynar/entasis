<script lang="ts">
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Checkbox } from 'entasis/checkbox';
	import { TextInput } from 'entasis/text-input';
	import { envelopeSimpleIcon } from 'entasis/icons/envelopeSimple';
	import { isOnColor, type Headline, type SectionDensity, type Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { team } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const onBrand = $derived(isOnColor(tone));
	const inline = $derived(params.layout === 'inline');
	const boxed = $derived(params.arrangement === 'boxed');
	const center = $derived(!inline && params.align === 'center');
	// A boxed form sits on its own panel, so only an open form reads the brand surface.
	const formOnBrand = $derived(onBrand && !boxed);
	const quiet = $derived(formOnBrand ? 'text-primary-contrast/85' : 'text-neutral/70');
	// The panel steps one rung off the section surface it sits on.
	const panelSurface: Record<Tone, string> = {
		plain: 'bg-surface-recessed',
		muted: 'bg-surface',
		tint: 'bg-surface',
		inverse: 'bg-surface-recessed',
		brand: 'bg-surface'
	};
	const readers = team.slice(0, 4).map((member) => ({ name: member.name }));
	let submitted = $state(false);

	const copy = {
		title: 'The Monday brief, in your inbox.',
		body: 'One short email a week with planning patterns, product news, and what 9,800 teams learned shipping. Nothing else.'
	};
</script>

{#snippet signup()}
	<form
		class="gap-md flex w-full flex-col {center ? 'items-center text-center' : 'items-start'}"
		onsubmit={(event) => {
			event.preventDefault();
			submitted = true;
		}}
	>
		<div class="gap-sm flex w-full">
			<TextInput
				type="email"
				placeholder="you@company.com"
				prefix={envelopeSimpleIcon}
				size={kit.step(1)}
				class="min-w-0 flex-1"
				inputAttrs={{ 'aria-label': 'Email address', autocomplete: 'email' }}
			/>
			<Button type="submit" size={kit.step(1)} {...kit.action(formOnBrand)}>Subscribe</Button>
		</div>
		{#if submitted}
			<p role="status" class="text-sm font-medium">
				You’re on the list. Check your inbox to confirm.
			</p>
		{/if}
		{#if params.consent}
			<Checkbox size={kit.step(-1)} label="I agree to receive emails from Meridian." />
		{/if}
		{#if params.proof === 'count'}
			<div class="gap-md flex items-center">
				<AvatarGroup size={kit.stack(-1)} items={readers} />
				<span class="text-sm {quiet}">Join 12,000 readers</span>
			</div>
		{:else if !params.consent && !submitted}
			<p class="text-xs {quiet}">One email a week. Unsubscribe anytime.</p>
		{/if}
	</form>
{/snippet}

{#snippet form()}
	{#if boxed}
		<div
			class="text-neutral p-xl @min-[48rem]/section:p-layout-md w-full max-w-md rounded-lg {panelSurface[
				tone
			]}"
		>
			{@render signup()}
		</div>
	{:else}
		<div class="w-full max-w-md">{@render signup()}</div>
	{/if}
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} label="Newsletter">
	{#if inline}
		<div class="gen-grid items-center">
			<div class="gen-col" style:--gen-span={6} style:--gen-row={1}>
				<SectionHeader
					headline={params.headline as Headline}
					title={copy.title}
					body={copy.body}
					{onBrand}
				/>
			</div>
			<div class="gen-col" style:--gen-span={5} style:--gen-start={8} style:--gen-row={1}>
				{@render form()}
			</div>
		</div>
	{:else}
		<SectionHeader
			align={center ? 'center' : 'start'}
			headline={params.headline as Headline}
			title={copy.title}
			body={copy.body}
			{onBrand}
		>
			<div class="pt-sm flex w-full {center ? 'justify-center' : ''}">
				{@render form()}
			</div>
		</SectionHeader>
	{/if}
</SectionShell>
