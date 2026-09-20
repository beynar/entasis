<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';

	const activity = [
		{ name: 'Maya', city: 'Copenhagen', product: 'the Arc lamp', shape: 'lamp', color: 'Sand' },
		{ name: 'Alex', city: 'London', product: 'the everyday vessel', shape: 'vase', color: 'Clay' }
	];
	let index = $state(0);
	let visible = $state(true);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Purchase activity
		</p>
		<Heading size="h2" weight="bold">A small moment of reassurance.</Heading>
		<p class="text-neutral/65 max-w-2xl">Preview a purchase notification using sample activity.</p>
	</header>
	{#if visible}<div class="max-w-lg">
			<Card
				><div class="gap-lg grid grid-cols-[6rem_1fr_auto] items-center">
					<div>{@render productArt(activity[index].shape, activity[index].color)}</div>
					<div class="gap-sm flex flex-col">
						<Chip size="small" variant="soft" color="neutral" class="w-fit">Sample purchase</Chip>
						<p class="text-sm"><strong>{activity[index].name}</strong> in {activity[index].city}</p>
						<p class="text-neutral/70 text-sm">Chose {activity[index].product}</p>
						<p class="text-neutral/65 text-xs">2 minutes ago</p>
					</div>
					<Button
						size="small"
						variant="ghost"
						label="Dismiss sample purchase"
						onclick={() => (visible = false)}>×</Button
					>
				</div></Card
			>
		</div>{/if}
	<div class="gap-lg flex">
		<Button
			variant="outline"
			size="small"
			onclick={() => {
				index = (index + 1) % activity.length;
				visible = true;
			}}>Preview next purchase</Button
		>
	</div>
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
	.product-art[data-color='Clay'] {
		--object-color: var(--color-secondary);
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
	[data-shape='lamp'] .object {
		width: 7%;
		height: 43%;
		border-radius: 1rem;
	}
	[data-shape='lamp'] .object::before {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 650%;
		height: 65%;
		left: -275%;
		top: -20%;
		border-radius: 10rem 10rem 0.6rem 0.6rem;
		box-shadow: inset -1rem 0 1.5rem #0002;
	}
	[data-shape='lamp'] .object::after {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 420%;
		height: 12%;
		left: -160%;
		bottom: -3%;
		border-radius: 50%;
	}
	[data-shape='vase'] .object {
		clip-path: polygon(
			28% 0,
			72% 0,
			68% 25%,
			91% 58%,
			100% 85%,
			87% 100%,
			13% 100%,
			0 85%,
			9% 58%,
			32% 25%
		);
		border-radius: 32%;
	}
</style>
