<script lang="ts">
	import { Button } from 'entasis/button';
	import { Heading } from 'entasis/heading';
</script>

<section class="gap-xl bg-primary-muted p-xl flex flex-wrap items-center justify-between">
	<div class="max-w-2xl">
		<Heading as="h2" size="h2" weight="bold">Your next great idea deserves a head start.</Heading>
		<p class="mt-lg text-neutral/70">
			Take the building blocks. Make something unmistakably yours.
		</p>
	</div>
	<div class="gap-md flex flex-wrap">
		<Button href="/components" size="large">Start building</Button><Button
			href="/docs"
			variant="outline"
			size="large">Read the guides</Button
		>
	</div>
</section>
