<script lang="ts">
	import { Rating } from 'svelai/rating';
	import { Chip } from 'svelai/chip';
	import { Separator } from 'svelai/separator';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="flex flex-col gap-xl p-xl rounded-lg bg-surface-recessed">
		<div class="flex gap-xl items-center justify-center flex-wrap">
			<Rating value={4.9} />
			<p class="text-sm">
				<strong>4.9 / 5</strong> <span class="text-neutral/55">from 1,280 sample reviews</span>
			</p>
			<Chip color="success" variant="soft" size="small">Verified purchases</Chip>
		</div>
		<Separator />
		<div class="flex gap-xl items-center justify-around flex-wrap text-center">
			<span class="text-xs uppercase tracking-widest text-neutral/40">A considered collection</span
			><span class="font-serif text-2xl">Kinfolk</span><span
				class="text-xl font-semibold tracking-widest">MONOCLE</span
			><span class="font-serif text-2xl italic">The Modern House</span>
		</div>
		<p class="text-center text-xs text-neutral/40">Example store reputation and press layout.</p>
	</div>
</section>
