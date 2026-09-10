<script lang="ts">
	import Collapsible from '$lib/components/Collapsible/Collapsible.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { caretUpDownIcon } from '$lib/components/Icons/caretUpDown.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const collapsibleVariants = ['default', 'peek'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: collapsibleVariants
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let controlledOpen = $state(false);
	let peekOpen = $state(false);
</script>

{#snippet repo(name: string)}
	<div
		class="border-neutral-muted bg-surface-raised/40 text-neutral rounded-md border px-4 py-2 font-mono text-sm"
	>
		{name}
	</div>
{/snippet}

<DocPage
	title="Collapsible"
	subtitle="Toggles the visibility of a single content region. Use the `peek` variant to tease long content behind a fading edge with a floating trigger."
	component="Collapsible"
	features={[
		'default & peek variants',
		'bind:open — controlled or uncontrolled',
		'caret / chevron / math or a custom icon',
		'Slide transition, three sizes',
		'aria-expanded / aria-controls, onOpenChange'
	]}
>
	<ComponentCard
		{controls}
		description="A shadcn-style disclosure: a trigger row that reveals its content with a slide."
		code={`<Collapsible icon={caretUpDownIcon} size="${controls.value.size}" variant="${controls.value.variant}" disabled={${controls.value.disabled}}>
	{#snippet trigger()}
		<span class="px-2 text-sm font-semibold">@peduarte starred 3 repositories</span>
	{/snippet}
	<div class="flex flex-col gap-2 px-2 pb-1">
		<div class="rounded-md border px-4 py-2 font-mono text-sm">@radix-ui/primitives</div>
		<div class="rounded-md border px-4 py-2 font-mono text-sm">@radix-ui/colors</div>
		<div class="rounded-md border px-4 py-2 font-mono text-sm">@stitches/react</div>
	</div>
</Collapsible>`}
	>
		<div class="border-neutral-muted bg-surface w-[360px] rounded-xl border p-2 shadow-sm">
			<Collapsible
				icon={caretUpDownIcon}
				size={controls.value.size}
				variant={controls.value.variant}
				disabled={controls.value.disabled}
				peekHeight={96}
			>
				{#snippet trigger()}
					<span class="text-neutral px-2 text-sm font-semibold">
						@peduarte starred 3 repositories
					</span>
				{/snippet}
				<div class="flex flex-col gap-2 px-2 pb-1">
					{@render repo('@radix-ui/primitives')}
					{@render repo('@radix-ui/colors')}
					{@render repo('@stitches/react')}
				</div>
			</Collapsible>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Peek"
			description="The content stays mounted, clipped to peekHeight with a faded edge, and a pill trigger floats over the fade to expand it. Great for long text."
			code={`<Collapsible variant="peek" peekHeight={96}>
	{#snippet trigger()}
		<span>{open ? 'Show less' : 'Read more'}</span>
	{/snippet}
	<p>Long article content…</p>
</Collapsible>`}
		>
			<div class="border-neutral-muted bg-surface w-[440px] rounded-xl border p-5 shadow-sm">
				<h4 class="text-neutral mb-3 font-semibold">Terms of Service</h4>
				<Collapsible variant="peek" peekHeight={96} bind:open={peekOpen}>
					{#snippet trigger()}
						<span>{peekOpen ? 'Show less' : 'Read more'}</span>
					{/snippet}
					<div class="text-neutral/60 flex flex-col gap-3 text-sm leading-relaxed">
						<p>
							By using this service you agree to be bound by the following terms. These terms govern
							your access to and use of the product, including any content, functionality and
							services offered.
						</p>
						<p>
							You are responsible for maintaining the confidentiality of your account and for all
							activities that occur under it. We reserve the right to suspend accounts that violate
							these terms at any time.
						</p>
						<p>
							We may update these terms from time to time. Continued use of the service after any
							changes constitutes acceptance of the new terms.
						</p>
					</div>
				</Collapsible>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom trigger"
			description="The trigger slot accepts any markup — here a title and hint stacked on the left, with the caret on the right."
			class="!min-h-fit !justify-center"
			code={`<Collapsible>
	{#snippet trigger()}
		<div class="flex flex-col items-start">
			<span class="font-medium">Can I change my plan later?</span>
			<span class="text-neutral/60 text-sm">Tap to read the answer</span>
		</div>
	{/snippet}
	<p>Yes — upgrade or downgrade at any time from billing settings.</p>
</Collapsible>`}
		>
			<div
				class="border-neutral-muted bg-surface w-[440px] divide-y divide-dashed rounded-xl border shadow-sm [&>*]:px-4"
			>
				<Collapsible>
					{#snippet trigger()}
						<div class="flex flex-col items-start">
							<span class="text-neutral font-medium">Can I change my plan later?</span>
							<span class="text-neutral/60 text-sm">Tap to read the answer</span>
						</div>
					{/snippet}
					<p class="text-neutral/60 text-sm">
						Yes — upgrade or downgrade at any time from your billing settings. Changes are prorated
						to the day.
					</p>
				</Collapsible>
				<Collapsible>
					{#snippet trigger()}
						<div class="flex flex-col items-start">
							<span class="text-neutral font-medium">Do you offer refunds?</span>
							<span class="text-neutral/60 text-sm">Tap to read the answer</span>
						</div>
					{/snippet}
					<p class="text-neutral/60 text-sm">
						We offer a 30-day money-back guarantee, no questions asked.
					</p>
				</Collapsible>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="small, normal and large scale the trigger padding, text and icon."
			class="!min-h-fit !justify-center"
			code={`<Collapsible size="small">…</Collapsible>
<Collapsible size="normal">…</Collapsible>
<Collapsible size="large">…</Collapsible>`}
		>
			<div class="flex w-[360px] flex-col gap-3">
				{#each sizes as size (size)}
					<div class="border-neutral-muted bg-surface rounded-xl border px-2 shadow-sm">
						<Collapsible {size} icon="caret">
							{#snippet trigger()}
								<span class="text-neutral capitalize">{size}</span>
							{/snippet}
							<p class="text-neutral/60 text-sm">This is a {size} collapsible.</p>
						</Collapsible>
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Controlled"
			description="Bind open to drive it from outside — here a button toggles the same state."
			class="!min-h-fit !justify-center"
			code={`<script>
	let open = $state(false);
<\/script>

<Collapsible bind:open>…</Collapsible>
<Button onclick={() => (open = !open)}>Toggle from outside</Button>`}
		>
			<div class="flex w-[360px] flex-col gap-4">
				<div class="border-neutral-muted bg-surface rounded-xl border px-2 shadow-sm">
					<Collapsible bind:open={controlledOpen} icon="math">
						{#snippet trigger()}
							<span class="text-neutral">Status: {controlledOpen ? 'Open' : 'Closed'}</span>
						{/snippet}
						<p class="text-neutral/60 text-sm">This panel's state lives in the parent.</p>
					</Collapsible>
				</div>
				<Button variant="soft" color="primary" onclick={() => (controlledOpen = !controlledOpen)}>
					Toggle from outside
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Disabled"
			description="A disabled collapsible can't be toggled and dims its trigger."
			class="!min-h-fit !justify-center"
			code={`<Collapsible disabled icon="caret">…</Collapsible>`}
		>
			<div class="border-neutral-muted bg-surface w-[360px] rounded-xl border px-2 shadow-sm">
				<Collapsible disabled icon="caret">
					{#snippet trigger()}
						<span class="text-neutral">Disabled section</span>
					{/snippet}
					<p class="text-neutral/60 text-sm">You won't see this.</p>
				</Collapsible>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
