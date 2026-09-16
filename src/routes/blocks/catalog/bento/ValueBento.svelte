<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { lightningIcon } from 'svelai/icons/lightning';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
</script>

<section class="gap-lg p-lg md:p-xl grid md:grid-cols-2">
	<Card color="primary" variant="soft" class="md:row-span-2"
		><div class="gap-xl flex min-h-72 flex-col justify-between">
			<Chip class="self-start" variant="outline">Your unfair advantage</Chip><Heading
				as="h2"
				size="h1"
				weight="bold">Make the hard things feel simple.</Heading
			><Button href="/components" class="self-start">Meet the toolkit</Button>
		</div></Card
	>
	<Card variant="outline"
		><div class="gap-lg flex">
			<span class="text-primary-readable">{@render lightningIcon({ size: 32 })}</span>
			<div>
				<Heading as="h3" size="h4">Fast from the first click</Heading>
				<p class="mt-md text-neutral/70">
					Thoughtful defaults let you spend your time on the details that make your product yours.
				</p>
			</div>
		</div></Card
	>
	<Card variant="outline"
		><div class="gap-lg flex">
			<span class="text-primary-readable">{@render puzzlePieceIcon({ size: 32 })}</span>
			<div>
				<Heading as="h3" size="h4">Made to fit together</Heading>
				<p class="mt-md text-neutral/70">
					One language for state, one system for color, and familiar patterns all the way through.
				</p>
			</div>
		</div></Card
	>
	<Card class="md:col-span-2" variant="soft"
		><div class="gap-xl flex flex-wrap items-center justify-between">
			<div>
				<Heading as="h3" size="h4">Your brand, all the way down</Heading>
				<p class="mt-md text-neutral/70">
					A theme that reaches every component, without a pile of overrides.
				</p>
			</div>
			<div class="gap-sm flex" role="img" aria-label="Theme color palette">
				<span class="bg-primary size-12 rounded-full"></span><span
					class="bg-secondary size-12 rounded-full"
				></span><span class="bg-success size-12 rounded-full"></span><span
					class="bg-warning size-12 rounded-full"
				></span>
			</div>
		</div></Card
	>
</section>
