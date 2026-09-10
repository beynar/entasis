<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Dialog } from 'svelai/dialog';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';

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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
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
		><div class="flex flex-col gap-xl">
			{#each offers as offer (offer.code)}<article
					class="flex flex-col gap-lg p-xl rounded-lg bg-surface-recessed"
				>
					<Chip class="w-fit" variant="soft">{offer.label}</Chip>
					<h3 class="text-xl font-semibold">{offer.title}</h3>
					<p class="text-sm text-neutral/60">{offer.description}</p>
					<Button
						variant={applied === offer.code ? 'soft' : 'outline'}
						onclick={() => (applied = offer.code)}
						>{applied === offer.code ? 'Selected ✓' : 'Use ' + offer.code}</Button
					>
				</article>{/each}
			<p class="text-sm text-success" aria-live="polite">
				{applied
					? `${applied} selected for the sample bag.`
					: 'Choose the offer that fits your order.'}
			</p>
		</div></Dialog
	>
</section>
