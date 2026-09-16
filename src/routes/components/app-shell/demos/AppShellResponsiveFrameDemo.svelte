<script lang="ts">
	type FramePreset = {
		label: string;
		width: number;
	};

	let frameWidth = $state(390);
	let dragStartX = 0;
	let dragStartWidth = 0;

	const presets: FramePreset[] = [
		{ label: 'Phone', width: 390 },
		{ label: 'Tablet', width: 760 },
		{ label: 'Desktop', width: 1080 }
	];

	function clampFrameWidth(width: number) {
		return Math.min(1120, Math.max(320, Math.round(width)));
	}

	function setFrameWidth(width: number) {
		frameWidth = clampFrameWidth(width);
	}

	function getResizeHandle(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) {
			throw new Error('Resize handle event target is not an HTMLElement.');
		}
		return event.currentTarget;
	}

	function startResize(event: PointerEvent) {
		const handle = getResizeHandle(event);
		dragStartX = event.clientX;
		dragStartWidth = frameWidth;
		handle.setPointerCapture(event.pointerId);
	}

	function resizeFrame(event: PointerEvent) {
		const handle = getResizeHandle(event);
		if (!handle.hasPointerCapture(event.pointerId)) return;
		setFrameWidth(dragStartWidth + event.clientX - dragStartX);
	}

	function stopResize(event: PointerEvent) {
		const handle = getResizeHandle(event);
		if (!handle.hasPointerCapture(event.pointerId)) return;
		handle.releasePointerCapture(event.pointerId);
	}
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{#each presets as preset, index (index)}
				<button
					type="button"
					class="state-layer border-neutral-muted inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition {Math.abs(
						frameWidth - preset.width
					) < 24
						? 'bg-primary text-primary-contrast'
						: 'bg-surface text-neutral'}"
					aria-pressed={Math.abs(frameWidth - preset.width) < 24}
					onclick={() => setFrameWidth(preset.width)}
				>
					{preset.label}
				</button>
			{/each}
		</div>

		<label class="text-neutral/65 flex min-w-64 items-center gap-3 text-sm">
			<span class="tabular-nums">{frameWidth}px</span>
			<input
				class="accent-primary"
				type="range"
				min="320"
				max="1120"
				value={frameWidth}
				aria-label="Preview width"
				oninput={(event) => setFrameWidth(event.currentTarget.valueAsNumber)}
			/>
		</label>
	</div>

	<div class="border-neutral-muted bg-neutral-muted overflow-auto rounded-xl border p-3">
		<div
			class="border-neutral-muted bg-surface relative mx-auto h-[640px] min-w-[320px] overflow-hidden rounded-lg border shadow-sm"
			style={`width: ${frameWidth}px;`}
		>
			<iframe
				title="Resizable AppShell mobile preview"
				src="/previews/app-shell-mobile"
				class="h-full w-full border-0"
			></iframe>
			<button
				type="button"
				aria-label="Resize preview"
				class="border-neutral-muted/70 bg-surface/40 hover:bg-primary/20 focus-visible:outline-primary absolute inset-y-0 right-0 w-3 cursor-ew-resize border-l transition focus-visible:outline-2"
				onpointerdown={startResize}
				onpointermove={resizeFrame}
				onpointerup={stopResize}
				onpointercancel={stopResize}
			></button>
		</div>
	</div>
</div>
