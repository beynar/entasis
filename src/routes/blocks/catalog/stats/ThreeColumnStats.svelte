<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Stat } from 'svelai/stat';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-xl p-lg md:p-xl">
	<div class="max-w-2xl">
		<Chip variant="outline">The shape of progress</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Small steps make a visible difference.</Heading
		>
		<p class="mt-lg text-neutral/70">An example snapshot of a team finding its rhythm.</p>
	</div>
	<div class="grid gap-lg border-y border-neutral-muted py-xl md:grid-cols-3">
		<Stat
			label="Projects brought to life"
			value="42"
			description="From a useful question to a working product."
			variant="ghost"
			size="large"
		/><Stat
			label="A shared review rhythm"
			value="Weekly"
			description="Enough structure to keep good work moving."
			variant="ghost"
			size="large"
		/><Stat
			label="People shaping the work"
			value="24"
			description="Different disciplines, one clear direction."
			variant="ghost"
			size="large"
		/>
	</div>
	<Button href="/blocks" variant="link" class="self-start" suffix={arrowRightIcon}
		>See the work behind the numbers</Button
	>
</section>
