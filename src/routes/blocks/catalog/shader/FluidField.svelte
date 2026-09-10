<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Slider } from 'svelai/slider';
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;
	let secondaryColor: HTMLSpanElement;
	let speed = $state(0.6);
	let detail = $state(3);
	let running = $state(true);
	let reducedMotion = $state(false);
	let failure = $state('');
	let requestDraw = $state<(() => void) | undefined>();
	const vertexSource = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
	const fragmentSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_detail;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_surface;
void main() {
 vec2 p = (gl_FragCoord.xy*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
 float t = u_time*0.35;
 for (int i=1;i<5;i++) {
  float f = float(i);
  p += vec2(sin(p.y*f*0.8+t+f),cos(p.x*f*0.7-t-f))*0.18;
 }
 float flow = sin(p.x*u_detail+p.y*1.4+t)+cos(p.y*u_detail*0.7-p.x+t*0.6);
 float ribbon = 0.5+0.5*sin(flow*2.2+t);
 vec3 pigment = mix(u_primary,u_secondary,0.5+0.5*sin(flow+t));
 vec3 color = mix(u_surface,pigment,0.18+0.67*ribbon);
 float grain = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
 gl_FragColor = vec4(color+(grain-0.5)*0.025,1.0);
}
`;

	// Repaint a paused frame when a control changes.
	$effect(() => {
		void speed;
		void detail;
		void running;
		requestDraw?.();
	});

	onMount(() => {
		const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
		if (!gl) {
			failure = 'This browser cannot display the WebGL preview.';
			return;
		}
		let program: WebGLProgram | null = null;
		let buffer: WebGLBuffer | null = null;
		const shaders: WebGLShader[] = [];
		let frame = 0;
		let elapsed = 0;
		let previous = 0;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = motion.matches;
		let resizeObserver: ResizeObserver | undefined;
		let themeObserver: MutationObserver | undefined;

		function cleanup() {
			window.cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			themeObserver?.disconnect();
			motion.removeEventListener('change', updateMotion);
			document.removeEventListener('visibilitychange', updateVisibility);
			if (buffer) gl?.deleteBuffer(buffer);
			if (program) gl?.deleteProgram(program);
			for (const shader of shaders) gl?.deleteShader(shader);
			requestDraw = undefined;
		}
		function updateMotion() {
			reducedMotion = motion.matches;
			requestDraw?.();
		}
		function updateVisibility() {
			if (!document.hidden) requestDraw?.();
		}

		try {
			function compileShader(type: number, source: string) {
				if (!gl) throw new Error('The rendering context is unavailable.');
				const shader = gl.createShader(type);
				if (!shader) throw new Error('The shader could not be allocated.');
				shaders.push(shader);
				gl.shaderSource(shader, source);
				gl.compileShader(shader);
				if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
					throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed.');
				return shader;
			}
			program = gl.createProgram();
			if (!program) throw new Error('The shader program could not be allocated.');
			gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
			gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS))
				throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed.');
			gl.useProgram(program);
			buffer = gl.createBuffer();
			if (!buffer) throw new Error('The preview buffer could not be allocated.');
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
				gl.STATIC_DRAW
			);
			const position = gl.getAttribLocation(program, 'a_position');
			gl.enableVertexAttribArray(position);
			gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
			const resolution = gl.getUniformLocation(program, 'u_resolution');
			const time = gl.getUniformLocation(program, 'u_time');
			const density = gl.getUniformLocation(program, 'u_detail');
			const primary = gl.getUniformLocation(program, 'u_primary');
			const secondary = gl.getUniformLocation(program, 'u_secondary');
			const surface = gl.getUniformLocation(program, 'u_surface');
			const probe = document.createElement('canvas');
			probe.width = 1;
			probe.height = 1;
			const colorContext = probe.getContext('2d', { willReadFrequently: true });
			if (!colorContext) throw new Error('Theme colors could not be resolved.');
			function readColor(color: string) {
				if (!colorContext) throw new Error('Theme color conversion is unavailable.');
				colorContext.clearRect(0, 0, 1, 1);
				colorContext.fillStyle = color;
				colorContext.fillRect(0, 0, 1, 1);
				const channels = colorContext.getImageData(0, 0, 1, 1).data;
				return new Float32Array([channels[0] / 255, channels[1] / 255, channels[2] / 255]);
			}
			function readPalette() {
				if (!gl) return;
				const style = getComputedStyle(canvas);
				gl.uniform3fv(primary, readColor(style.color));
				gl.uniform3fv(secondary, readColor(getComputedStyle(secondaryColor).color));
				gl.uniform3fv(surface, readColor(style.backgroundColor));
			}
			function draw(timestamp: number) {
				if (!gl) return;
				const delta = previous ? Math.min((timestamp - previous) / 1000, 0.05) : 0;
				previous = timestamp;
				if (running && !motion.matches) elapsed += delta * speed;
				gl.viewport(0, 0, canvas.width, canvas.height);
				gl.uniform2f(resolution, canvas.width, canvas.height);
				gl.uniform1f(time, elapsed);
				gl.uniform1f(density, detail);
				gl.drawArrays(gl.TRIANGLES, 0, 6);
				frame =
					running && !motion.matches && !document.hidden ? window.requestAnimationFrame(draw) : 0;
			}
			requestDraw = () => {
				window.cancelAnimationFrame(frame);
				previous = 0;
				frame = window.requestAnimationFrame(draw);
			};
			resizeObserver = new ResizeObserver(() => {
				const bounds = canvas.getBoundingClientRect();
				const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
				canvas.width = Math.max(1, Math.round(bounds.width * ratio));
				canvas.height = Math.max(1, Math.round(bounds.height * ratio));
				requestDraw?.();
			});
			resizeObserver.observe(canvas);
			themeObserver = new MutationObserver(() => {
				readPalette();
				requestDraw?.();
			});
			for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement)
				themeObserver.observe(ancestor, {
					attributes: true,
					attributeFilter: ['class', 'style', 'data-theme']
				});
			readPalette();
			motion.addEventListener('change', updateMotion);
			document.addEventListener('visibilitychange', updateVisibility);
			requestDraw();
		} catch (error) {
			failure = error instanceof Error ? error.message : String(error);
			cleanup();
		}
		return cleanup;
	});
</script>

<section class="flex flex-col gap-lg p-lg md:p-xl">
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<Chip variant="outline">Motion study · 01</Chip><Heading
				as="h2"
				size="h2"
				weight="bold"
				class="mt-lg">A little room for the unexpected.</Heading
			>
		</div>
		<Button
			variant="outline"
			disabled={reducedMotion || !!failure}
			onclick={() => (running = !running)}>{running ? 'Pause motion' : 'Resume motion'}</Button
		>
	</div>
	<div class="relative overflow-hidden rounded-2xl border border-neutral-muted">
		<canvas
			bind:this={canvas}
			class="block h-80 w-full bg-surface text-primary md:h-96"
			aria-label="Animated flowing field using the current theme colors"
		></canvas><span bind:this={secondaryColor} class="hidden text-secondary" aria-hidden="true"
		></span>
	</div>
	<Card variant="outline"
		><div class="grid gap-xl md:grid-cols-3">
			<Slider
				label="Flow speed"
				value={speed}
				min={0.1}
				max={1.5}
				step={0.1}
				showValue
				onValueChange={(value) => {
					if (typeof value === 'number') speed = value;
				}}
			/><Slider
				label="Ribbon detail"
				value={detail}
				min={1}
				max={6}
				step={0.5}
				showValue
				onValueChange={(value) => {
					if (typeof value === 'number') detail = value;
				}}
			/>
			<p class="self-center text-sm text-neutral/60" role="status">
				{failure ||
					(reducedMotion
						? 'Motion is paused by your system preference.'
						: 'Colors follow the active theme. Pause to find a composition you like.')}
			</p>
		</div></Card
	>
</section>
