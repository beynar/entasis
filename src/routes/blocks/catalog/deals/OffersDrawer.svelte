<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';

	let open = $state(false);
	let applied = $state('');
	const offers = [
		{
			code: 'WELCOME15',
			label: 'First order',
			title: '15% off your first good thing',
			description: 'Applies to full-price items in your first order.'
		},
		{
			code: 'PAIR20',
			label: 'Buy together',
			title: 'Save 20% on a pair of vessels',
			description: 'Mix your favorite finishes and make a small collection.'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			A little something extra
		</p>
		<Heading size="h2" weight="bold">Good things come in pairs.</Heading>
	</header>
	<Button class="self-start" variant="outline" onclick={() => (open = true)}
		>Explore this week’s offers →</Button
	><Dialog
		type="drawerRight"
		bind:open
		title="A little extra for your everyday"
		description="Choose an offer to apply to this sample bag."
		><div class="gap-xl flex flex-col">
			{#each offers as offer (offer.code)}<article
					class="gap-lg p-xl bg-surface-recessed flex flex-col rounded-lg"
				>
					<Chip class="w-fit" variant="soft">{offer.label}</Chip>
					<h3 class="text-xl font-semibold">{offer.title}</h3>
					<p class="text-neutral/70 text-sm">{offer.description}</p>
					<Button
						variant={applied === offer.code ? 'soft' : 'outline'}
						onclick={() => (applied = offer.code)}
						>{applied === offer.code ? 'Selected ✓' : 'Use ' + offer.code}</Button
					>
				</article>{/each}
			<p class="text-success text-sm" aria-live="polite">
				{applied
					? `${applied} selected for the sample bag.`
					: 'Choose the offer that fits your order.'}
			</p>
		</div></Dialog
	>
</section>
