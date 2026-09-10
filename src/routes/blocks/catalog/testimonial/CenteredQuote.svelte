<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Rating } from 'svelai/rating';
</script>

<section class="mx-auto flex max-w-4xl flex-col items-center gap-xl p-xl text-center">
	<span class="font-serif text-3xl italic">Fieldwork</span><Rating value={5} color="primary" />
	<blockquote class="max-w-3xl text-2xl leading-relaxed tracking-tight md:text-3xl">
		“The biggest change was not how fast we worked. It was how clearly we could see what mattered
		next.”
	</blockquote>
	<div class="flex flex-col items-center gap-md">
		<Avatar user={{ name: 'Maya Chen' }} />
		<div>
			<strong>Maya Chen</strong>
			<p class="mt-sm text-sm text-neutral/60">Product lead · Fieldwork</p>
		</div>
	</div>
	<Chip size="small" variant="outline" color="neutral">Illustrative customer story</Chip>
</section>
