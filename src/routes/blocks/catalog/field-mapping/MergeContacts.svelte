<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { RadioInput } from 'svelai/radio-input';
	import { Table } from 'svelai/table';

	const fields = [
		{ key: 'name', label: 'Full name' },
		{ key: 'email', label: 'Email address' },
		{ key: 'company', label: 'Company' }
	];
	const first: Record<string, string> = {
		name: 'Alex Morgan',
		email: 'alex@old-company.example',
		company: 'Old Company'
	};
	const second: Record<string, string> = {
		name: 'Alexander Morgan',
		email: 'alex@example.com',
		company: 'Northstar Studio'
	};
	let choices = $state<Record<string, string | null>>({
		name: 'first',
		email: 'second',
		company: 'second'
	});
	let merged = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<Chip color="warning">Possible duplicate</Chip>
		<h2 class="mt-lg text-3xl font-semibold">Keep the right details.</h2>
		<p class="mt-sm text-neutral/65 text-sm">
			Choose which value to keep for each field. Both source records stay untouched in this preview.
		</p>
	</header>
	<Card
		><Stack gap="lg">
			{#each fields as field (field)}<Stack gap="md" class="border-neutral-muted pb-lg border-b">
					<h3 class="font-semibold">{field.label}</h3>
					<RadioInput
						label={`Keep ${field.label}`}
						mode="card"
						items={[
							{ value: 'first', label: first[field.key], description: 'Record A' },
							{ value: 'second', label: second[field.key], description: 'Record B' }
						]}
						bind:value={choices[field.key]}
					/>
				</Stack>{/each}<Button onclick={() => (merged = true)}>Preview merged contact</Button
			>{#if merged}<Alert
					color="success"
					title="Merged record preview"
					description="No source record was deleted."
				/><Table
					header={{ field: 'Field', value: 'Kept value' }}
					items={fields.map((field) => ({
						cells: {
							field: field.label,
							value: choices[field.key] === 'first' ? first[field.key] : second[field.key]
						}
					}))}
				/>{/if}
		</Stack></Card
	>
</Stack>
