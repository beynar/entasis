<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';
	import { fileTextIcon } from 'svelai/icons/fileText';
	const downloadHref =
		'data:text/plain;charset=utf-8,' +
		encodeURIComponent(
			'PROJECT STARTING BRIEF\n\n1. What problem are we trying to solve?\n2. Who experiences this problem?\n3. What do they do today?\n4. What should change after this project?\n5. What must remain true?\n6. How will we know the work is done?\n'
		);
</script>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-xl p-xl text-center">
	<Chip variant="outline">Start with clarity</Chip><Heading as="h2" size="h2" weight="bold"
		>A better brief makes a better beginning.</Heading
	>
	<p class="max-w-xl text-neutral/70">
		A compact set of questions to help your team agree on the problem, the people, and the outcome.
	</p>
	<Card class="w-full max-w-md" variant="outline"
		><div class="flex flex-col items-center gap-xl">
			<div
				class="flex size-20 items-center justify-center rounded-2xl bg-primary-muted text-primary"
			>
				{@render fileTextIcon({ size: 36 })}
			</div>
			<div>
				<Heading as="h3" size="h4">The project starting brief</Heading>
				<p class="mt-sm text-sm text-neutral/60">Plain text · 6 questions · Version 1.0</p>
			</div>
			<Button href={downloadHref} download="project-brief.txt" fullWidth prefix={downloadSimpleIcon}
				>Download the brief</Button
			>
		</div></Card
	>
	<p class="text-sm text-neutral/60">No account. Just a useful place to start.</p>
</section>
