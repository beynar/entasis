<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Select } from 'svelai/select';
	import { Table } from 'svelai/table';

	const fields = [
		{ value: 'skip', label: 'Skip this column' },
		{ value: 'name', label: 'Full name (required)' },
		{ value: 'email', label: 'Email address (required)' },
		{ value: 'company', label: 'Company' }
	];
	let mappings = $state([
		{ source: 'full_name', sample: 'Maya Chen', target: 'name' },
		{ source: 'email_address', sample: 'maya@example.com', target: 'email' },
		{ source: 'organization', sample: 'Northstar', target: 'company' }
	]);
	const rows: Record<string, string>[] = [
		{ full_name: 'Maya Chen', email_address: 'maya@example.com', organization: 'Northstar' },
		{ full_name: 'Sam Rivera', email_address: 'sam@example.com', organization: 'Orbit Labs' },
		{ full_name: 'Alex Morgan', email_address: 'alex@example.com', organization: 'Common Ground' }
	];
	let imported = $state(false);
	let valid = $derived.by(() => {
		const selected = mappings
			.map((mapping) => mapping.target)
			.filter((target) => target !== 'skip');
		return (
			selected.includes('name') &&
			selected.includes('email') &&
			new Set(selected).size === selected.length
		);
	});
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		title="Give your columns a home"
		description="Map columns from contacts.csv to the fields in your workspace."
		><Stack gap="lg">
			<div class="gap-md bg-surface-recessed p-md flex flex-wrap items-center rounded-lg">
				<Chip color="primary">contacts.csv</Chip><span class="text-neutral/70 text-sm"
					>3 sample rows · 3 columns</span
				>
			</div>
			{#each mappings as mapping (mapping)}<div
					class="gap-lg border-neutral-muted pb-lg grid items-center border-b sm:grid-cols-2"
				>
					<div>
						<strong class="text-sm">{mapping.source}</strong>
						<p class="mt-xs text-neutral/70 text-xs">Example: {mapping.sample}</p>
					</div>
					<Select label={`Map ${mapping.source} to`} items={fields} bind:value={mapping.target} />
				</div>{/each}<Alert
				color={valid ? 'success' : 'warning'}
				title={valid ? 'Required fields are mapped' : 'Map name and email once each'}
				description={valid
					? 'The preview is ready to import.'
					: 'Each destination can only be selected once.'}
			/><Button disabled={!valid} onclick={() => (imported = true)}>Preview import</Button
			>{#if imported && valid}<Card
					title="Import preview"
					description="Three sample records mapped. No data was uploaded."
					><Table
						header={{ name: 'Name', email: 'Email', company: 'Company' }}
						items={rows.map((row) => ({
							cells: Object.fromEntries(
								mappings
									.filter((mapping) => mapping.target !== 'skip')
									.map((mapping) => [mapping.target ?? '', row[mapping.source]])
							)
						}))}
					/></Card
				>{/if}
		</Stack></Card
	>
</Stack>
