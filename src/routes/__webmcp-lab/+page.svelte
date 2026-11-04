<script lang="ts">
	// Verification page for the WebMCP prototype: the root layout turns `webmcp` on for this route.
	import { Breadcrumbs } from '$lib/components/Breadcrumbs/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { Chart } from '$lib/components/Chart/index.js';
	import { Command } from '$lib/components/Command/index.js';
	import { ContextMenu } from '$lib/components/ContextMenu/index.js';
	import { DataTable } from '$lib/components/DataTable/index.js';
	import { DocumentViewer } from '$lib/components/DocumentViewer/index.js';
	import { EventCalendar, type EventCalendarItem } from '$lib/components/EventCalendar/index.js';
	import { MultiStepForm } from '$lib/components/Form/MultiStepForm/index.js';
	import { Kanban } from '$lib/components/Kanban/index.js';
	import { MenuBar } from '$lib/components/MenuBar/index.js';
	import { NavigationMenu } from '$lib/components/NavigationMenu/index.js';
	import { Pagination } from '$lib/components/Pagination/index.js';
	import { PopupMenu } from '$lib/components/PopupMenu/index.js';
	import { Tabs } from '$lib/components/Tabs/index.js';
	import { ask, Form } from '$lib/components/Form/Form/index.js';
	import type { AskResult } from '$lib/components/Form/Form/index.js';

	let submitted = $state<string>('—');
	let askResult = $state<string>('—');
	let failNext = $state(false);
	let clicks = $state(0);
	let allTypes = $state<string>('—');

	const plans = [
		{ value: 'free', label: 'Gratuit' },
		{ value: 'team', label: 'Équipe' },
		{ value: 'corp', label: 'Entreprise', disabled: true }
	];

	let clientRows = $state(['Ada Martin', 'Bob Durand', 'Cleo Petit']);
	let log = $state<string[]>([]);
	const note = (entry: string) => log.push(entry);
	let columns = $state([
		{ id: 'todo', title: 'À faire', cards: [{ id: 'c1', title: 'Rédiger' }] },
		{ id: 'done', title: 'Fait', cards: [] }
	]);
	const rows = [
		{ id: '1', name: 'Ada', role: 'admin', secret: 'ne-pas-lire' },
		{ id: '2', name: 'Bob', role: 'user', secret: 'ne-pas-lire' },
		{ id: '3', name: 'Cleo', role: 'user', secret: 'ne-pas-lire' }
	];
	const tableColumns = [
		{ id: 'name', accessor: 'name' as const, header: 'Nom', sortable: true },
		{
			id: 'role',
			accessor: 'role' as const,
			header: 'Rôle',
			filter: {
				type: 'select' as const,
				options: [
					{ value: 'admin', label: 'Admin' },
					{ value: 'user', label: 'Utilisateur' }
				]
			}
		}
	];
	const pdf = new Blob(
		[
			'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 20 100 Td (Bonjour agent) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n'
		],
		{ type: 'application/pdf' }
	);

	const calendarItems = [
		{
			id: 'e1',
			title: 'Revue',
			start: new Date(2026, 10, 4, 9),
			end: new Date(2026, 10, 4, 10)
		}
	] as unknown as EventCalendarItem[];

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

	<table>
		<tbody>
			{#each clientRows as name (name)}
				<tr>
					<td>{name}</td>
					<td>
						<Button
							color="danger"
							onclick={() => (clientRows = clientRows.filter((c) => c !== name))}
						>
							Supprimer
						</Button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<Form title="Formulaire privé" tool={false} inputs={{ a: { type: 'text', label: 'A' } }} />

	<div class="flex gap-2">
		<Button onclick={openAsk}>Ouvrir ask()</Button>
		<Button variant="outline" onclick={() => (failNext = !failNext)}>failNext: {failNext}</Button>
	</div>

	<div class="flex gap-2">
		<Button onclick={() => (clicks += 1)}>Compter</Button>
		<Button color="danger" onclick={() => (clicks = 0)}>Tout effacer</Button>
		<Button disabled>Inactif</Button>
		<Button tool={false}>Privé</Button>
		<Button href="https://example.com">Externe</Button>
		<Button label="Paramètres" tool={{ description: 'Opens the settings.' }}>⚙</Button>
	</div>
	<pre data-testid="clicks">{clicks}</pre>

	<Tabs
		items={[
			{ value: 'one', label: 'Onglet un' },
			{ value: 'two', label: 'Onglet deux' },
			{ value: 'off', label: 'Inactif', disabled: true }
		]}
		onValueChange={({ value }) => note(`tab:${value}`)}
	>
		{#snippet children({ item })}<p>
				Panneau {typeof item === 'string' ? item : item.value}
			</p>{/snippet}
	</Tabs>

	<Pagination totalPages={4} onValueChange={(page) => note(`page:${page}`)} />

	<Breadcrumbs
		items={[
			{ label: 'Accueil', href: '/' },
			{ label: 'Ailleurs', href: 'https://example.com/' },
			{ label: 'Ici', href: '/__webmcp-lab', active: true }
		]}
	/>

	<NavigationMenu
		items={[
			{ type: 'link', label: 'Couleurs', href: '/colors' },
			{
				type: 'panel',
				value: 'plus',
				label: 'Plus',
				content: [{ label: 'Changelog', href: '/changelog' }]
			}
		]}
	/>

	<Command
		items={[
			{
				heading: 'Fichiers',
				items: [
					{ value: 'new', label: 'Nouveau', onSelect: () => note('command:new') },
					{ value: 'off', label: 'Inactif', disabled: true }
				]
			}
		]}
	/>

	<PopupMenu
		menu={{
			items: [
				{ type: 'option', title: 'Dupliquer', onclick: () => note('menu:dup') },
				{ type: 'option', title: 'Supprimer', color: 'danger', onclick: () => note('menu:del') },
				{
					type: 'submenu',
					title: 'Déplacer',
					menu: [{ type: 'option', title: 'Archive', onclick: () => note('menu:archive') }]
				}
			]
		}}
		trigger={{ content: 'Actions' }}
	/>

	<MenuBar
		menus={[
			{
				label: 'Fichier',
				items: [{ type: 'option', title: 'Ouvrir', onclick: () => note('bar:open') }]
			}
		]}
	/>

	<ContextMenu items={[{ type: 'option', title: 'Renommer', onclick: () => note('ctx:rename') }]}>
		<div class="border p-4">Clic droit</div>
	</ContextMenu>

	<MultiStepForm
		items={[
			{ title: 'Identite', inputs: { first: { type: 'text', label: 'Prénom', required: true } } },
			{ title: 'Ville', inputs: { city: { type: 'text', label: 'Ville', required: true } } }
		]}
		onSubmitForm={(value) => {
			note(`steps:${JSON.stringify(value)}`);
		}}
	/>

	<DataTable
		items={rows}
		columns={tableColumns}
		getRowId={(row) => row.id}
		search
		pagination={{ pageSize: 2 }}
		caption="Personnes"
	/>

	<Chart
		label="Ventes"
		data={[
			{ mois: 'Jan', ventes: 3, marge: 'secret' },
			{ mois: 'Fév', ventes: 5, marge: 'secret' }
		]}
		x={{ scale: { type: 'band' } }}
		y={{ scale: { type: 'linear' } }}
		marks={[{ type: 'bar', x: 'mois', y: 'ventes' }]}
		height={120}
	/>

	<Kanban bind:columns onCardMove={({ to }) => note(`card:${to.columnId}`)} />

	<div class="h-96 overflow-auto">
		<EventCalendar
			items={calendarItems}
			date={new Date(2026, 10, 4)}
			view="week"
			timeZone="Europe/Paris"
		/>
	</div>

	<div class="h-64"><DocumentViewer src={pdf} fileName="note.pdf" /></div>

	<pre data-testid="log">{log.join('\n')}</pre>

	<pre data-testid="submitted">{submitted}</pre>
	<pre data-testid="ask-result">{askResult}</pre>
	<pre data-testid="all-types">{allTypes}</pre>
</main>
