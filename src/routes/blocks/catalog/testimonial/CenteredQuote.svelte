<script lang="ts">
	import { Avatar } from 'entasis/avatar';
	import { Chip } from 'entasis/chip';
	import { Rating } from 'entasis/rating';
</script>

<section class="gap-xl p-xl mx-auto flex max-w-4xl flex-col items-center text-center">
	<span class="font-serif text-3xl italic">Fieldwork</span><Rating value={5} color="primary" />
	<blockquote class="max-w-3xl text-2xl leading-relaxed tracking-tight md:text-3xl">
		“The biggest change was not how fast we worked. It was how clearly we could see what mattered
		next.”
	</blockquote>
	<div class="gap-md flex flex-col items-center">
		<Avatar name="Maya Chen" />
		<div>
			<strong>Maya Chen</strong>
			<p class="mt-sm text-neutral/70 text-sm">Product lead · Fieldwork</p>
		</div>
	</div>
	<Chip size="small" variant="outline" color="neutral">Illustrative customer story</Chip>
</section>
