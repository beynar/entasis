<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Checkbox } from 'entasis/checkbox';
	import { Chip } from 'entasis/chip';

	let visible = $state(false);
	let stored = $state(false);
	const codes = ['DEMO-1428', 'DEMO-5721', 'DEMO-8349', 'DEMO-2640', 'DEMO-9156', 'DEMO-4832'];
	function downloadCodes() {
		const url = URL.createObjectURL(
			new Blob(['NONFUNCTIONAL SAMPLE RECOVERY CODES\n' + codes.join('\n')], { type: 'text/plain' })
		);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'sample-recovery-codes.txt';
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<div>
			<Chip color="warning">Account security</Chip>
			<h2 class="mt-lg text-3xl font-semibold">Your backup plan.</h2>
			<p class="mt-md text-neutral/65 text-sm">
				Store recovery codes somewhere private. Each production code can only be used once.
			</p>
		</div>
		<Card
			class="md:col-span-2"
			title="Recovery codes"
			description="These are nonfunctional sample codes for this preview."
			><Stack gap="lg">
				<div class="gap-md bg-surface-recessed p-lg grid grid-cols-2 rounded-lg font-mono text-sm">
					{#each codes as code (code)}<span>{visible ? code : '••••–••••'}</span>{/each}
				</div>
				<Stack orientation="horizontal" wrap="wrap" gap="md">
					<Button variant="outline" onclick={() => (visible = !visible)}
						>{visible ? 'Hide codes' : 'Reveal codes'}</Button
					><Button onclick={downloadCodes}>Download sample codes</Button>
				</Stack>
				<Checkbox bind:value={stored} label="I understand these are sample codes" />
				<p class="text-neutral/70 text-xs" aria-live="polite">
					{stored
						? 'Preview checklist complete.'
						: 'Keep real recovery codes away from shared devices.'}
				</p>
			</Stack></Card
		>
	</div>
</Stack>
