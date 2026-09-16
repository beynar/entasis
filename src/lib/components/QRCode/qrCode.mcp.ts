export const qrCodeDescription = `
# QRCode Component

The QRCode component renders a customizable QR code as an SVG. It supports theme sizes and colors, gradients, custom shapes for data modules and finder patterns, an embedded center image, and downloading as SVG, PNG or JPEG. Ported from react-qr-code (https://github.com/LGLabGreg/react-qr-code).

## Basic Usage

\`\`\`svelte
<QRCode value="https://example.com" />
<QRCode value="https://example.com" size="large" color="primary" />
\`\`\`

## Props

### Core Props
- **value**: string | string[] (required) - The value to encode. An array of strings represents multiple segments to further optimize the QR Code.
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: 96px (size-24)
  - normal: 128px (size-32)
  - large: 192px (size-48)
- **color**: Colors (default: 'neutral') - Theme color of the modules and finder patterns. Applied through \`currentColor\`, so it adapts to the active theme.
- **level**: 'L' | 'M' | 'Q' | 'H' (default: 'M') - The Error Correction Level.
- **minVersion**: number (default: 1) - Minimum QR version (1-40) used as the lower bound when encoding.
- **boostLevel**: boolean (default: true) - Allow raising the Error Correction Level when it does not increase the version.
- **marginSize**: number (default: 4) - Number of modules used as margin (quiet zone). The QR specification requires 4.

### Styling Props
- **background**: string | GradientSettings - Background color or gradient. Transparent when not provided.
- **gradient**: GradientSettings - Gradient applied to data modules and finder patterns. Overrides \`color\` and the settings colors.
- **dataModulesSettings**: { color?, style?, randomSize?, scale?, lineWidth? } - Data module rendering.
  - style: 'square' | 'square-sm' | 'pinched-square' | 'rounded' | 'leaf' | 'vertical-line' | 'horizontal-line' | 'circuit-board' | 'circle' | 'diamond' | 'star' | 'heart' | 'hashtag'
- **finderPatternOuterSettings**: { color?, style? } - Outer finder pattern rendering.
  - style: 'square' | 'pinched-square' | 'rounded-sm' | 'rounded' | 'rounded-lg' | 'circle' | 'inpoint-sm' | 'inpoint' | 'inpoint-lg' | 'outpoint-sm' | 'outpoint' | 'outpoint-lg' | 'leaf-sm' | 'leaf' | 'leaf-lg'
- **finderPatternInnerSettings**: { color?, style? } - Inner finder pattern rendering.
  - style: same as outer, plus 'diamond' | 'star' | 'heart' | 'hashtag' | 'microchip'
- **imageSettings**: { src, width, height, excavate?, x?, y?, opacity?, crossOrigin? } - Embedded center image. \`excavate\` clears the modules behind the image. Pixel values are relative to the nominal size of the QR code.
- **class**: string - Additional CSS classes on the SVG element.
- **theme**: QRCodeTheme - Theme overrides.

### Accessibility Props
- **label**: string (default: 'QR Code') - Accessible label of the SVG.

### Advanced Props
- **ref**: SVGSVGElement | null (bindable) - The rendered SVG element.

## Methods

Bind the component instance to access:

- **download(options?)**: Downloads the QR code.
  - options.name: string (default: 'qr-code') - File name without extension.
  - options.format: 'svg' | 'png' | 'jpeg' (default: 'svg')
  - options.dimension: number (default: 500) - Exported file width and height in pixels.

\`\`\`svelte
<script>
	let qr;
</script>

<QRCode bind:this={qr} value="https://example.com" />
<Button onclick={() => qr.download({ format: 'png' })}>Download</Button>
\`\`\`

## Examples

### Gradient with custom shapes
\`\`\`svelte
<QRCode
	value="https://example.com"
	gradient={{
		type: 'linear',
		rotation: 45,
		stops: [
			{ offset: '0%', color: '#6d78d5' },
			{ offset: '100%', color: '#d56d6d' }
		]
	}}
	dataModulesSettings={{ style: 'circle' }}
	finderPatternOuterSettings={{ style: 'rounded' }}
	finderPatternInnerSettings={{ style: 'circle' }}
/>
\`\`\`

### Embedded image
\`\`\`svelte
<QRCode
	value="https://example.com"
	level="H"
	imageSettings={{ src: '/logo.png', width: 24, height: 24, excavate: true }}
/>
\`\`\`

## Accessibility

- The SVG has \`role="img"\` and an \`aria-label\` (customizable via the \`label\` prop).

## Notes

- Colors default to \`currentColor\`, driven by the \`color\` prop theme classes; downloads resolve the computed color so exports match the on-screen theme.
- Keep enough contrast between the modules and the surface behind the QR code, and prefer \`level="H"\` when embedding an image, otherwise the code may not scan.
- \`randomSize\` and low \`scale\`/\`lineWidth\` values in \`dataModulesSettings\` may degrade scannability.
`;
