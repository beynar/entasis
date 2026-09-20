<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { downloadSimpleIcon } from 'entasis/icons/downloadSimple';
	import { fileTextIcon } from 'entasis/icons/fileText';
	const downloadHref =
		'data:text/plain;charset=utf-8,' +
		encodeURIComponent(
			'PROJECT STARTING BRIEF\n\n1. What problem are we trying to solve?\n2. Who experiences this problem?\n3. What do they do today?\n4. What should change after this project?\n5. What must remain true?\n6. How will we know the work is done?\n'
		);
</script>

<section class="gap-xl p-xl mx-auto flex max-w-3xl flex-col items-center text-center">
	<Chip variant="outline">Start with clarity</Chip><Heading as="h2" size="h2" weight="bold"
		>A better brief makes a better beginning.</Heading
	>
	<p class="text-neutral/70 max-w-xl">
		A compact set of questions to help your team agree on the problem, the people, and the outcome.
	</p>
	<Card class="w-full max-w-md" variant="outline"
		><div class="gap-xl flex flex-col items-center">
			<div
				class="bg-primary-muted text-primary-muted-readable flex size-20 items-center justify-center rounded-2xl"
			>
				{@render fileTextIcon({ size: 36 })}
			</div>
			<div>
				<Heading as="h3" size="h4">The project starting brief</Heading>
				<p class="mt-sm text-neutral/70 text-sm">Plain text · 6 questions · Version 1.0</p>
			</div>
			<Button href={downloadHref} download="project-brief.txt" fullWidth prefix={downloadSimpleIcon}
				>Download the brief</Button
			>
		</div></Card
	>
	<p class="text-neutral/70 text-sm">No account. Just a useful place to start.</p>
</section>
