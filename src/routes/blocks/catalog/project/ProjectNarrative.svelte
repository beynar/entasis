<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
	import { ImageZoom } from 'entasis/image-zoom';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Brand & digital / 2026
		</p>
		<Heading size="h2" weight="bold">Between the peaks.</Heading>
		<p class="text-neutral/65 max-w-2xl">
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
	<div class="gap-xl mx-auto flex max-w-2xl flex-col">
		<Chip variant="soft" class="w-fit">01 / The idea</Chip><Heading size="h3"
			>An invitation to pay attention.</Heading
		>
		<p class="text-neutral/70 leading-relaxed">
			The brief was to create a visual language that felt at home outdoors. We began with the lines
			of the landscape, the texture of well-used materials, and the quiet confidence of people who
			know their way.
		</p>
	</div>
	<div class="gap-xl grid sm:grid-cols-2">
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
	<div class="gap-xl mx-auto flex max-w-2xl flex-col">
		<Chip variant="soft" class="w-fit">02 / The expression</Chip>
		<p class="text-neutral/70 leading-relaxed">
			A restrained palette and a flexible system of marks give the identity room to grow, from a
			small woven label to a full digital experience.
		</p>
	</div>
</section>
