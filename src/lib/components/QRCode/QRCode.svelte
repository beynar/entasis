<script lang="ts">
	import type { DownloadOptions, GradientSettings, QRCodeProps } from './qrCode.props.js';
	import { useQRCodeTheme } from './qrCode.theme.js';
	import {
		DEFAULT_FILENAME,
		DEFAULT_LEVEL,
		DEFAULT_MINVERSION,
		QR_PIXEL_SIZES,
		calculateGradientVectors,
		downloadRaster,
		downloadSVG,
		encodeQRCode,
		excavateModules,
		getDataModulesPath,
		getFinderPatternsInner,
		getFinderPatternsOuter,
		getImageSettings,
		getMarginSize,
		sanitizeDataModulesSettings,
		sanitizeFinderPatternInnerSettings,
		sanitizeFinderPatternOuterSettings
	} from './qrCode.utils.js';

	let {
		ref = $bindable(null),
		value,
		size = 'normal',
		color = 'neutral',
		level = DEFAULT_LEVEL,
		minVersion = DEFAULT_MINVERSION,
		boostLevel,
		marginSize,
		background,
		gradient,
		dataModulesSettings,
		finderPatternOuterSettings,
		finderPatternInnerSettings,
		imageSettings,
		ariaLabel = 'QR Code',
		class: className,
		theme,
		...attachments
	}: QRCodeProps = $props();

	const id = $props.id();
	const gradientId = `qr-code-gradient-${id}`;
	const bgGradientId = `qr-code-bg-gradient-${id}`;

	const classes = $derived(useQRCodeTheme(theme));

	const qrcode = $derived(encodeQRCode(value, level, minVersion, boostLevel));
	const cells = $derived(qrcode.getModules());
	const margin = $derived(getMarginSize(marginSize));
	const numCells = $derived(cells.length + margin * 2);
	const calculatedImageSettings = $derived(
		getImageSettings(cells, QR_PIXEL_SIZES[size], margin, imageSettings)
	);
	const modules = $derived(
		calculatedImageSettings?.excavation
			? excavateModules(cells, calculatedImageSettings.excavation)
			: cells
	);

	const dataModules = $derived(sanitizeDataModulesSettings(dataModulesSettings));
	const finderOuter = $derived(sanitizeFinderPatternOuterSettings(finderPatternOuterSettings));
	const finderInner = $derived(sanitizeFinderPatternInnerSettings(finderPatternInnerSettings));

	const outerShapes = $derived(getFinderPatternsOuter(modules, margin, finderOuter.style));
	const innerShapes = $derived(getFinderPatternsInner(modules, margin, finderInner.style));
	const dataModulesPath = $derived(getDataModulesPath(modules, margin, dataModules));

	const paint = (settingsColor: string) => (gradient ? `url(#${gradientId})` : settingsColor);

	const rotationStyle = (rotation?: number) =>
		rotation === undefined
			? undefined
			: `transform: rotate(${rotation}deg); transform-origin: center; transform-box: fill-box;`;

	/** Downloads the QR code as an svg, png or jpeg file. */
	export const download = ({
		name = DEFAULT_FILENAME,
		format = 'svg',
		dimension: fileSize = 500
	}: DownloadOptions = {}) => {
		if (!ref) return;

		if (format === 'svg') {
			downloadSVG({ svg: ref, fileSize, fileName: name });
		} else {
			downloadRaster({
				svg: ref,
				fileSize,
				fileName: name,
				fileFormat: format,
				imageSettings,
				calculatedImageSettings,
				size: QR_PIXEL_SIZES[size],
				numCells,
				margin
			});
		}
	};
</script>

{#snippet gradientDefs(settings: GradientSettings, defsId: string)}
	<defs>
		{#if settings.type === 'linear'}
			<linearGradient
				id={defsId}
				gradientUnits="userSpaceOnUse"
				{...calculateGradientVectors(settings.rotation || 0)}
			>
				{#each settings.stops as stop, stopIndex (stopIndex)}
					<stop offset={stop.offset} stop-color={stop.color} />
				{/each}
			</linearGradient>
		{:else}
			<radialGradient id={defsId} gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="50%">
				{#each settings.stops as stop, stopIndex (stopIndex)}
					<stop offset={stop.offset} stop-color={stop.color} />
				{/each}
			</radialGradient>
		{/if}
	</defs>
{/snippet}

<svg
	bind:this={ref}
	viewBox="0 0 {numCells} {numCells}"
	role="img"
	aria-label={ariaLabel}
	class={classes.root({ size, color, className })}
	{...attachments}
>
	{#if gradient}
		{@render gradientDefs(gradient, gradientId)}
	{/if}
	{#if background}
		{#if typeof background === 'string'}
			<path fill={background} d="M0,0 h{numCells}v{numCells}H0z" />
		{:else}
			{@render gradientDefs(background, bgGradientId)}
			<path fill="url(#{bgGradientId})" d="M0,0 h{numCells}v{numCells}H0z" />
		{/if}
	{/if}
	{#each outerShapes as shape, index (index)}
		{#if shape.kind === 'path'}
			<path fill={paint(finderOuter.color)} d={shape.d} style={rotationStyle(shape.rotation)} />
		{/if}
	{/each}
	{#each innerShapes as shape, index (index)}
		{#if shape.kind === 'rect'}
			<rect
				x={shape.x}
				y={shape.y}
				width={shape.size}
				height={shape.size}
				rx={shape.rx}
				fill={paint(finderInner.color)}
				style={rotationStyle(shape.rotation)}
			/>
		{:else}
			<path fill={paint(finderInner.color)} d={shape.d} style={rotationStyle(shape.rotation)} />
		{/if}
	{/each}
	<path
		fill={paint(dataModules.color)}
		d={dataModulesPath}
		shape-rendering={dataModules.style === 'square' ? 'crispEdges' : 'geometricPrecision'}
	/>
	{#if imageSettings && calculatedImageSettings}
		<image
			href={imageSettings.src}
			height={calculatedImageSettings.h}
			width={calculatedImageSettings.w}
			x={calculatedImageSettings.x + margin}
			y={calculatedImageSettings.y + margin}
			preserveAspectRatio="none"
			opacity={calculatedImageSettings.opacity}
			crossorigin={calculatedImageSettings.crossOrigin}
		/>
	{/if}
</svg>
