<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Autocomplete from '$lib/components/Form/Autocomplete/Autocomplete.svelte';
	import type {
		AutocompleteItems,
		AutocompleteItemsRequest,
		AutocompleteMode,
		AutocompleteSelectPayload
	} from '$lib/components/Form/Autocomplete/autocomplete.props.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const fruits = [
		'Apple',
		'Apricot',
		'Avocado',
		'Banana',
		'Blackberry',
		'Blueberry',
		'Cherry',
		'Clementine',
		'Coconut',
		'Cranberry',
		'Date',
		'Fig',
		'Grape',
		'Grapefruit',
		'Kiwi',
		'Lemon',
		'Lime',
		'Mango',
		'Orange',
		'Papaya',
		'Peach',
		'Pear',
		'Pineapple',
		'Plum',
		'Raspberry',
		'Strawberry'
	];

	const domains = ['gmail.com', 'outlook.com', 'proton.me', 'icloud.com', 'yahoo.com', 'hey.com'];

	const cities = [
		{ value: 'paris', label: 'Paris', description: 'France' },
		{ value: 'pau', label: 'Pau', description: 'France' },
		{ value: 'lyon', label: 'Lyon', description: 'France' },
		{ value: 'lisbon', label: 'Lisbon', description: 'Portugal' },
		{ value: 'porto', label: 'Porto', description: 'Portugal' },
		{ value: 'madrid', label: 'Madrid', description: 'Spain' },
		{ value: 'berlin', label: 'Berlin', description: 'Germany' },
		{ value: 'bern', label: 'Bern', description: 'Switzerland' }
	];

	const grouped: AutocompleteItems = [
		{ label: 'Berries', items: ['Blackberry', 'Blueberry', 'Raspberry', 'Strawberry'] },
		{ label: 'Citrus', items: ['Clementine', 'Grapefruit', 'Lemon', 'Lime', 'Orange'] },
		'Kiwi'
	];

	// Waits `ms`, rejecting as soon as the request is aborted by a newer text.
	const delay = (ms: number, signal?: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal?.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(new DOMException('Aborted', 'AbortError'));
			});
		});

	// Suggestions from a slow API. `signal` is aborted when a newer text replaces this request.
	const searchCities = async (query: string, { signal }: AutocompleteItemsRequest) => {
		await delay(300, signal);
		const text = query.trim().toLowerCase();
		return cities.filter((city) => city.label.toLowerCase().includes(text));
	};

	// Typing the part before the @ suggests the domains that follow it.
	const emailSuggestions = (query: string) => {
		const at = query.indexOf('@');
		if (at < 1) return [];
		const typed = query.slice(at + 1).toLowerCase();
		return domains
			.filter((domain) => domain.startsWith(typed))
			.map((domain) => ({ value: domain, label: query.slice(0, at + 1) + domain }));
	};

	const modes: { mode: AutocompleteMode; text: string }[] = [
		{ mode: 'list', text: 'Filtered. The text changes only when you choose one.' },
		{ mode: 'both', text: 'Filtered, and the input previews the highlighted suggestion.' },
		{ mode: 'inline', text: 'Not filtered, and the input previews the highlighted suggestion.' },
		{ mode: 'none', text: 'Not filtered. The text never changes until you choose one.' }
	];

	let value1 = $state<string | null>('Ban');
	let value2 = $state<string | null>(null);
	let value3 = $state<string | null>(null);
	let value4 = $state<string | null>(null);
	let value5 = $state<string | null>(null);
	let value6 = $state<string | null>(null);
	let value7 = $state<string | null>(null);
	let value8 = $state<string | null>('Kiwi');
	let open9 = $state(false);
	let submitted = $state('Nothing submitted yet');
	let chosen = $state('Nothing chosen yet');

	const onSelect = ({ item, value }: AutocompleteSelectPayload) => {
		chosen = `${value} (${item.value})`;
	};

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
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Autocomplete"
	subtitle="Free text with suggestions: the value is what is typed, and a suggestion is a shortcut for typing it."
	component="Autocomplete"
	features={[
		{ label: 'role=combobox, aria-autocomplete follows the mode', test: 'a11y:autocomplete.aria' },
		'The value is the typed text; the input submits it in native forms',
		{
			label: 'Enter with nothing highlighted keeps the text and leaves it to the form',
			test: 'a11y:autocomplete.enter-keeps-text'
		},
		{
			label: 'Arrow keys open and browse, Escape closes and keeps focus',
			test: 'a11y:autocomplete.keyboard'
		},
		{
			label: 'Inline completion previews a suggestion and Escape restores the typed text',
			test: 'a11y:autocomplete.inline-completion'
		},
		{ label: 'Result counts announced politely', test: 'a11y:autocomplete.live-region' },
		{ label: 'Read-only: browse the list, keep the text', test: 'a11y:autocomplete.readonly' },
		'Suggestion modes: list, both, inline and none',
		'Async suggestions with abort; stale responses are ignored',
		'Strings, options, groups and custom rows'
	]}
