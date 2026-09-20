<script lang="ts">
	import { Rating } from 'entasis/rating';
	import { Chip } from 'entasis/chip';
	import { Separator } from 'entasis/separator';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg">
		<div class="gap-xl flex flex-wrap items-center justify-center">
			<Rating value={4.9} />
			<p class="text-sm">
				<strong>4.9 / 5</strong> <span class="text-neutral/65">from 1,280 sample reviews</span>
			</p>
			<Chip color="success" variant="soft" size="small">Verified purchases</Chip>
		</div>
		<Separator />
		<div class="gap-xl flex flex-wrap items-center justify-around text-center">
			<span class="text-neutral/65 text-xs tracking-widest uppercase">A considered collection</span
			><span class="font-serif text-2xl">Kinfolk</span><span
				class="text-xl font-semibold tracking-widest">MONOCLE</span
			><span class="font-serif text-2xl italic">The Modern House</span>
		</div>
		<p class="text-neutral/65 text-center text-xs">Example store reputation and press layout.</p>
	</div>
</section>
