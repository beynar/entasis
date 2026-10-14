<script lang="ts">
	// Choice controls in a plain <form> (a SvelteKit form action), or inside an entasis Form.
	import Theme from '../../Theme/Theme.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Form from '../Form/Form.svelte';
	import RadioInput from '../RadioInput/RadioInput.svelte';
	import Switch from '../Switch/Switch.svelte';
	import CheckboxesInput from './CheckboxesInput.svelte';

	let {
		scenario = 'native',
		dir = 'ltr',
		readOnly = false,
		radioDefault = 'pro',
		topicsDefault = [],
		selectAll = false,
		onNativeSubmit,
		onFormSubmit,
		onTermsChange,
		onTopicsChange,
		onPlanChange,
		onSwitchChange
	}: {
		scenario?: 'native' | 'entasis';
		dir?: 'ltr' | 'rtl';
		readOnly?: boolean;
		radioDefault?: string | null;
		topicsDefault?: string[];
		selectAll?: boolean;
		onNativeSubmit?: (data: FormData) => void;
		onFormSubmit?: (value: Record<string, unknown>) => void;
		onTermsChange?: (value: boolean | null) => void;
		onTopicsChange?: (value: string[]) => void;
		onPlanChange?: (value: string) => void;
		onSwitchChange?: (value: boolean | null) => void;
	} = $props();

	const plans = [
		{ value: 'free', label: 'Free', description: 'For trying things out' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'team', label: 'Team', disabled: true },
		{ value: 'max', label: 'Max' }
	];
	const topics = [
		{ value: 'news', label: 'News' },
		{ value: 'tips', label: 'Tips' },
		{ value: 'legal', label: 'Legal', disabled: true },
		{ value: 'offers', label: 'Offers' }
	];
</script>

<Theme>
	<div {dir}>
		{#if scenario === 'native'}
			<form
				data-testid="native-form"
				onsubmit={(event) => {
					event.preventDefault();
					onNativeSubmit?.(new FormData(event.currentTarget));
				}}
			>
				<button type="button">Before</button>
				<Checkbox
					name="terms"
					label="Terms"
					description="Accept the terms of service"
					{readOnly}
					onValueChange={onTermsChange}
				/>
				<CheckboxesInput
					name="topics"
					label="Topics"
					items={topics}
					defaultValue={topicsDefault}
					{selectAll}
					{readOnly}
					onValueChange={onTopicsChange}
				/>
				<RadioInput
					name="plan"
					label="Plan"
					items={plans}
					defaultValue={radioDefault}
					{readOnly}
					onValueChange={onPlanChange}
				/>
				<Switch name="alerts" label="Alerts" {readOnly} onValueChange={onSwitchChange} />
				<button type="submit">Save</button>
				<button type="button">After</button>
			</form>
		{:else}
			<Form
				inputs={{
					terms: { type: 'checkbox', label: 'Terms', description: 'Accept the terms of service' },
					plan: {
						type: 'radio',
						label: 'Plan',
						items: plans,
						defaultValue: radioDefault,
						// Pro and Max need an upgrade: the group is invalid while one of them is chosen.
						onValidate: (value: string) => value === 'max'
					},
					nickname: { type: 'text', label: 'Nickname' }
				}}
				onSubmit={(value) => onFormSubmit?.(value as Record<string, unknown>)}
			>
				{#snippet children(form)}
					<button type="button" onclick={() => form.submit()}>Submit form</button>
				{/snippet}
			</Form>
		{/if}
	</div>
</Theme>