>
	<ComponentCard
		{controls}
		description="Type a fruit, or anything else"
		code={`<Autocomplete
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Favorite fruit"
	description="Pick a suggestion or type your own"
	placeholder="Start typing..."
	items={['Apple', 'Apricot', 'Banana', 'Cherry']}
	bind:value
/>`}
	>
		<div class="w-full max-w-md">
			<Autocomplete
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Favorite fruit"
				description="Pick a suggestion or type your own"
				placeholder="Start typing..."
				items={fruits}
				bind:value={value1}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large inputs."
			code={`<Autocomplete size="small" label="Small" items={fruits} />
<Autocomplete size="normal" label="Normal" items={fruits} />
<Autocomplete size="large" label="Large" items={fruits} />`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Autocomplete size="small" label="Small" placeholder="Start typing..." items={fruits} />
				<Autocomplete size="normal" label="Normal" placeholder="Start typing..." items={fruits} />
				<Autocomplete size="large" label="Large" placeholder="Start typing..." items={fruits} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Modes"
			description="mode decides whether suggestions are filtered and whether the input previews the highlighted one. Use the arrow keys in each."
			code={`<Autocomplete mode="list" items={fruits} />
<Autocomplete mode="both" items={fruits} />
<Autocomplete mode="inline" items={fruits} />
<Autocomplete mode="none" items={fruits} />`}
		>
			<div class="grid w-full max-w-md gap-6">
				{#each modes as { mode, text } (mode)}
					<Autocomplete
						{mode}
						label={`mode="${mode}"`}
						description={text}
						placeholder="Start typing..."
						items={fruits}
						openOnFocus
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Inline completion"
			description="Type 'ap' and the rest of the first match is completed and selected. Keep typing to narrow it, press Backspace to remove it, Escape to put your text back, and Tab or the right arrow to accept it."
			code={`<Autocomplete mode="both" autoHighlight items={fruits} bind:value />`}
		>
			<div class="w-full max-w-md">
				<Autocomplete
					mode="both"
					autoHighlight
					label="Fruit"
					placeholder="Start typing..."
					items={fruits}
					bind:value={value2}
				/>
				<p class="text-neutral/70 mt-2 text-xs">value: {JSON.stringify(value2)}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Async suggestions"
			description="A slow search. A newer text aborts the older request, and a late response never replaces a newer list."
			code={`<Autocomplete
	label="City"
	items={async (query, { signal }) => {
		const response = await fetch('/api/cities?q=' + encodeURIComponent(query), { signal });
		return response.json();
	}}
	onSelect={({ item }) => console.log(item.value)}
	bind:value
/>`}
		>
			<div class="w-full max-w-md">
				<Autocomplete
					label="City"
					placeholder="Try 'p'"
					items={searchCities}
					{onSelect}
					bind:value={value3}
				/>
				<p class="text-neutral/70 mt-2 text-xs">Chosen: {chosen}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Computed suggestions"
			description="items can be any function of the text, such as the domains that complete an email address."
			code={`<Autocomplete
	label="Email"
	autocomplete="email"
	shouldFilter={false}
	items={(query) => emailSuggestions(query)}
	bind:value
/>`}
		>
			<div class="w-full max-w-md">
				<Autocomplete
					label="Email"
					autocomplete="email"
					placeholder="name@"
					items={emailSuggestions}
					bind:value={value4}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Groups and descriptions"
			description={`Strings, options with a description, and { label, items } groups can be mixed.`}
			code={`<Autocomplete
	openOnFocus
	items={[
		{ label: 'Berries', items: ['Blackberry', 'Blueberry'] },
		{ label: 'Citrus', items: ['Lemon', 'Lime'] },
		'Kiwi'
	]}
/>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Autocomplete label="Fruit" openOnFocus items={grouped} bind:value={value5} />
				<Autocomplete label="City" openOnFocus items={cities} bind:value={value6} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom rows"
			description="The item snippet replaces the title and description layout of every row."
			code={`<Autocomplete items={cities} openOnFocus>
	{#snippet item(option)}
		<span class="flex w-full items-center justify-between gap-md">
			<span>{option.label}</span>
			<span class="text-neutral/70 text-xs">{option.description}</span>
		</span>
	{/snippet}
</Autocomplete>`}
		>
			<div class="w-full max-w-md">
				<Autocomplete label="City" items={cities} openOnFocus>
					{#snippet item(option)}
						<span class="gap-md flex w-full items-center justify-between">
							<span>{option.label}</span>
							<span class="text-neutral/70 text-xs">{option.description}</span>
						</span>
					{/snippet}
				</Autocomplete>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Filter and limit"
			description="A custom filter matches names that start with the text, and the list stops at five matches."
			code={`<Autocomplete
	items={fruits}
	limit={5}
	filter={(option, text) => option.label.toLowerCase().startsWith(text.toLowerCase())}
/>`}
		>
			<div class="w-full max-w-md">
				<Autocomplete
					label="Names starting with"
					items={fruits}
					limit={5}
					filter={(option, text) => option.label.toLowerCase().startsWith(text.toLowerCase())}
					bind:value={value7}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Read-only"
			description="The list opens and can be browsed, but the text stays; it still submits with a form."
			code={`<Autocomplete readOnly openOnFocus items={fruits} bind:value />`}
		>
			<div class="w-full max-w-md">
				<Autocomplete readOnly openOnFocus label="Fruit" items={fruits} bind:value={value8} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Open state"
			description="open is bindable; onOpenChange runs before the change and can cancel it. This one cannot be dismissed with Escape."
			code={`<Autocomplete
	items={fruits}
	openOnFocus
	bind:open
	onOpenChange={(next, details) => {
		if (!next && details.reason === 'escape-key') details.cancel();
	}}
/>`}
		>
			<div class="w-full max-w-md">
				<Autocomplete
					items={fruits}
					openOnFocus
					placeholder="Escape does not close this list"
					bind:open={open9}
					onOpenChange={(next, details) => {
						if (!next && details.reason === 'escape-key') details.cancel();
					}}
				/>
				<p class="text-neutral/70 mt-2 text-xs">open: {open9}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Native form"
			description="The input submits its text under the field's name. Enter with nothing highlighted submits the typed text; Enter on a highlighted suggestion chooses it first."
			code={`<form onsubmit={(event) => { event.preventDefault(); console.log(new FormData(event.currentTarget).get('fruit')); }}>
	<Autocomplete name="fruit" label="Fruit" items={fruits} />
	<Button type="submit">Submit</Button>
</form>`}
		>
			<form
				class="grid w-full max-w-md gap-3"
				onsubmit={(event) => {
					event.preventDefault();
					submitted = `fruit = ${String(new FormData(event.currentTarget).get('fruit') ?? '(empty)')}`;
				}}
			>
				<Autocomplete name="fruit" label="Fruit" items={fruits} />
				<Button type="submit" class="w-fit">Submit</Button>
				<p class="text-neutral/70 text-xs">{submitted}</p>
			</form>
		</ComponentCard>
	{/snippet}
</DocPage>
