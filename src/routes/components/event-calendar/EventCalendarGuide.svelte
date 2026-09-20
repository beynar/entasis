<script lang="ts">
	const guides = [
		{
			title: 'State, navigation, and loading',
			body: 'items, resources, date, view, dayCount, and selection are controlled values. Treat collections and definitions as immutable: every application update needs a fresh outer array and replacement objects. Header and API navigation reassign the bindable date/view values; narrow layouts never change the requested view. onRangeChange reports the exact half-open fetchRange, while the application owns requests, caching, retry UI, and loading.'
		},
		{
			title: 'Views and display settings',
			body: 'month owns fixed or natural rows, outside days, week numbers, and overflow. timeGrid owns displayed hours, labels, click duration, snap duration, initial scroll, and clock refresh. availability owns off days, business hours, and mutation constraints. allDayConversion owns conversion duration policy. Agenda groups the same occurrences across agendaDayCount. Resource is one day with a shared vertical axis and one column per leaf. Invalid values throw instead of clamping.'
		},
		{
			title: 'Mutations, validation, and dialogs',
			body: 'Drag, keyboard mode, both resize edges, API updates, paste, and history share one immutable mutation boundary. Focus an empty slot and press Space, extend with arrows, then press Enter to create a keyboard range; pointer users can click its two endpoints. Structural/range checks run before resource hours, overlap, and custom policy. resolveItemUpdate may reject or adjust, and adjustments are revalidated. onItemsChange receives one guarded transaction. Mod+C/Mod+V copies a selected occurrence as a standalone item; Mod+Z and Mod+Shift+Z undo and redo up to historyLimit. Empty-slot creation ends at onSelect, whose source identifies drag-create, keyboard, or single-pointer input: compose a Entasis Dialog and Form, then add the validated domain item yourself.'
		},
		{
			title: 'Snippets and theme',
			body: 'header exposes ready-made navigation, title, view, date-picker, and action snippets; false removes it. item customizes event content in every view, including agenda, and receives defaultContent plus markerContent, titleContent, and timeContent. overflowContent can wrap defaultContent without rebuilding the draggable, accessible hidden-item list. itemTooltip customizes the item HoverCard and false removes it. nowIndicator accepts a custom renderer or false. timeGutter, empty, loadingContent, dayHeader, monthCell, allDay, overflow, agendaDetails, resourceHeader, and dragPreview retain their focused contracts. Semantic wrappers, focus, disclosures, drag wiring, and announcements remain calendar-owned. Override theme per instance or use setEventCalendarTheme globally; CSS metric variables tune geometry.'
		},
		{
			title: 'Recurrence and time zones',
			body: 'timeZone is always explicit. Timed recurrence also requires its scheduling recurrenceTimeZone; floating all-day recurrence stays date-only when the display zone changes. Occurrence scope persists an exception whose originalStart keeps the source representation. Series scope transforms the source and every bound exception atomically, so it is valid only when items contains the complete exception set. Windowed loading should keep occurrence or disabled scope unless it can prove completeness.'
		},
		{
			title: 'Resources, RTL, and accessibility',
			body: 'Resources are a typed flat tree: parents group and leaves accept one or many assignments; unresolved items remain visible in Unassigned. Leaves may own businessHours and readOnly policy, while custom fields reach resourceHeader. Multi-assigned events render in every resolved resource projection, and dragging replaces only the grabbed projection. dir mirrors physical horizontal movement while previous/next remain chronological. Grids, buttons, disclosures, keyboard mutation/range creation, live status, reduced motion, reflow, and horizontal overflow are built in.'
		}
	];
</script>

<section aria-labelledby="event-calendar-contract">
	<h2 id="event-calendar-contract" class="text-neutral text-xl font-semibold">
		Integration contract
	</h2>
	<p class="text-neutral/70 mt-2 max-w-4xl text-sm leading-6">
		Timed values are absolute <code>Date</code> instants. All-day values are canonical
		<code>YYYY-MM-DD</code> civil dates with exclusive ends. The supported civil display domain runs
		from <code>0001-01-01</code> through the last renderable day
		<code>9999-12-30</code>; <code>9999-12-31</code> remains available as the maximum exclusive boundary.
		Direct invalid profiles and jumps throw; previous/next beyond the domain are no-ops.
	</p>

	<div class="mt-5 grid gap-4 md:grid-cols-2">
		{#each guides as guide (guide.title)}
			<section class="border-neutral-muted bg-surface rounded-xl border p-4">
				<h3 class="text-neutral font-semibold">{guide.title}</h3>
				<p class="text-neutral/65 mt-2 text-sm leading-6">{guide.body}</p>
			</section>
		{/each}
	</div>
</section>
