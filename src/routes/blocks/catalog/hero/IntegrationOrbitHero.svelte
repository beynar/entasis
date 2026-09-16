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

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl items-center md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">Made to work together</Chip><Heading as="h2" size="h1" weight="bold"
			>Your next idea.<br />All the right pieces.</Heading
		>
		<p class="text-neutral/70 text-lg">
			Compose a product from thoughtful components that share one visual language.
		</p>
		<div class="gap-md flex flex-wrap">
			<Button href="/components" suffix={arrowRightIcon}>Explore components</Button><Button
				href="/docs"
				variant="outline">Get started</Button
			>
		</div>
		<p class="text-neutral/65 text-sm">Small pieces. A world of possibilities.</p>
	</div>
	<div
		class="orbit bg-surface-recessed relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl"
	>
		<div class="border-primary/20 absolute size-3/4 rounded-full border"></div>
		<div class="border-primary/20 absolute size-1/2 rounded-full border"></div>
		<Card color="primary" variant="soft" class="z-10"
			><div class="gap-md flex flex-col items-center">
				{@render puzzlePieceIcon({ size: 44 })}<strong>Svelai</strong>
			</div></Card
		>{#each icons as icon, index (icon)}<div
				class="border-neutral-muted bg-surface text-primary-readable absolute flex size-16 items-center justify-center rounded-2xl border shadow-sm"
				style:left={50 + 34 * Math.cos((index * Math.PI) / 3) + '%'}
				style:top={50 + 34 * Math.sin((index * Math.PI) / 3) + '%'}
				style:transform="translate(-50%, -50%)"
			>
				{@render icon({ size: 28 })}
			</div>{/each}
	</div>
</section>
