<script lang="ts">
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { bookOpenIcon } from 'svelai/icons/bookOpen';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { usersThreeIcon } from 'svelai/icons/usersThree';
</script>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-xl p-xl text-center">
	<div class="flex size-20 items-center justify-center rounded-2xl bg-primary-muted text-primary">
		{@render usersThreeIcon({ size: 38 })}
	</div>
	<Chip variant="outline">Better together</Chip><Heading as="h2" size="h1" weight="bold"
		>A place for people who love making things.</Heading
	>
	<p class="max-w-xl text-lg text-neutral/70">
		Bring a question, share a small win, or find a new way to solve an old problem.
	</p>
	<div class="flex flex-wrap justify-center gap-md">
		<Button href="/components" variant="outline" prefix={puzzlePieceIcon}>Explore components</Button
		><Button href="/docs" variant="outline" prefix={bookOpenIcon}>Read the guides</Button>
	</div>
	<AvatarGroup
		items={[
			{ name: 'Maya Chen' },
			{ name: 'Theo Park' },
			{ name: 'Jules Bernard' },
			{ name: 'Ari Costa' },
			{ name: 'Nora Ellis' }
		]}
	/>
	<p class="text-sm text-neutral/60">Different ideas. A shared love of the craft.</p>
</section>
