<script lang="ts">
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { bookOpenIcon } from 'entasis/icons/bookOpen';
	import { puzzlePieceIcon } from 'entasis/icons/puzzlePiece';
	import { usersThreeIcon } from 'entasis/icons/usersThree';
</script>

<section class="gap-xl p-xl mx-auto flex max-w-3xl flex-col items-center text-center">
	<div
		class="bg-primary-muted text-primary-muted-readable flex size-20 items-center justify-center rounded-2xl"
	>
		{@render usersThreeIcon({ size: 38 })}
	</div>
	<Chip variant="outline">Better together</Chip><Heading as="h2" size="h1" weight="bold"
		>A place for people who love making things.</Heading
	>
	<p class="text-neutral/70 max-w-xl text-lg">
		Bring a question, share a small win, or find a new way to solve an old problem.
	</p>
	<div class="gap-md flex flex-wrap justify-center">
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
	<p class="text-neutral/70 text-sm">Different ideas. A shared love of the craft.</p>
</section>
