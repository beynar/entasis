<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Checkbox } from 'entasis/checkbox';

	let open = $state(false);
	let interests = $state<string[]>(['New collections']);
	let previewed = $state(false);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl grid items-center sm:grid-cols-2">
		{@render productArt('bag', 'Olive')}
		<div class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					The Field circle
				</p>
				<Heading size="h2" weight="bold">A little closer to the good things.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					Early looks, considered offers, and a few extra reasons to keep in touch.
				</p>
			</header>
			<Button class="self-start" onclick={() => (open = true)}>Discover membership</Button>
		</div>
	</div>
	<Dialog
		bind:open
		size="large"
		title="Welcome to the Field circle"
		description="A membership offer preview."
		><div class="gap-xl grid sm:grid-cols-2">
			<div class="gap-xl p-xl bg-primary-muted flex flex-col rounded-lg">
				<Chip class="w-fit" variant="soft">The Field circle</Chip><Heading size="h3"
					>Good things,<br />a little earlier.</Heading
				>
				<p>Early access to collections, member-only edits, and complimentary gift wrapping.</p>
				<p class="text-neutral/70 text-sm">
					Free to join. This local preview does not create an account.
				</p>
			</div>
			<div class="gap-xl flex flex-col justify-center">
				<Heading size="h4">What interests you?</Heading
				>{#each ['New collections', 'Design stories', 'Member offers'] as interest (interest)}<Checkbox
						label={interest}
						value={interests.includes(interest)}
						onValueChange={(value) =>
							(interests = value
								? [...interests, interest]
								: interests.filter((entry) => entry !== interest))}
					/>{/each}<Button onclick={() => (previewed = true)} disabled={!interests.length}
					>Preview my preferences</Button
				>{#if previewed}<p class="text-success text-sm" role="status">
						Your selection: {interests.join(', ')}.
					</p>{/if}
			</div>
		</div></Dialog
	>
</section>

<style>
	.product-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-surface-recessed);
		--object-color: var(--color-primary);
	}
	.product-art[data-color='Olive'] {
		--object-color: var(--color-success);
	}
	.object {
		position: relative;
		background: var(--object-color);
		width: 35%;
		height: 56%;
		box-shadow:
			inset -1.2rem 0 2rem #0002,
			0.8rem 1rem 1.4rem #0002;
	}
	[data-shape='bag'] .object {
		width: 47%;
		height: 47%;
		border-radius: 0.4rem 0.4rem 1rem 1rem;
	}
	[data-shape='bag'] .object::before {
		content: '';
		position: absolute;
		width: 48%;
		height: 48%;
		border: 0.65rem solid var(--object-color);
		border-bottom: 0;
		border-radius: 50% 50% 0 0;
		left: 26%;
		top: -39%;
	}
</style>
