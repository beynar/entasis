<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { Stat } from 'svelai/stat';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-xl p-lg md:p-xl">
	<Chip class="self-start" variant="outline">Our story</Chip>
	<Heading as="h2" size="h1" weight="bold" class="max-w-4xl"
		>Good tools make room for great ideas.</Heading
	>
	<Separator />
	<div class="grid gap-xl md:grid-cols-2">
		<div class="flex flex-col gap-lg">
			<Heading as="h3" size="h4">Built for the work between the meetings.</Heading>
			<p class="text-neutral/70">
				We started Northstar in a shared studio, with a whiteboard and a question: why does keeping
				work organized feel like another job?
			</p>
			<p class="text-neutral/70">
				Today, we make a calmer place for people to think, decide, and build together.
			</p>
		</div>
		<div class="flex flex-col gap-lg">
			<p class="text-neutral/70">
				Our team combines product design, engineering, and a healthy dislike of unnecessary steps.
				We make the details feel simple so your work can stay ambitious.
			</p>
			<div class="grid grid-cols-2 gap-md">
				<Stat label="Founded" value="2019" variant="ghost" /><Stat
					label="Countries"
					value="14"
					variant="ghost"
				/>
			</div>
			<Button href="/components" variant="link" class="self-start" suffix={arrowRightIcon}
				>Explore our toolkit</Button
			>
		</div>
	</div>
</section>
