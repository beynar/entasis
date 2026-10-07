<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { Button } from 'entasis/button';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Select } from 'entasis/select';
	import { TextInput } from 'entasis/text-input';
	import { arrowClockwiseIcon } from 'entasis/icons/arrowClockwise';
	import { arrowCounterClockwiseIcon } from 'entasis/icons/arrowCounterClockwise';
	import { arrowLeftIcon } from 'entasis/icons/arrowLeft';
	import { arrowSquareOutIcon } from 'entasis/icons/arrowSquareOut';
	import { cornersOutIcon } from 'entasis/icons/cornersOut';
	import { desktopIcon } from 'entasis/icons/desktop';
	import { deviceMobileIcon } from 'entasis/icons/deviceMobile';
	import { linkIcon } from 'entasis/icons/link';
	import { magnifyingGlassMinusIcon } from 'entasis/icons/magnifyingGlassMinus';
	import { magnifyingGlassPlusIcon } from 'entasis/icons/magnifyingGlassPlus';
	import { shuffleIcon } from 'entasis/icons/shuffle';
	import { useClipboard } from '$lib/utils/useClipboard.svelte.js';
	import { useRuntimeThemePlayground } from '../../../runtimeThemePlayground.svelte.js';
	import { directions, findDirection } from '../engine/directions.js';
	import { formatCount } from '../engine/composition.js';
	import { decodeSpec, encodeSpec } from '../engine/spec.js';
	import { lookupSection } from '../registry.js';
	import { recipes } from '../recipes.js';
	import { paramsFromUrl } from '../ui/paramsUrl.js';
	import Canvas from './Canvas.svelte';
	import { Composer } from './composer.svelte.js';
	import Inspector from './Inspector.svelte';
	import Layers from './Layers.svelte';
	import Library from './Library.svelte';

	const composer = new Composer();
	const playground = useRuntimeThemePlayground();
	const clipboard = useClipboard();
	const artboards = { desktop: 1280, mobile: 390 } as const;
	const MIN_ZOOM = 0.1;
	const MAX_ZOOM = 1.5;

	let artboard = $state<keyof typeof artboards>('desktop');
	let zoom = $state(0.5);
	let scroller = $state<HTMLElement | null>(null);
	let leftTab = $state<'library' | 'outline'>('library');
	let applyTheme = $state(true);
	// Follows the page seed, and holds what the person types until they commit it.
	let seedDraft = $derived(composer.spec.seed);
	let notice = $state('');

	const previewHref = $derived(`/previews/generative?spec=${encodeSpec(composer.spec)}`);

	function setZoom(next: number, anchor?: { x: number; y: number }) {
		const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
		if (!scroller || !anchor) {
			zoom = clamped;
			return;
		}
		const element = scroller;
		const rect = element.getBoundingClientRect();
		const offsetX = anchor.x - rect.left;
		const offsetY = anchor.y - rect.top;
		const pointX = element.scrollLeft + offsetX;
		const pointY = element.scrollTop + offsetY;
		const ratio = clamped / zoom;
		zoom = clamped;
		tick().then(() => {
			element.scrollLeft = pointX * ratio - offsetX;
			element.scrollTop = pointY * ratio - offsetY;
		});
	}

	function fit() {
		if (!scroller) return;
		const padding = 2 * 48;
		zoom = Math.min(1, Math.max(MIN_ZOOM, (scroller.clientWidth - padding) / artboards[artboard]));
	}

	function setArtboard(next: keyof typeof artboards) {
		artboard = next;
		tick().then(fit);
	}

	function changeDirection(id: string) {
		composer.setDirection(id);
		if (applyTheme) {
			const next = findDirection(id);
			playground.applyPreset(next.preset);
			playground.palette = next.palette;
		}
	}

	function focusSection(id: string) {
		tick().then(() =>
			scroller
				?.querySelector(`[data-slot-id="${id}"]`)
				?.scrollIntoView({ block: 'start', behavior: 'smooth' })
		);
	}

	async function share() {
		const url = new URL(resolve('/blocks/generative/compose'), location.origin);
		url.searchParams.set('spec', encodeSpec(composer.spec));
		const copied = await clipboard.copy(url.toString());
		notice = copied ? 'Link copied.' : 'Copy was blocked by the browser.';
	}

	function isEditable(target: EventTarget | null) {
		return (
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		);
	}

	function keydown(event: KeyboardEvent) {
		if (isEditable(event.target)) return;
		const mod = event.metaKey || event.ctrlKey;
		if (mod && event.key.toLowerCase() === 'z') {
			event.preventDefault();
			if (event.shiftKey) composer.redo();
			else composer.undo();
			return;
		}
		if (mod || event.altKey) return;
		const selected = composer.selected;
		switch (event.key) {
			case 'r':
				if (selected) composer.reroll(selected.id);
				else composer.randomize();
				break;
			case 'l':
				if (selected) composer.toggleLock(selected.id);
				break;
			case 'd':
				if (selected) composer.duplicate(selected.id);
				break;
			case 'Delete':
			case 'Backspace':
				if (selected) composer.remove(selected.id);
				break;
			case 'Escape':
				composer.selectedId = null;
				break;
			case '+':
			case '=':
				setZoom(zoom * 1.2);
				break;
			case '-':
				setZoom(zoom / 1.2);
				break;
			case '0':
				fit();
				break;
			default:
				return;
		}
		event.preventDefault();
	}

	onMount(() => {
		const url = page.url;
		const shared = decodeSpec(url.searchParams.get('spec'));
		const addId = url.searchParams.get('add');
		if (shared) {
			const errors = composer.load(shared);
			notice = errors.length
				? `The shared page was rejected: ${errors[0]}`
				: 'Loaded the shared page.';
		} else {
			composer.restore();
		}
		const added = addId ? lookupSection(addId) : undefined;
		if (added) {
			composer.insert(
				added.id,
				composer.spec.sections.length,
				paramsFromUrl(added, url) ?? undefined
			);
			leftTab = 'outline';
			focusSection(composer.selected?.id ?? '');
		}
		if (shared || addId) replaceState(resolve('/blocks/generative/compose'), page.state);
		fit();
	});
