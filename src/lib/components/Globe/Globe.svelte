<script lang="ts">
	import createGlobe from 'cobe';
	import { Spring } from 'svelte/motion';
	import { untrack } from 'svelte';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import type { GlobeColor, GlobeProps } from './globe.props.js';
	import { useGlobeTheme } from './globe.theme.js';

	let {
		baseColor = [0.85, 0.87, 0.95],
		markerColor = 'primary',
		glowColor = [0.18, 0.2, 0.28],
		autoRotate = 0.3,
		dark = 1,
		markers = [
			{ location: [37.78, -122.412], size: 0.05 },
			{ location: [52.52, 13.405], size: 0.05 },
			{ location: [35.676, 139.65], size: 0.05 },
			{ location: [-34.6, -58.38], size: 0.05 }
		],
		offset,
		scale = 1,
		diffuse = 1.2,
		mapSamples = 16000,
		mapBrightness = 6,
		mapBaseBrightness = 0,
		opacity = 1,
		devicePixelRatio,
		phi: phiProp = 0,
		theta: thetaProp = 0,
		draggable = true,
		dragAxis = 'xy',
		dragSpeed = 2,
		dragStiffness = 0.1,
		dragDamping = 1,
		scrollTo = $bindable(),
		onReady,
		class: className,
		theme,
		...attachments
	}: GlobeProps = $props();

	const themeState = useTheme();
	const classes = $derived(useGlobeTheme(theme));

	let ready = $state(false);

	// Drag momentum. Reading `.current` each frame in the render loop drives rotation.
	const dragX = new Spring(0, { stiffness: dragStiffness, damping: dragDamping, precision: 0.1 });
	const dragY = new Spring(0, { stiffness: dragStiffness, damping: dragDamping, precision: 0.1 });

	// Shared rotation state — mutated by the render loop, drag, and scrollTo.
	let phi = phiProp;
	let currentTheta = thetaProp;
	let pointerId: number | null = null;
	// Target [phi, theta] when scrollTo pins the globe to a coordinate; cleared on drag.
	let pinned: [number, number] | null = null;

	// Resolve a theme token (or passthrough an RGB triple) to normalized RGB [0–1]. A 1×1 canvas
	// converts whatever CSS color the token resolves to (incl. oklab) into sRGB bytes.
	const toRgb01 = (css: string): [number, number, number] => {
		const c = document.createElement('canvas');
		c.width = c.height = 1;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = css;
		ctx.fillRect(0, 0, 1, 1);
		const d = ctx.getImageData(0, 0, 1, 1).data;
		return [d[0] / 255, d[1] / 255, d[2] / 255];
	};
	const resolveColor = (color: GlobeColor): [number, number, number] => {
		if (Array.isArray(color)) return color;
		const el = document.createElement('div');
		el.style.cssText = `position:absolute;pointer-events:none;background-color:var(--color-${color})`;
		document.body.appendChild(el);
		const resolved = getComputedStyle(el).backgroundColor;
		el.remove();
		return toRgb01(resolved || color);
	};

	const resolveOffset = (value: GlobeProps['offset'], size: number): [number, number] => {
		if (!value) return [0, 0];
		return value.map((v) =>
			typeof v === 'string' && v.includes('%')
				? ((Number(v.replace('%', '')) * 2) / 100) * size
				: Number(v)
		) as [number, number];
	};

	// Rotate the globe so a lat/lng faces the viewer. Pins until the next drag.
	const scrollToCoordinate = (latitude: number, longitude: number) => {
		pinned = [Math.PI - ((longitude * Math.PI) / 180 - Math.PI / 2), (latitude * Math.PI) / 180];
	};
	// Publish the imperative handle on the write-only bindable prop; the identity guard
	// keeps it from republishing an identical function to the parent binding.
	const publishScrollTo = () => {
		if (scrollTo !== scrollToCoordinate) scrollTo = scrollToCoordinate;
	};
	publishScrollTo();

	const globe = (canvas: HTMLCanvasElement) => {
		return untrack(() => {
			const rect = canvas.getBoundingClientRect();
			const dpr = devicePixelRatio ?? (globalThis.devicePixelRatio || 1);
			const size = Math.max(rect.width, rect.height) * dpr;

			const computeDark = () => (dark >= 0 ? dark : themeState.resolvedTheme === 'dark' ? 1 : 0);

			// Caches so we only re-resolve colors when the token or theme actually changes.
			let cachedBase = baseColor;
			let cachedMarker = markerColor;
			let cachedGlow = glowColor;
			let cachedDark = computeDark();
			let cachedTheme = themeState.resolvedTheme;

			const instance = createGlobe(canvas, {
				width: size,
				height: size,
				phi: phiProp,
				theta: thetaProp,
				dark: cachedDark,
				diffuse,
				scale,
				mapSamples,
				mapBrightness,
				mapBaseBrightness,
				opacity,
				markers,
				offset: resolveOffset(offset, size),
				devicePixelRatio: dpr,
				baseColor: resolveColor(cachedBase),
				markerColor: resolveColor(cachedMarker),
				glowColor: resolveColor(cachedGlow)
			});

			// createGlobe drew the initial frame — reveal it now (fade in) rather than waiting on the
			// rAF loop, which is paused in hidden/background tabs. setTimeout fires there; rAF doesn't.
			setTimeout(() => {
				ready = true;
				onReady?.();
			}, 0);

			const doublePi = Math.PI * 2;
			let raf = requestAnimationFrame(function render() {
				const update: Record<string, unknown> = {};
				const themeChanged = themeState.resolvedTheme !== cachedTheme;

				// Re-resolve colors on prop or theme change (theme changes their token values).
				if (baseColor !== cachedBase || themeChanged) {
					cachedBase = baseColor;
					update.baseColor = resolveColor(baseColor);
				}
				if (markerColor !== cachedMarker || themeChanged) {
					cachedMarker = markerColor;
					update.markerColor = resolveColor(markerColor);
				}
				if (glowColor !== cachedGlow || themeChanged) {
					cachedGlow = glowColor;
					update.glowColor = resolveColor(glowColor);
				}
				const darkNow = computeDark();
				if (darkNow !== cachedDark || themeChanged) {
					cachedDark = darkNow;
					update.dark = darkNow;
				}
				cachedTheme = themeState.resolvedTheme;

				// Rotation: ease toward a pinned coordinate, else auto-rotate while not dragging.
				if (pinned) {
					const [targetPhi, targetTheta] = pinned;
					const distPos = (targetPhi - phi + doublePi) % doublePi;
					const distNeg = (phi - targetPhi + doublePi) % doublePi;
					phi += distPos < distNeg ? distPos * 0.08 : -distNeg * 0.08;
					currentTheta = currentTheta * 0.92 + targetTheta * 0.08;
				} else if (pointerId === null) {
					phi += autoRotate / 100;
				}

				update.phi = phi + dragX.current / (100 / dragSpeed);
				update.theta = currentTheta + dragY.current / (100 / dragSpeed);

				instance.update(update);
				raf = requestAnimationFrame(render);
			});

			return () => {
				cancelAnimationFrame(raf);
				instance.destroy();
			};
		});
	};

	const drag = (node: HTMLElement) => {
		if (!draggable) {
			node.style.removeProperty('cursor');
			return;
		}

		let originX: number | null = null;
		let originY: number | null = null;

		const onDown = (e: PointerEvent) => {
			pinned = null;
			pointerId = e.pointerId;
			originX = e.clientX - dragX.current;
			originY = e.clientY - dragY.current;
			node.style.cursor = 'grabbing';
		};
		const onUp = () => {
			originX = originY = null;
			pointerId = null;
			node.style.removeProperty('cursor');
		};
		const onMove = (e: PointerEvent) => {
			if (originX !== null && dragAxis.includes('x')) {
				dragX.target = e.clientX - originX;
			}
			if (originY !== null && dragAxis.includes('y')) {
				dragY.target = e.clientY - originY;
			}
		};

		node.addEventListener('pointerdown', onDown);
		node.addEventListener('pointerup', onUp);
		node.addEventListener('pointerleave', onUp);
		node.addEventListener('pointermove', onMove);

		return () => {
			onUp();
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointerleave', onUp);
			node.removeEventListener('pointermove', onMove);
		};
	};
</script>

<canvas
	class={classes.root({ draggable, ready, className })}
	{@attach globe}
	{@attach drag}
	{...attachments}
></canvas>
