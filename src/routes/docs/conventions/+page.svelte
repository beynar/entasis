<script lang="ts">
	import Code from '$lib/components/Code/Code.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';

	const importCode = `import { Button } from 'svelai/button';
import { TextInput } from 'svelai/text-input';
import { Dialog } from 'svelai/dialog';`;

	const booleanCode = `<Dialog bind:open />
<ToggleButton bind:value />
<Button disabled loading />`;

	const collectionCode = `<Accordion items={sections} />
<Select items={roles} />
<RadioInput items={plans} />
<Carousel items={slides} />
<Tabs items={views} />
<ButtonGroup items={actions} />
<MultiStepForm items={steps} />
<Table items={users} />
<Sidebar items={navigation} />`;

	const slotCode = `<Button>
	{#snippet prefix()}+{/snippet}
	Save
</Button>

<Dialog bind:open>
	{#snippet title()}Delete project{/snippet}
	{#snippet footer()}
		<Button variant="ghost">Cancel</Button>
		<Button color="danger">Delete</Button>
	{/snippet}

	This action cannot be undone.
</Dialog>`;

	const themeCode =
		`<script>
	import { Button, setButtonTheme } from 'svelai/button';

	setButtonTheme({
		root: { base: 'rounded-full' },
		prefix: { base: 'text-primary' }
	});
	</` +
		`script>

<Button theme={{ root: { base: 'shadow-sm' } }}>
	Save
</Button>`;

	const namesCode = `Switch
RadioInput
RadioOption
CheckboxesInput
onclick
onpointerenter
onpointerleave
bind:open`;

	const eventCode = `onOpenChange={(open) => ...}
onValueChange={(value) => ...}
onSelect={(value) => ...}

// Native DOM handlers use Svelte 5 lowercase attributes.
onclick={(event) => ...}
onpointerenter={(event) => ...}
onpointerleave={(event) => ...}
onscroll={(event) => ...}`;
</script>

{#snippet ic(text: string)}<code class="bg-neutral-muted rounded px-1 py-0.5 text-sm">{text}</code
	>{/snippet}

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">Conventions</h1>
		<p class="text-neutral/60 text-balance">
			This is the public API contract. When writing code, examples, or generated output, copy these
			shapes first.
		</p>
	</header>

	<Separator class="my-2" children="Imports" />

	<p class="text-neutral/60">
		Package paths use kebab-case. Exported component names use PascalCase.
	</p>

	<Code language="ts" code={importCode} />

	<Separator class="my-2" children="Props and bindings" />

	<p class="text-neutral/60">
		Public props use the shortest platform-shaped name that is still precise. Bindings use the same
		name as the prop.
	</p>

	<ul class="text-neutral/60 grid gap-2 text-sm">
		<li>Overlay state: {@render ic('open')} and {@render ic('bind:open')}.</li>
		<li>
			Editable and selected state: {@render ic('value')}, {@render ic('defaultValue')}, {@render ic(
				'bind:value'
			)}, and {@render ic('onValueChange')}.
		</li>
		<li>
			State flags: {@render ic('disabled')}, {@render ic('loading')}, {@render ic('selected')}, {@render ic(
				'active'
			)}.
		</li>
	</ul>

	<Code language="svelte" code={booleanCode} />

	<Separator class="my-2" children="Collections" />

	<p class="text-neutral/60">
		The top-level prop for a repeated rendered collection is {@render ic('items')}. The item type
		carries the domain meaning: {@render ic('RadioOption')}, {@render ic('TabItem')}, {@render ic(
			'TableRow'
		)}, {@render ic('SidebarGroup')}. Nested collections inside an item can also use {@render ic(
			'items'
		)}. Supporting arrays that are not the component's main collection keep their semantic name,
		like {@render ic('actions')}, {@render ic('breadcrumbs')}, or {@render ic('markers')}.
	</p>

	<Code language="svelte" code={collectionCode} />

	<Separator class="my-2" children="Snippets" />

	<p class="text-neutral/60">
		Snippet names describe the public part they fill: {@render ic('prefix')}, {@render ic(
			'suffix'
		)}, {@render ic('trigger')}, {@render ic('title')}, {@render ic('description')}, {@render ic(
			'header'
		)}, {@render ic('footer')}, {@render ic('actions')}. Pass the content; the component owns the
		wrapper and classes for that part.
	</p>

	<Code language="svelte" code={slotCode} />

	<Separator class="my-2" children="Themes" />

	<p class="text-neutral/60">
		Theme keys describe public classable parts. The outermost component part is {@render ic(
			'root'
		)}. Nested parts use stable nouns: {@render ic('trigger')}, {@render ic('content')}, {@render ic(
			'header'
		)}, {@render ic('footer')}, {@render ic('prefix')}, {@render ic('suffix')}.
	</p>

	<Code language="svelte" code={themeCode} />

	<Separator class="my-2" children="Events" />

	<p class="text-neutral/60">
		Change callbacks describe semantic state. Native DOM handlers use lowercase Svelte 5 attributes
		and receive the real event object. Domain actions keep explicit verb names.
	</p>

	<Code language="ts" code={eventCode} />

	<Separator class="my-2" children="Canonical names" />

	<p class="text-neutral/60">Use the exact public spellings from the docs and exports.</p>

	<Code language="txt" code={namesCode} />
</article>
