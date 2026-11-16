<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import {
		MaskedInput,
		type MaskedInputValueDetails
	} from '$lib/components/Form/MaskedInput/index.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const controls = createComponentControls([
		{ name: 'size', type: 'segmented', label: 'Size', value: 'normal', options: sizes },
		{ name: 'density', type: 'segmented', label: 'Density', value: 'normal', options: densities },
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{
			name: 'showMask',
			type: 'segmented',
			label: 'Show mask',
			value: 'focus',
			options: ['always', 'focus', 'never']
		},
		{
			name: 'valueFormat',
			type: 'segmented',
			label: 'Value',
			value: 'raw',
			options: ['raw', 'masked']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);

	let plate = $state<string | null>(null);
	let details = $state<MaskedInputValueDetails>({ masked: '', raw: '', complete: false });
	let siret = $state<string | null>(null);
	let iban = $state<string | null>(null);
	let phone = $state<string | null>(null);
	let reference = $state<string | null>(null);
	let amount = $state<string | null>(null);
	let submitted = $state('');

	const describe = ({ masked, raw, complete }: MaskedInputValueDetails) =>
		`Masked ${masked || '—'} · raw ${raw || '—'} · ${complete ? 'complete' : 'incomplete'}`;
</script>

<DocPage
	title="Masked input"
	subtitle="A text field that formats what is typed to a fixed pattern, with the caret, paste and undo of a native input."
	component="MaskedInput"
	relatedComponents={['text-input', 'pin-input', 'phone-input']}
	features={[
		{ label: 'Separators written as you type', test: 'masked-input:typing' },
		{ label: 'Caret stays put on edits in the middle', test: 'masked-input:caret' },
		{ label: 'Raw or formatted text pastes alike', test: 'masked-input:paste' },
		{ label: 'Empty slots always, on focus or never', test: 'masked-input:show-mask' },
		{ label: 'Raw or masked value', test: 'masked-input:value-format' },
		{ label: 'Read-only still submits', test: 'masked-input:read-only' },
		{ label: 'Native form submission', test: 'masked-input:native-form' },
		{ label: 'Incomplete values are invalid', test: 'masked-input:incomplete' },
		'Optional and repeating slots',
		'Several masks or a function',
		'Custom tokens with case transforms'
	]}
>
	<ComponentCard
		{controls}
		description="# is a digit, A a letter (kept in the case typed), * a letter or a digit. The value holds the typed characters only, or the text as shown with valueFormat masked."
		code={`<script lang="ts">
	import { MaskedInput } from 'entasis/masked-input';

	let plate = $state<string | null>(null);
${'</' + 'script>'}

<MaskedInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	showMask="${controls.value.showMask}"
	valueFormat="${controls.value.valueFormat}"
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
	label="Plate"
	mask="AA-###-AA"
	bind:value={plate}
	onMaskedChange={({ masked, raw, complete }) => console.log(masked, raw, complete)}
/>`}
		class="!min-h-fit"
	>
		<div class="grid w-full max-w-md gap-2">
			<MaskedInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				showMask={controls.value.showMask}
				valueFormat={controls.value.valueFormat}
				disabled={controls.value.disabled}
				readOnly={controls.value.readOnly}
				label="Plate"
				mask="AA-###-AA"
				bind:value={plate}
				onMaskedChange={(next) => (details = next)}
			/>
			<p class="text-neutral/70 text-sm">
				Value {JSON.stringify(plate)} · {describe(details)}
			</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Company number"
			description="Spaces are written as the digits come; the numeric keyboard opens on phones because every slot is a digit."
			code={`<MaskedInput label="SIRET" mask="### ### ### #####" bind:value={siret} />`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<MaskedInput
					label="SIRET"
					mask="### ### ### #####"
					bind:value={siret}
					helper={`Value: ${siret ?? 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom tokens"
			description="An IBAN takes letters and digits in upper case: tokens add slot characters, and a transform rewrites what is typed before it is checked, so typing fr76 shows FR76."
			code={`<MaskedInput
	label="IBAN"
	mask="AA## XXXX XXXX XXXX XXXX XXXX XXX"
	tokens={{
		A: { pattern: /[A-Z]/, transform: 'upper' },
		X: { pattern: /[A-Z0-9]/, transform: 'upper' }
	}}
	showMask="focus"
	bind:value={iban}
/>`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<MaskedInput
					label="IBAN"
					mask="AA## XXXX XXXX XXXX XXXX XXXX XXX"
					tokens={{
						A: { pattern: /[A-Z]/, transform: 'upper' },
						X: { pattern: /[A-Z0-9]/, transform: 'upper' }
					}}
					showMask="focus"
					bind:value={iban}
					helper={`Value: ${iban ?? 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Several masks"
			description="A list of masks uses the first one the text fits: ten digits read as a national number, typing a + or an eleventh digit moves to the international one."
			code={`<MaskedInput
	label="Phone"
	mask={['(###) ###-####', '+## # ## ## ## ##']}
	showMask="focus"
	autocomplete="tel"
	bind:value={phone}
/>`}
			class="!min-h-fit"
		>
			<div class="w-full max-w-md">
				<MaskedInput
					label="Phone"
					mask={['(###) ###-####', '+## # ## ## ## ##']}
					showMask="focus"
					autocomplete="tel"
					bind:value={phone}
					helper={`Value: ${phone ?? 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Optional and repeating slots"
			description="? after a token makes it optional: type the dash early to skip it. + lets a token repeat until the next separator; here, as many digits as needed before the cents, kept with the separators by valueFormat masked."
			code={`<MaskedInput label="Reference" mask="AA-##?-###" bind:value={reference} />
<MaskedInput label="Amount" mask="#+.## €" valueFormat="masked" bind:value={amount} />`}
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-md gap-4">
				<MaskedInput
					label="Reference"
					mask="AA-##?-###"
					bind:value={reference}
					helper={`Try ab1-234 or ab12-345 · value: ${reference ?? 'empty'}`}
				/>
				<MaskedInput
					label="Amount"
					mask="#+.## €"
					valueFormat="masked"
					bind:value={amount}
					helper={`Type . to reach the cents · value: ${amount ?? 'empty'}`}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="In a Form"
			description="The entry type is masked. A value that leaves a required slot empty is invalid, required or not, with a message from the i18n catalog; messages.incomplete replaces it for one field."
			code={`<Form
	inputs={{
		siret: { type: 'masked', label: 'SIRET', mask: '### ### ### #####', required: true },
		postalCode: {
			type: 'masked',
			label: 'Postal code',
			mask: '#####',
			messages: { incomplete: (length) => 'Enter the ' + length + ' digits' }
		}
	}}
	onSubmit={(value) => (submitted = JSON.stringify(value))}
>
	{#snippet children(form)}
		<Button onclick={() => form.submit()}>Save</Button>
	{/snippet}
</Form>`}
			class="!min-h-fit"
		>
			<div class="grid w-full max-w-md gap-4">
				<Form
					inputs={{
						siret: { type: 'masked', label: 'SIRET', mask: '### ### ### #####', required: true },
						postalCode: {
							type: 'masked',
							label: 'Postal code',
							mask: '#####',
							messages: { incomplete: (length) => 'Enter the ' + length + ' digits' }
						}
					}}
					onSubmit={(value) => (submitted = JSON.stringify(value))}
				>
					{#snippet children(form)}
						<Button onclick={() => form.submit()}>Save</Button>
					{/snippet}
				</Form>
				{#if submitted}
					<p class="text-neutral/70 text-sm">{submitted}</p>
				{/if}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
