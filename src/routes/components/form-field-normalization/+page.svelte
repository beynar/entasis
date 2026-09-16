<script lang="ts">
	import type { FormInputs } from '$lib/components/Form/Form/form.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';

	const sizeGroups = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const;

	const planItems = [
		{ value: 'starter', label: 'Starter' },
		{ value: 'team', label: 'Team' },
		{ value: 'enterprise', label: 'Enterprise' }
	];

	const channelItems = [
		{ value: 'email', label: 'Email' },
		{ value: 'sms', label: 'SMS' },
		{ value: 'push', label: 'Push' }
	];

	const topicItems = [
		{ value: 'docs', label: 'Docs' },
		{ value: 'billing', label: 'Billing' },
		{ value: 'security', label: 'Security' }
	];

	const makeDate = (day: number) => new Date(2026, 6, day);

	const verificationGroups = sizeGroups.map(({ value: size, label }) => ({
		label,
		size,
		inputs: {
			title: {
				type: 'text',
				label: `${label} text`,
				placeholder: 'Workspace name',
				size
			},
			email: {
				type: 'email',
				label: `${label} email`,
				placeholder: 'team@example.com',
				size
			},
			website: {
				type: 'url',
				label: `${label} URL`,
				placeholder: 'https://example.com',
				size
			},
			password: {
				type: 'password',
				label: `${label} password`,
				placeholder: 'Secret value',
				size
			},
			summary: {
				type: 'textarea',
				label: `${label} textarea`,
				placeholder: 'Write a short note',
				size
			},
			phone: {
				type: 'phone',
				label: `${label} phone`,
				placeholder: 'Phone number',
				size
			},
			seatCount: {
				type: 'number',
				label: `${label} number`,
				value: 12,
				min: 1,
				size
			},
			satisfaction: {
				type: 'rating',
				label: `${label} rating`,
				value: 3,
				size
			},
			priority: {
				type: 'slider',
				label: `${label} slider`,
				value: 45,
				size
			},
			budget: {
				type: 'slider-range',
				label: `${label} slider range`,
				value: [25, 75],
				size
			},
			startDate: {
				type: 'date',
				label: `${label} date`,
				value: makeDate(9),
				size
			},
			reminder: {
				type: 'datetime',
				label: `${label} datetime`,
				value: makeDate(10),
				size
			},
			startTime: {
				type: 'time',
				label: `${label} time`,
				value: 9 * 60,
				size
			},
			meetingDay: {
				type: 'calendar',
				label: `${label} calendar`,
				value: makeDate(12),
				size
			},
			bookingWindow: {
				type: 'calendar-range',
				label: `${label} calendar range`,
				value: [makeDate(14), makeDate(18)],
				size
			},
			plan: {
				type: 'select',
				label: `${label} select`,
				value: 'team',
				items: planItems,
				size
			},
			owner: {
				type: 'combobox',
				label: `${label} combobox`,
				value: 'email',
				items: channelItems,
				size
			},
			accountType: {
				type: 'radio',
				label: `${label} radio`,
				value: 'team',
				items: planItems,
				size
			},
			emailUpdates: {
				type: 'checkbox',
				label: `${label} checkbox`,
				value: true,
				size
			},
			channels: {
				type: 'checkboxes',
				label: `${label} checkboxes`,
				value: ['email'],
				items: channelItems,
				size
			},
			enabled: {
				type: 'switch',
				label: `${label} switch`,
				value: true,
				size
			},
			attachment: {
				type: 'file',
				label: `${label} file`,
				placeholder: 'Drop a file',
				size
			},
			attachments: {
				type: 'files',
				label: `${label} files`,
				placeholder: 'Drop files',
				size
			},
			tags: {
				type: 'tag',
				label: `${label} tags`,
				value: ['docs'],
				placeholder: 'Add tags',
				items: topicItems,
				customTags: true,
				size
			},
			topic: {
				type: 'tag-group',
				label: `${label} tag group`,
				value: 'docs',
				items: topicItems,
				size
			},
			metadata: {
				type: 'keyvalue',
				label: `${label} key/value`,
				value: [{ key: 'env', value: 'prod' }],
				size
			},
			code: {
				type: 'pin',
				label: `${label} pin`,
				value: '123',
				size
			},
			notes: {
				type: 'rich-text',
				label: `${label} rich text`,
				value: 'Review the onboarding notes.',
				toolbar: 'none',
				size
			}
		} satisfies FormInputs
	}));
</script>

<DocPage
	title="Form field normalization"
	subtitle="Compact verification for Form fields using small, normal, and large sizes."
	component="Form"
	features={[
		'Uses every supported Form input branch',
		'Renders each branch at small, normal, and large sizes',
		'Keeps examples on existing docs components'
	]}
>
	<ComponentCard
		description="All Form-rendered fields at each supported size."
		code={`<Form
	inputs={{
		title: { type: 'text', label: 'Normal text', size: 'normal' },
		email: { type: 'email', label: 'Normal email', size: 'normal' },
		summary: { type: 'textarea', label: 'Normal textarea', size: 'normal' },
		priority: { type: 'slider', label: 'Normal slider', size: 'normal' },
		startDate: { type: 'date', label: 'Normal date', size: 'normal' },
		plan: { type: 'select', label: 'Normal select', items, size: 'normal' },
		enabled: { type: 'checkbox', label: 'Normal checkbox', size: 'normal' },
		tags: { type: 'tag', label: 'Normal tags', size: 'normal' },
		metadata: { type: 'keyvalue', label: 'Normal key/value', size: 'normal' },
		code: { type: 'pin', label: 'Normal pin', size: 'normal' },
		notes: { type: 'rich-text', label: 'Normal rich text', toolbar: 'none', size: 'normal' }
	}}
/>`}
		class="!min-h-fit"
	>
		<div class="grid w-full gap-6 xl:grid-cols-3">
			{#each verificationGroups as group (group.size)}
				<section class="flex flex-col gap-3">
					<h2 class="text-neutral text-sm font-semibold">{group.label}</h2>
					<Form inputs={group.inputs} />
				</section>
			{/each}
		</div>
	</ComponentCard>
</DocPage>
