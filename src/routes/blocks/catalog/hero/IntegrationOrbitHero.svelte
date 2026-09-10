<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { calendarIcon } from 'svelai/icons/calendar';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { lightningIcon } from 'svelai/icons/lightning';
	import { paletteIcon } from 'svelai/icons/palette';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { usersThreeIcon } from 'svelai/icons/usersThree';
	const icons = [
		chatCircleIcon,
		chartBarIcon,
		calendarIcon,
		usersThreeIcon,
		paletteIcon,
		lightningIcon
	];
</script>

<section class="mx-auto grid max-w-6xl items-center gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col items-start gap-xl">
		<Chip variant="outline">Made to work together</Chip><Heading as="h2" size="h1" weight="bold"
			>Your next idea.<br />All the right pieces.</Heading
		>
		<p class="text-lg text-neutral/70">
			Compose a product from thoughtful components that share one visual language.
		</p>
		<div class="flex flex-wrap gap-md">
			<Button href="/components" suffix={arrowRightIcon}>Explore components</Button><Button
				href="/docs"
				variant="outline">Get started</Button
			>
		</div>
		<p class="text-sm text-neutral/50">Small pieces. A world of possibilities.</p>
	</div>
	<div
		class="orbit relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-surface-recessed"
	>
		<div class="absolute size-3/4 rounded-full border border-primary/20"></div>
		<div class="absolute size-1/2 rounded-full border border-primary/20"></div>
		<Card color="primary" variant="soft" class="z-10"
			><div class="flex flex-col items-center gap-md">
				{@render puzzlePieceIcon({ size: 44 })}<strong>Svelai</strong>
			</div></Card
		>{#each icons as icon, index (icon)}<div
				class="absolute flex size-16 items-center justify-center rounded-2xl border border-neutral-muted bg-surface text-primary shadow-sm"
				style:left={50 + 34 * Math.cos((index * Math.PI) / 3) + '%'}
				style:top={50 + 34 * Math.sin((index * Math.PI) / 3) + '%'}
				style:transform="translate(-50%, -50%)"
			>
				{@render icon({ size: 28 })}
			</div>{/each}
	</div>
</section>
