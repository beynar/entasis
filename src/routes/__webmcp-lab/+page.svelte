<script lang="ts">
	// Verification page for the WebMCP prototype: the root layout turns `webmcp` on for this route.
	import { Button } from '$lib/components/Button/index.js';
	import { ask, Form } from '$lib/components/Form/Form/index.js';
	import type { AskResult } from '$lib/components/Form/Form/index.js';

	let submitted = $state<string>('—');
	let askResult = $state<string>('—');
	let failNext = $state(false);
	let allTypes = $state<string>('—');

	const plans = [
		{ value: 'free', label: 'Gratuit' },
		{ value: 'team', label: 'Équipe' },
		{ value: 'corp', label: 'Entreprise', disabled: true }
	];

	async function openAsk() {
		const result: AskResult<never> = (await ask({
			title: 'Renommer le projet',
			description: 'Le nom apparaît dans la barre latérale.',
			inputs: { name: { type: 'text', label: 'Nouveau nom', required: true, maxLength: 20 } },
			confirm: 'Renommer',
			cancel: 'Annuler'
		})) as never;
		askResult = JSON.stringify(result);
	}
</script>

<main class="mx-auto grid max-w-xl gap-8 p-8">
	<Form
		variant="card"
		title="Créer un compte"
		description="Ouvre un compte pour l'équipe."
		inputs={{
			email: { type: 'email', label: 'Adresse e-mail', required: true },
			password: { type: 'password', label: 'Mot de passe', required: true },
			plan: { type: 'select', label: 'Offre', items: plans, required: true },
			seats: {
				type: 'number',
				label: 'Nombre de sièges',
				min: 1,
				max: 50,
				visible: (value) => value.plan === 'team',
				required: true
			},
			start: { type: 'date', label: 'Début' },
			at: { type: 'time', label: 'Heure' },
			terms: { type: 'checkbox', label: "J'accepte les conditions" },
			avatar: { type: 'file', label: 'Avatar' },
			internal: { type: 'text', label: 'Code interne', disabled: true },
			referrer: { type: 'text', label: 'Parrain', defaultValue: 'alice', readOnly: true },
			secret: { type: 'text', label: 'Note interne', tool: false }
		}}
		onSubmit={async (value) => {
			if (failNext) throw new Error('boom with a value');
			const { password, ...rest } = value;
			submitted = JSON.stringify({ ...rest, password: password ? '***' : null });
		}}
		actions={[{ children: 'Créer', onAction: (form) => form.submit() }]}
	/>

	<Form inputs={{ query: { type: 'text', label: 'Recherche' } }} />

	<Form
		title="Tous les types"
		tool={{ consequential: false }}
		onSubmit={(value) => (allTypes = JSON.stringify(value))}
		inputs={{
			text: { type: 'text', label: 'Text' },
			textarea: { type: 'textarea', label: 'Textarea' },
			richText: { type: 'rich-text', label: 'Rich text' },
			url: { type: 'url', label: 'Url' },
			phone: { type: 'phone', label: 'Phone' },
			color: { type: 'color', label: 'Color' },
			pin: { type: 'pin', label: 'Pin', length: 4 },
			number: { type: 'number', label: 'Number', min: 0, max: 10 },
			slider: { type: 'slider', label: 'Slider', min: 0, max: 100 },
			sliderRange: { type: 'slider-range', label: 'Slider range', min: 0, max: 100 },
			rating: { type: 'rating', label: 'Rating' },
			time: { type: 'time', label: 'Time' },
			date: { type: 'date', label: 'Date' },
			dateSelector: { type: 'date', display: 'selector', label: 'Date selector' },
			datetime: { type: 'datetime', label: 'Datetime' },
			calendar: { type: 'calendar', label: 'Calendar' },
			calendarRange: { type: 'calendar-range', label: 'Calendar range' },
			checkbox: { type: 'checkbox', label: 'Checkbox' },
			switch: { type: 'switch', label: 'Switch' },
			select: { type: 'select', label: 'Select', items: plans },
			selectMultiple: { type: 'select-multiple', label: 'Select multiple', items: plans },
			radio: { type: 'radio', label: 'Radio', items: plans },
			checkboxes: { type: 'checkboxes', label: 'Checkboxes', items: plans },
			combobox: { type: 'combobox', label: 'Combobox', items: plans },
			tag: { type: 'tag', label: 'Tags' },
			tagGroup: { type: 'tag-group', label: 'Tag group', items: plans },
			keyvalue: { type: 'keyvalue', label: 'Key value' },
			address: { type: 'address', label: 'Address' }
		}}
	/>

	<Form title="Formulaire privé" tool={false} inputs={{ a: { type: 'text', label: 'A' } }} />

	<div class="flex gap-2">
		<Button onclick={openAsk}>Ouvrir ask()</Button>
		<Button variant="outline" onclick={() => (failNext = !failNext)}>failNext: {failNext}</Button>
	</div>

	<pre data-testid="submitted">{submitted}</pre>
	<pre data-testid="ask-result">{askResult}</pre>
	<pre data-testid="all-types">{allTypes}</pre>
</main>
