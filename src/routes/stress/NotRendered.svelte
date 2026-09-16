<script lang="ts">
	import Section from './Section.svelte';

	const skipped = [
		{
			name: 'AIChat / AIConversation / AIThread / AIThreadToc / AIAskUserQuestion / AIMessageActions / AIMarker / AIFilePreview',
			reason:
				'Need a live AIConversationState (streaming transport, message store) to render anything but an empty shell.'
		},
		{
			name: 'Map / Globe',
			reason: 'Load map tiles and globe textures from a CDN at runtime.'
		},
		{
			name: 'Chart / GanttChart',
			reason:
				'Require a runtime dataset plus measured container sizing to draw anything meaningful.'
		},
		{
			name: 'EventCalendar',
			reason:
				'Needs a live event store and a date window; a static snapshot is not representative of its layout.'
		},
		{
			name: 'DocumentViewer / PDFViewer',
			reason: 'Fetch and parse document/PDF binaries at runtime.'
		},
		{
			name: 'Mermaid',
			reason: 'Loads and runs the Mermaid renderer at runtime.'
		},
		{
			name: 'FloatingWindow',
			reason:
				'Portals a draggable window over the whole viewport, which would obscure every other block in a full-page screenshot.'
		},
		{
			name: 'AppShell / PageShell',
			reason:
				'Own the page frame (they are already wrapping this route via the docs layout); nesting a second one is not reviewable.'
		},
		{
			name: 'Theme / Toaster / Ask / Confirmation / NetworkIndicator / Overlay / Slot / Hitbox / Field / SelectionMenu / LinkPreview / Marquee / MiniCalendar / DesignSystem',
			reason:
				'Infrastructure or provider components with no standalone visual surface, or already mounted once by the docs layout.'
		},
		{
			name: 'Dialog open states',
			reason:
				'Only triggers are rendered: an open modal portals a backdrop over the entire page and would hide every block below it in the screenshot.'
		}
	];
</script>

<Section
	id="not-rendered"
	title="Not rendered"
	description="Public components deliberately left out of the matrices, and why."
>
	<ul class="gap-sm grid">
		{#each skipped as entry (entry.name)}
			<li class="gap-2xs border-neutral-muted bg-surface p-sm grid rounded-lg border">
				<p class="text-neutral text-sm font-medium">{entry.name}</p>
				<p class="text-neutral/60 text-xs">{entry.reason}</p>
			</li>
		{/each}
	</ul>
</Section>