</script>

<svelte:window onkeydown={keydown} />

<svelte:head>
	<title>Page composer · Generative blocks · entasis</title>
	<meta
		name="description"
		content="Compose a page from generative sections on a zoomed-out canvas: drag sections in, randomize within the rules, lock what you like."
	/>
</svelte:head>

<div class="composer gap-md flex min-h-0 flex-col">
	<header class="gap-md flex flex-wrap items-center justify-between">
		<div class="gap-sm flex min-w-0 items-center">
			<Button
				href={resolve('/blocks/generative')}
				variant="ghost"
				size="small"
				squared
				prefix={arrowLeftIcon}
				label="Back to generative blocks"
			/>
			<h1 class="text-neutral text-lg font-semibold tracking-tight">Page composer</h1>
			<span class="text-neutral/60 hidden text-xs tabular-nums sm:inline"
				>{composer.count.exact ? '' : '≈ '}{formatCount(composer.count.value)} pages</span
			>
		</div>
		<div class="gap-sm flex flex-wrap items-center">
			<Select
				size="small"
				triggerAttrs={{ 'aria-label': 'Page outline' }}
				placeholder="Outline…"
				class="w-40"
				items={recipes.map((recipe) => ({ value: recipe.id, label: recipe.label }))}
				onValueChange={(id) => {
					const recipe = recipes.find((entry) => entry.id === id);
					if (recipe) composer.useRecipe(recipe);
				}}
			/>
			<Select
				size="small"
				triggerAttrs={{ 'aria-label': 'Art direction' }}
				class="w-44"
				items={directions.map((direction) => ({ value: direction.id, label: direction.label }))}
				value={composer.direction.id}
				onValueChange={(id) => typeof id === 'string' && changeDirection(id)}
			/>
			<form
				class="gap-xs flex items-center"
				onsubmit={(event) => {
					event.preventDefault();
					composer.setSeed(seedDraft);
				}}
			>
				<TextInput
					size="small"
					class="w-36"
					bind:value={seedDraft}
					inputAttrs={{ 'aria-label': 'Seed', onblur: () => composer.setSeed(seedDraft) }}
				/>
				<Button size="small" prefix={shuffleIcon} onclick={() => composer.randomize()}
					>Randomize</Button
				>
			</form>
			<span class="border-neutral-muted h-6 border-l" aria-hidden="true"></span>
			<Button
				size="small"
				variant="ghost"
				squared
				prefix={arrowCounterClockwiseIcon}
				label="Undo"
				disabled={!composer.canUndo}
				onclick={() => composer.undo()}
			/>
			<Button
				size="small"
				variant="ghost"
				squared
				prefix={arrowClockwiseIcon}
				label="Redo"
				disabled={!composer.canRedo}
				onclick={() => composer.redo()}
			/>
			<SegmentedControl
				size="small"
				label="Artboard width"
				items={[
					{ value: 'desktop', icon: desktopIcon, label: 'Desktop' },
					{ value: 'mobile', icon: deviceMobileIcon, label: 'Mobile' }
				] as const}
				value={artboard}
				onValueChange={setArtboard}
			/>
			<Button
				size="small"
				variant="ghost"
				squared
				prefix={linkIcon}
				label="Copy a link to this page"
				onclick={share}
			/>
			<Button
				size="small"
				variant="outline"
				color="neutral"
				href={previewHref}
				target="_blank"
				suffix={arrowSquareOutIcon}>Preview</Button
			>
		</div>
	</header>
	{#if notice}
		<p class="text-neutral/70 text-xs" role="status">{notice}</p>
	{/if}

	<div class="workspace gap-md grid min-h-0 flex-1">
		<aside
			class="border-neutral-muted bg-surface-canvas flex min-h-0 flex-col overflow-hidden rounded-lg border"
			aria-label="Sections"
		>
			<div class="border-neutral-muted p-sm border-b">
				<SegmentedControl
					size="small"
					class="w-full"
					label="Left panel"
					items={[
						{ value: 'library', label: 'Library' },
						{ value: 'outline', label: `Outline · ${composer.spec.sections.length}` }
					] as const}
					bind:value={leftTab}
				/>
			</div>
			<div class="p-sm min-h-0 flex-1 overflow-y-auto">
				{#if leftTab === 'library'}
					<Library
						direction={composer.direction}
						onAdd={(typeId) => {
							const index =
								composer.selectedIndex >= 0
									? composer.selectedIndex + 1
									: composer.spec.sections.length;
							composer.insert(typeId, index);
							focusSection(composer.selectedId ?? '');
						}}
					/>
				{:else}
					<Layers {composer} onFocusSection={focusSection} />
				{/if}
			</div>
		</aside>

		<div class="border-neutral-muted relative min-h-0 overflow-hidden rounded-lg border">
			<Canvas {composer} width={artboards[artboard]} {zoom} onZoomChange={setZoom} bind:scroller />
			<div
				class="bg-surface-floating border-neutral-muted raised-md gap-micro p-micro m-md absolute right-0 bottom-0 flex items-center rounded-md border"
				role="group"
				aria-label="Zoom"
			>
				<Button
					size="small"
					variant="ghost"
					squared
					prefix={magnifyingGlassMinusIcon}
					label="Zoom out"
					onclick={() => setZoom(zoom / 1.2)}
				/>
				<span class="text-neutral/70 w-10 text-center text-xs tabular-nums"
					>{Math.round(zoom * 100)}%</span
				>
				<Button
					size="small"
					variant="ghost"
					squared
					prefix={magnifyingGlassPlusIcon}
					label="Zoom in"
					onclick={() => setZoom(zoom * 1.2)}
				/>
				<Button
					size="small"
					variant="ghost"
					squared
					prefix={cornersOutIcon}
					label="Fit the page to the canvas"
					onclick={fit}
				/>
			</div>
		</div>

		<aside
			class="border-neutral-muted bg-surface-canvas p-lg min-h-0 overflow-y-auto rounded-lg border"
			aria-label="Inspector"
		>
			<Inspector
				{composer}
				{applyTheme}
				onApplyThemeChange={(value) => (applyTheme = value)}
				onFocusSection={focusSection}
			/>
		</aside>
	</div>
	<p class="text-neutral/65 text-xs">
		<kbd>R</kbd> reroll (selection or page) · <kbd>L</kbd> lock · <kbd>D</kbd> duplicate ·
		<kbd>⌫</kbd> remove · <kbd>⌘Z</kbd> undo · <kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> zoom · ⌘ + scroll
		to zoom at the pointer
	</p>
</div>

<style>
	.composer {
		height: calc(100dvh - 9.5rem);
		min-height: 36rem;
	}
	.workspace {
		grid-template-columns: 15rem minmax(0, 1fr) 20rem;
	}
	kbd {
		font-family: inherit;
		font-weight: 600;
	}
</style>
