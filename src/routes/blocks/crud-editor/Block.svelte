<script lang="ts">
	import { Button } from 'svelai/button';
	import { MenuOption } from 'svelai/menu-option';
	import { Form, type FormInputs, type InferFormValue, type LiveFormValue } from 'svelai/form';
	import { arrowLeftIcon } from 'svelai/icons/arrowLeft';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { floppyDiskIcon } from 'svelai/icons/floppyDisk';
	import { plusIcon } from 'svelai/icons/plus';
	import { trashIcon } from 'svelai/icons/trash';

	interface RecordSummary {
		id: string;
		name: string;
		slug: string;
		category: string;
		description: string;
		published: boolean;
	}

	const editorInputs = {
		details: {
			type: 'group',
			label: 'Record details',
			description: 'Use a clear name and a unique URL slug.',
			columns: 2,
			inputs: {
				name: {
					type: 'text',
					label: 'Name',
					placeholder: 'Customer onboarding',
					required: true,
					onValidate: (name) =>
						name.trim().length < 3 ? 'Enter at least three characters.' : false
				},
				slug: {
					type: 'text',
					label: 'Slug',
					placeholder: 'customer-onboarding',
					required: true,
					onValidate: (slug) =>
						/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
							? false
							: 'Use lowercase letters, numbers, and single hyphens.'
				},
				category: {
					type: 'select',
					label: 'Category',
					placeholder: 'Choose a category',
					required: true,
					items: [
						{ label: 'Operations', value: 'Operations' },
						{ label: 'Product', value: 'Product' },
						{ label: 'Sales', value: 'Sales' }
					]
				},
				published: {
					type: 'switch',
					label: 'Published',
					description: 'Make this record visible to the team.'
				}
			}
		},
		description: {
			type: 'textarea',
			label: 'Description',
			placeholder: 'Describe when and how this record should be used.',
			helper: 'Keep the description concise and actionable.',
			onValidate: (description) =>
				description.length > 180 ? 'Keep the description under 180 characters.' : false
		}
	} satisfies FormInputs;

	const initialRecords: RecordSummary[] = [
		{
			id: 'rec-onboarding',
			name: 'Customer onboarding',
			slug: 'customer-onboarding',
			category: 'Operations',
			description: 'The standard checklist for taking a new customer from kickoff to launch.',
			published: true
		},
		{
			id: 'rec-roadmap',
			name: 'Quarterly roadmap',
			slug: 'quarterly-roadmap',
			category: 'Product',
			description: 'Priorities, owners, and expected outcomes for the current quarter.',
			published: false
		}
	];

	let records = $state<RecordSummary[]>(initialRecords);
	let selectedId = $state<string | null>('rec-onboarding');
	let editorValue = $state<LiveFormValue<typeof editorInputs>>({
		name: initialRecords[0].name,
		slug: initialRecords[0].slug,
		category: initialRecords[0].category,
		description: initialRecords[0].description,
		published: initialRecords[0].published
	});
	let savedMessage = $state('');

	const isCreating = $derived(selectedId === null);

	function selectRecord(record: RecordSummary): void {
		selectedId = record.id;
		editorValue = {
			name: record.name,
			slug: record.slug,
			category: record.category,
			description: record.description,
			published: record.published
		};
		savedMessage = '';
	}

	function startCreate(): void {
		selectedId = null;
		editorValue = {
			name: '',
			slug: '',
			category: undefined,
			description: '',
			published: false
		};
		savedMessage = '';
	}

	function cancelEditing(): void {
		const currentRecord = records.find((record) => record.id === selectedId) ?? records[0];
		if (currentRecord) selectRecord(currentRecord);
	}

	function saveRecord(value: InferFormValue<typeof editorInputs>): void {
		const record: RecordSummary = {
			id: selectedId ?? `rec-${value.slug}`,
			name: value.name,
			slug: value.slug,
			category: value.category,
			description: value.description ?? '',
			published: value.published ?? false
		};

		if (isCreating) {
			records = [...records, record];
			selectedId = record.id;
			savedMessage = `${record.name} was created.`;
			return;
		}

		records = records.map((entry) => (entry.id === selectedId ? record : entry));
		savedMessage = `${record.name} was updated.`;
	}

	function deleteRecord(): void {
		if (!selectedId) return;
		records = records.filter((record) => record.id !== selectedId);
		const nextRecord = records[0];
		if (nextRecord) {
			selectRecord(nextRecord);
			savedMessage = 'The record was deleted.';
		} else {
			startCreate();
		}
	}
</script>

<section class="mx-auto grid w-full max-w-6xl gap-xl lg:grid-cols-3">
	<aside class="flex min-w-0 flex-col gap-lg lg:col-span-1">
		<div class="flex items-start justify-between gap-md">
			<div class="flex min-w-0 flex-col gap-sm">
				<p class="text-neutral text-lg font-semibold">Records</p>
				<p class="text-neutral/65 text-sm">Choose a record to edit or create a new one.</p>
			</div>
			<Button squared label="Create record" onclick={startCreate}>
				{#snippet prefix()}{@render plusIcon()}{/snippet}
			</Button>
		</div>

		<nav
			aria-label="Records"
			class="border-neutral-muted bg-surface flex flex-col gap-sm rounded-lg border p-md"
		>
			{#each records as record (record.id)}
				<MenuOption
					title={record.name}
					description={record.category}
					active={selectedId === record.id}
					color={selectedId === record.id ? 'primary' : 'neutral'}
					attrs={{ 'aria-pressed': selectedId === record.id }}
					onclick={() => selectRecord(record)}
				/>
			{/each}

			{#if records.length === 0}
				<div class="flex flex-col gap-sm p-lg text-center">
					<p class="text-neutral font-medium">No records yet</p>
					<p class="text-neutral/65 text-sm">Create the first record to get started.</p>
				</div>
			{/if}
		</nav>
	</aside>

	<div class="min-w-0 lg:col-span-2">
		<Form
			inputs={editorInputs}
			bind:value={editorValue}
			variant="card"
			title={isCreating ? 'Create record' : 'Edit record'}
			description={isCreating
				? 'Add a reusable record to the workspace.'
				: 'Update this record without changing its identifier.'}
			onSubmit={saveRecord}
			actions={[
				{
					children: isCreating ? 'Cancel' : 'Discard changes',
					prefix: arrowLeftIcon,
					variant: 'ghost',
					color: 'neutral',
					onAction: cancelEditing
				},
				...(isCreating
					? []
					: [
							{
								children: 'Delete',
								prefix: trashIcon,
								variant: 'outline' as const,
								color: 'danger' as const,
								onAction: deleteRecord
							}
						]),
				{
					children: isCreating ? 'Create record' : 'Save changes',
					prefix: floppyDiskIcon,
					onAction: (form) => form.submit()
				}
			]}
		>
			{#if savedMessage}
				<div
					class="border-success/30 bg-success/10 text-success-dark flex items-center gap-sm rounded-md border p-md text-sm"
					role="status"
				>
					<span class="shrink-0">{@render checkCircleIcon()}</span>
					<span>{savedMessage}</span>
				</div>
			{/if}
		</Form>
	</div>
</section>
