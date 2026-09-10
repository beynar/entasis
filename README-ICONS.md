# Icon System

This component library includes **1513 icons** from Phosphor Icons, each available in 6 variants. All icons are SVG-based and fully customizable.

## 🚀 Quick Start

### Installation

```bash
npm install svelai
```

### Basic Usage

```svelte
<script>
	import { homeIcon, settingsIconBold } from 'svelai/icons';
</script>

<!-- Direct SVG rendering -->
{@render homeIcon()}

<!-- With custom size and color -->
{@render settingsIconBold({ size: 32, color: '#3b82f6' })}

<!-- With CSS classes -->
<div class="h-6 w-6 text-blue-500">
	{@render settingsIconBold()}
</div>
```

## 📦 Import Methods

### Individual Icon Import (Recommended)

Tree-shakeable imports for optimal bundle size:

```typescript
import { homeIcon, homeIconBold, homeIconFill } from 'svelai/icons';
```

### Barrel Import (Not Recommended)

Only use for development/prototyping due to bundle size impact:

```typescript
import * as Icons from 'svelai/icons';

const HomeIcon = Icons.homeIcon;
```

## 🎨 Available Variants

Each icon includes these variants:

- **Icon** (regular) - Standard weight
- **IconBold** - Bold weight
- **IconDuotone** - Two-tone style
- **IconFill** - Filled style
- **IconLight** - Light weight
- **IconThin** - Thin weight

## ⚙️ Icon Props

Icons accept the following props:

- **size**: `number` (default: 24) - Size in pixels
- **color**: `string` (default: 'currentColor') - Icon color
- **mirrored**: `boolean` (default: false) - Flip the icon horizontally
- Any standard SVG attributes (class, style, etc.)

### Variant Examples:

```typescript
import {
	homeIcon, // Regular
	homeIconBold, // Bold
	homeIconDuotone, // Duotone
	homeIconFill, // Filled
	homeIconLight, // Light
	homeIconThin // Thin
} from 'svelai/icons';
```

### Props Examples:

```svelte
<!-- Default icon (24px, currentColor) -->
{@render homeIcon()}

<!-- Large icon (48px) -->
{@render homeIcon({ size: 48 })}

<!-- Custom color -->
{@render homeIcon({ color: '#ef4444' })}

<!-- Mirrored icon -->
{@render arrowRightIcon({ mirrored: true })}

<!-- Combined props -->
{@render settingsIcon({ size: 32, color: '#3b82f6', class: 'animate-spin' })}
```

## 🛠 Development

### Regenerating Icon Exports

If you add new icons to the `src/lib/components/Icons/` directory, run:

```bash
npm run generate-icons
```

This script will:

- ✅ Scan all icon files in the Icons directory
- ✅ Generate a comprehensive `index.ts` barrel export file
- ✅ Create agent documentation with all available icons
- ✅ Update `package.json` exports for proper module resolution

### Manual Script Execution

```bash
node generate-icons.js
```

## 📚 Icon Categories

### Icon List

For a complete list of all 1513 available icons, see the [agent documentation](src/lib/components/Icons/agent.ts).

### Categories

The icons cover these categories:

- **Interface**: Arrows, navigation, controls, UI elements
- **Communication**: Chat, mail, phone, social media
- **Media**: Play, pause, music, video controls
- **Files**: Documents, folders, file types
- **Business**: Office, finance, charts, buildings
- **Technology**: Devices, code, networks, software
- **Nature**: Weather, plants, animals
- **Transportation**: Cars, planes, transit
- **Shopping**: Cart, payment, commerce
- **User**: Profile, account, people
- **System**: Settings, tools, configuration

## 🎯 Usage Examples

### Basic Icon Display

```svelte
<script>
	import { userIcon, settingsIcon } from 'svelai/icons';
</script>

<div class="flex gap-4">
	{@render userIcon()}
	{@render settingsIcon()}
</div>
```

### Icon with Custom Styling

```svelte
<script>
	import { heartIconFill } from 'svelai/icons';
</script>

<div class="heart-icon">
	{@render heartIconFill()}
</div>

<style>
	.heart-icon {
		width: 24px;
		height: 24px;
		color: #ef4444; /* red-500 */
		transition: color 0.2s;
	}

	.heart-icon:hover {
		color: #dc2626; /* red-600 */
	}
</style>
```

### Dynamic Icon Selection

```svelte
<script>
	import * as Icons from 'svelai/icons';

	let iconName = $state('home');
	let variant = $state('');

	$: selectedIcon = Icons[iconName + variant + 'Icon'];
</script>

<select bind:value={iconName}>
	<option value="home">Home</option>
	<option value="user">User</option>
	<option value="settings">Settings</option>
</select>

<select bind:value={variant}>
	<option value="">""</option>
	<option value="Bold">Bold</option>
	<option value="Fill">Fill</option>
</select>

<div class="h-8 w-8">
	{#if selectedIcon}
		{@render selectedIcon()}
	{/if}
</div>
```

### Icon Button Component

```svelte
<script>
	import { Button } from 'svelai';
	import { plusIcon } from 'svelai/icons';

	let { onclick, icon = plusIcon, ...props } = $props();
</script>

<Button {onclick} {...props}>
	{#snippet prefix()}
		{@render icon()}
	{/snippet}
	<slot />
</Button>
```

## 🎨 Styling & Customization

Icons inherit the current text color and can be styled with CSS:

```css
/* Size control */
.icon-sm {
	width: 16px;
	height: 16px;
}
.icon-md {
	width: 24px;
	height: 24px;
}
.icon-lg {
	width: 32px;
	height: 32px;
}

/* Color control */
.icon-primary {
	color: #3b82f6;
}
.icon-success {
	color: #10b981;
}
.icon-danger {
	color: #ef4444;
}

/* Interactive states */
.icon-button {
	transition: color 0.2s ease;
	cursor: pointer;
}

.icon-button:hover {
	color: #1d4ed8;
}
```

## ♿ Accessibility

- **Semantic HTML**: Icons are rendered as inline SVG elements
- **Screen Readers**: Add appropriate `aria-label` or `title` attributes when needed
- **Color Contrast**: Ensure sufficient contrast between icon and background
- **Interactive Icons**: Use proper ARIA roles for clickable icons

```svelte
<!-- Decorative icon -->
<span aria-hidden="true">
	{@render decorativeIcon()}
</span>

<!-- Functional icon -->
<button aria-label="Close dialog">
	{@render xIcon()}
</button>
```

## 🔧 Technical Details

- **Format**: Svelte snippets that return optimized SVG
- **Tree Shaking**: Fully supported when using individual imports
- **Bundle Size**: Each icon adds ~1-3KB to your bundle
- **Performance**: Icons are statically imported, no runtime fetching
- **TypeScript**: Full TypeScript support with proper type definitions
- **Svelte 5**: Uses {@render iconName()} syntax for optimal performance

## 📄 License

Icons are from [Phosphor Icons](https://phosphoricons.com/) and are licensed under MIT License.
