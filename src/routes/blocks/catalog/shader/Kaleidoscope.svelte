<script lang="ts">
	import { Stack } from 'svelai/stack';
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
 float radius = length(p);
 float angle = atan(p.y,p.x)+u_time*0.12;
 float folds = floor(u_detail)+3.0;
 float sector = 6.2831853/folds;
 angle = abs(mod(angle+sector*0.5,sector)-sector*0.5);
 vec2 folded = vec2(cos(angle),sin(angle))*radius;
 float petals = sin(folded.x*7.0-u_time*0.7)*cos(folded.y*9.0+u_time*0.4);
 float rings = sin(radius*12.0-petals*3.0+u_time);
 float glow = pow(0.5+0.5*rings,3.0);
 vec3 pigment = mix(u_primary,u_secondary,0.5+0.5*sin(radius*4.0+angle*folds));
 vec3 color = mix(u_surface,pigment,0.12+0.8*glow);
 gl_FragColor = vec4(color,1.0);
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

<section class="gap-xl p-lg md:p-xl grid md:grid-cols-3">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">Motion study · 02</Chip><Heading as="h2" size="h2" weight="bold"
			>Patterns, with a point of view.</Heading
		>
		<p class="text-neutral/70">
			An evolving kaleidoscope built from a simple idea: fold the space, then let it move.
		</p>
		<Card class="w-full" variant="outline"
			><Stack gap="lg"
				><Slider
					label="Rotation speed"
					value={speed}
					min={0.1}
					max={1.5}
					step={0.1}
					showValue
					onValueChange={(value) => {
						if (typeof value === 'number') speed = value;
					}}
				/><Slider
					label="Symmetry"
					value={detail}
					min={1}
					max={9}
					step={1}
					showValue
					onValueChange={(value) => {
						if (typeof value === 'number') detail = value;
					}}
				/><Button
					variant="outline"
					disabled={reducedMotion || !!failure}
					onclick={() => (running = !running)}
					>{running ? 'Freeze the pattern' : 'Let it move'}</Button
				></Stack
			></Card
		>
		<p class="text-neutral/65 text-xs" role="status">
			{failure ||
				(reducedMotion
					? 'A still composition follows your motion preference.'
					: 'Rendered live, with colors from the active theme.')}
		</p>
	</div>
	<div class="border-neutral-muted relative overflow-hidden rounded-3xl border md:col-span-2">
		<canvas
			bind:this={canvas}
			class="bg-surface text-primary-readable block h-96 w-full md:h-full md:min-h-96"
			aria-label="Animated symmetrical kaleidoscope using the current theme colors"
		></canvas><span bind:this={secondaryColor} class="text-secondary hidden" aria-hidden="true"
		></span>
	</div>
</section>
