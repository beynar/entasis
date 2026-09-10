<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { ImageZoom } from 'svelai/image-zoom';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Brand & digital / 2026
		</p>
		<Heading size="h2" weight="bold">Between the peaks.</Heading>
		<p class="max-w-2xl text-neutral/65">
			An identity for people who take the long way, look a little closer, and leave a lighter
			footprint.
		</p>
	</header>
	<ImageZoom
		><img
			src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
			alt="Alpine morning"
			loading="lazy"
			class="aspect-[16/7] w-full rounded-lg object-cover"
		/></ImageZoom
	>
	<div class="flex flex-col gap-xl mx-auto max-w-2xl">
		<Chip variant="soft" class="w-fit">01 / The idea</Chip><Heading size="h3"
			>An invitation to pay attention.</Heading
		>
		<p class="leading-relaxed text-neutral/70">
			The brief was to create a visual language that felt at home outdoors. We began with the lines
			of the landscape, the texture of well-used materials, and the quiet confidence of people who
			know their way.
		</p>
	</div>
	<div class="grid gap-xl sm:grid-cols-2">
		<ImageZoom
			><img
				src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Desert light"
				loading="lazy"
				class="aspect-[4/3] w-full rounded-lg object-cover"
			/></ImageZoom
		><ImageZoom
			><img
				src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Mountain night"
				loading="lazy"
				class="aspect-[4/3] w-full rounded-lg object-cover"
			/></ImageZoom
		>
	</div>
	<div class="flex flex-col gap-xl mx-auto max-w-2xl">
		<Chip variant="soft" class="w-fit">02 / The expression</Chip>
		<p class="leading-relaxed text-neutral/70">
			A restrained palette and a flexible system of marks give the identity room to grow, from a
			small woven label to a full digital experience.
		</p>
	</div>
</section>
