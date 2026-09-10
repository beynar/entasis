<script lang="ts">
	import { Form, type FormInputs, type InferFormValue, type LiveFormValue } from 'svelai/form';
	import { arrowCounterClockwiseIcon } from 'svelai/icons/arrowCounterClockwise';
	import { bellIcon } from 'svelai/icons/bell';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { desktopIcon } from 'svelai/icons/desktop';
	import { envelopeIcon } from 'svelai/icons/envelope';
	import { floppyDiskIcon } from 'svelai/icons/floppyDisk';
	import { moonIcon } from 'svelai/icons/moon';
	import { sunIcon } from 'svelai/icons/sun';

	const settingsInputs = {
		account: {
			type: 'group',
			label: 'Account',
			description: 'Personal details used across your workspace.',
			columns: 2,
			inputs: {
				displayName: {
					type: 'text',
					label: 'Display name',
					placeholder: 'Ada Lovelace',
					required: true,
					onValidate: (name) => (name.trim().length < 2 ? 'Enter at least two characters.' : false)
				},
				email: {
					type: 'email',
					label: 'Email address',
					placeholder: 'ada@example.com',
					required: true
				},
				timezone: {
					type: 'select',
					label: 'Timezone',
					required: true,
					items: [
						{ label: 'Pacific time (UTC−08:00)', value: 'America/Los_Angeles' },
						{ label: 'Eastern time (UTC−05:00)', value: 'America/New_York' },
						{ label: 'Central European time (UTC+01:00)', value: 'Europe/Paris' }
					]
				},
				language: {
					type: 'select',
					label: 'Language',
					required: true,
					items: [
						{ label: 'English', value: 'en' },
						{ label: 'French', value: 'fr' },
						{ label: 'Spanish', value: 'es' }
					]
				}
			}
		},
		notifications: {
			type: 'group',
			label: 'Notifications',
			description: 'Choose which updates should reach you.',
			columns: 1,
			inputs: {
				productUpdates: {
					type: 'switch',
					label: 'Product updates',
					description: 'New features, improvements, and release notes.',
					prefix: bellIcon
				},
				weeklyDigest: {
					type: 'switch',
					label: 'Weekly digest',
					description: 'A Monday summary of activity in your workspace.',
					prefix: envelopeIcon
				},
				securityAlerts: {
					type: 'switch',
					label: 'Security alerts',
					description: 'Important sign-in and account protection notices.',
					disabled: true,
					value: true
				}
			}
		},
		appearance: {
			type: 'group',
			label: 'Appearance',
			description: 'Set how the interface looks and feels.',
			columns: 1,
			inputs: {
				colorScheme: {
					type: 'radio',
					label: 'Color scheme',
					required: true,
					mode: 'card',
					items: [
						{
							label: 'Light',
							value: 'light',
							description: 'Use a bright interface.',
							icon: sunIcon
						},
						{
							label: 'Dark',
							value: 'dark',
							description: 'Reduce glare in low light.',
							icon: moonIcon
						},
						{
							label: 'System',
							value: 'system',
							description: 'Match your device setting.',
							icon: desktopIcon
						}
					]
				},
				compactMode: {
					type: 'switch',
					label: 'Compact mode',
					description: 'Show more information with tighter component density.'
				}
			}
		}
	} satisfies FormInputs;

	const defaultSettings: LiveFormValue<typeof settingsInputs> = {
		displayName: 'Ada Lovelace',
		email: 'ada@example.com',
		timezone: 'Europe/Paris',
		language: 'en',
		productUpdates: true,
		weeklyDigest: false,
		securityAlerts: true,
		colorScheme: 'system',
		compactMode: false
	};

	let settingsValue = $state<LiveFormValue<typeof settingsInputs>>({ ...defaultSettings });
	let savedMessage = $state('');

	function resetSettings(): void {
		settingsValue = { ...defaultSettings };
		savedMessage = 'Defaults were restored. Save to apply them.';
	}

	function saveSettings(value: InferFormValue<typeof settingsInputs>): void {
		settingsValue = value;
		savedMessage = `Settings saved for ${value.email}.`;
	}
</script>

<section class="mx-auto flex w-full max-w-4xl flex-col gap-lg">
	<div class="flex flex-col gap-sm">
		<p class="text-neutral text-lg font-semibold">Workspace preferences</p>
		<p class="text-neutral/65 text-sm">Changes apply to this account across desktop and mobile.</p>
	</div>

	<Form
		inputs={settingsInputs}
		bind:value={settingsValue}
		variant="sectioned"
		title="Settings"
		description="Manage your profile, notifications, and interface preferences."
		onSubmit={saveSettings}
		actions={[
			{
				children: 'Restore defaults',
				prefix: arrowCounterClockwiseIcon,
				variant: 'outline',
				color: 'neutral',
				onAction: resetSettings
			},
			{
				children: 'Save settings',
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
</section>
