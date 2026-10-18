# Component Creation Guide for entasis

This document describes the complete methodology for creating a new component in the entasis design system, a component library for SvelteKit based on a configuration-over-markup approach.

## 📁 File Structure

Each component must follow this file structure:

```
ComponentName/
├── ComponentName.svelte          # Main component
├── componentName.props.ts        # Props type definitions
├── componentName.theme.ts        # Theme configuration with CVA
├── componentName.mcp.ts          # Documentation for MCP system
├── componentName.state.svelte.ts # (Optional) Complex state management
└── index.ts                      # Public exports
```

- Always create a new example page inside the routes/component/[component-name]. So i can play with the new component.

- Always add the mcp description to the mcp server inside hooks.server.ts

- Always add the component export into the package.json

````

### File Responsibilities

#### 1. `ComponentName.svelte`
- The main visual component
- Destructures props with `$props()`
- Uses `$derived` for computed values
- Implements snippets with `{#snippet}`
- Uses `{@attach}` for attachments
- Only one component with slots for composability. Never ask me if i want one or more .svelte file. The answer is always one.

#### 2. `componentName.props.ts`
- Defines TypeScript types for props
- Uses helpers `WithSlot<>` and `WithAttachments<>`
- Exports public and primitive types
- Documents props with JSDoc if necessary

#### 3. `componentName.theme.ts`
- Defines CSS classes with `cva()` for each component part
- Exports `componentNameTheme`, `useComponentNameTheme`, `setComponentNameTheme`
- Configures variants (size, color, variant, etc.)
- Uses `compoundVariants` for special cases

#### 4. `componentName.mcp.ts`
- Detailed documentation in markdown format
- Usage examples
- Props description and behavior
- Accessibility notes

#### 5. `componentName.state.svelte.ts` (optional)
- For components with complex state logic
- Class with `bind()` or `createBindableStateClass`
- Utility hooks (useKeyDown, useClickOutside, etc.)
- Context management with `setContext`/`getContext`

#### 6. `index.ts`
- Public exports of the component and all its types/themes
- Single entry point for users

---

## 🎨 Props System

### Basic Pattern

```typescript
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ComponentThemeProps } from './component.theme.js';

export type ComponentProps = WithAttachments<
  WithSlot<
    {
      // Base props
      ref?: HTMLElement | null;
      class?: string;
      disabled?: boolean;

      // Style props
      color?: Colors;
      size?: Sizes;
      variant?: 'solid' | 'outline' | 'soft' | 'ghost';

      // Bindable state props
      value?: string;

      // Event handlers
      onClick?: (payload?: any) => void;

      // Theme configuration
      theme?: ComponentThemeProps;
    },
    'prefix' | 'suffix' | 'children'  // Slot names
  >
>;
````

### Type Helpers

- **`WithSlot<Props, SlotNames>`**: Adds props for snippets
  - Automatically adds `slotName?: Slot` for each slot name

- **`WithAttachments<Props>`**: Allows accepting Svelte attachments
  - Enables the use of `{...attachments}` in the component
  - Used with the `...attachments` pattern in props destructuring

- **`ResponsiveProps<T>`**: For props that can vary by breakpoint
  - Allows `size="normal"` or `size={{ mobile: 'small', desktop: 'large' }}`

---

## 🔧 State Management

### Simple Components (without state class)

For components without complex state logic:

```svelte
<script lang="ts">
	import type { ComponentProps } from './component.props.js';
	import { useComponentTheme } from './component.theme.js';

	let {
		value = $bindable(null),
		disabled = false,
		color = 'primary',
		size = 'normal',
		onClick,
		class: className,
		theme,
		prefix,
		suffix,
		children,
		...attachments
	}: ComponentProps = $props();

	const classes = $derived(useComponentTheme(theme));

	const computedValue = $derived(value?.trim() || '');
</script>

<div class={classes.container({ color, size, disabled, className })} {...attachments}>
	<Slot render={prefix} class={classes.prefix({ size })} />
	<Slot render={children} />
	<Slot render={suffix} class={classes.suffix({ size })} />
</div>
```

### Complex Components (with state class)

For components with complex logic (Dialog, Popover, etc.):

#### `component.state.svelte.ts`

```typescript
import { bind } from '$lib/utils/state.svelte.js';
import { getContext, setContext, onMount, untrack } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { ComponentProps } from './component.props.js';

interface ComponentOptions extends Pick<ComponentProps, 'id' | 'size' | 'onOpen' | 'onClose'> {
	isOpen: boolean;
}

export class ComponentState {
	// Reactive state
	element: HTMLElement | null = $state(null);
	hasTransitioned = $state(false);

	// Context
	parent = getContext<ComponentState | null>('component');
	theme = useTheme();

	// Derived values
	computedSize = $derived(this.theme.resolveResponsiveProps(this.size, 'normal'));

	// Utility hooks
	clickOutside = useClickOutside({
		isActive: () => this.isOpen && this.hasTransitioned,
		callback: () => this.close()
	});

	constructor(options: ComponentOptions) {
		bind(this, options); // Bind props to class properties
		setContext('component', this);
		onMount(this.theme.addComponent(this));

		// Initialize hooks
		useKeyDown({
			isActive: () => this.isOpen,
			keys: ['Escape'],
			callback: () => this.close()
		});
	}

	open = () => {
		this.isOpen = true;
		this.onOpen?.(this);
	};

	close = () => {
		this.isOpen = false;
		this.onClose?.(this);
	};

	// Attachment with cleanup
	attachment = (node: HTMLElement) => {
		return untrack(() => {
			const cleanups: Array<(() => void) | void> = [];

			cleanups.push(this.clickOutside.reference?.(node));
			// Other attachments...

			return () => {
				cleanups.forEach((cleanup) => cleanup?.());
			};
		});
	};
}

// Interface merging for typing
export interface ComponentState extends ComponentOptions {}
```

#### Usage in Component

```svelte
<script lang="ts">
  import { ComponentState } from './component.state.svelte.js';
  
  let {
    id: customId,
    isOpen = $bindable(false),
    size,
    onOpen,
    onClose,
    ...
  }: ComponentProps = $props();
  
  const id = $props.id();
  
  const state = new ComponentState({
    id: customId || id,
    get isOpen() { return isOpen; },
    set isOpen(value) { isOpen = value; },
    get size() { return size; },
    onOpen,
    onClose
  });
</script>

<div {@attach state.attachment}>
	<!-- Content -->
</div>
```

---

## 🎭 Theme System with CVA

### Basic Structure

```typescript
import { cva, type InferComponentTheme } from '$lib/utils/cva.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva.js';

const defaultComponentContainer = cva({
	base: 'flex items-center justify-center rounded transition-all',
	variants: {
		size: {
			small: 'px-2 py-1 text-sm gap-1',
			normal: 'px-4 py-2 text-base gap-2',
			large: 'px-6 py-3 text-lg gap-3'
		},
		color: {
			primary: 'bg-primary text-primary-contrast',
			secondary: 'bg-secondary text-secondary-contrast',
			danger: 'bg-danger text-danger-contrast',
			success: 'bg-success text-success-contrast',
			warning: 'bg-warning text-warning-contrast',
			info: 'bg-info text-info-contrast',
			background: 'bg-background text-color-contrast',
			foreground: 'bg-foreground text-foreground-contrast'
		},
		variant: {
			solid: 'bg-color text-color-contrast',
			outline: 'bg-transparent border border-color text-color',
			soft: 'bg-color-muted text-color',
			ghost: 'bg-transparent text-color hover:bg-color-muted'
		},
		disabled: {
			true: 'opacity-55 cursor-not-allowed pointer-events-none',
			false: null
		}
	},
	compoundVariants: [
		{
			color: 'background',
			variant: 'solid',
			class: 'bg-background-dark hover:bg-background-light'
		},
		{
			color: 'foreground',
			variant: 'outline',
			class: 'border-foreground/50 hover:border-foreground'
		}
	],
	defaultVariants: {
		size: 'normal',
		color: 'primary',
		variant: 'solid',
		disabled: false
	}
});

// Define complete theme
export const componentTheme = {
	container: defaultComponentContainer,
	prefix: cva({ base: 'flex-shrink-0' }),
	suffix: cva({ base: 'flex-shrink-0' })
};

export type ComponentTheme = typeof componentTheme;
export type ComponentThemeProps = InferComponentTheme<ComponentTheme>;
export const setComponentTheme = setComponentTheme<ComponentTheme>('component');
export const useComponentTheme = useComponentTheme('component', componentTheme);
```

**Key patterns** try to avoid attribute selection classNames (like [data-active=true]:text-underline). Instead use cva variant and pass them to the theming system. Use tailwind variant for hover thought.

### Usage in Component

```svelte
<script lang="ts">
	const classes = $derived(useComponentTheme(theme));
</script>

<div class={classes.container({ size, color, variant, disabled, className })}>
	<!-- className is automatically merged -->
</div>
```

---

## 🔌 Attachments and Actions

### ⚠️ CRITICAL RULE: Use `untrack()`

**ALWAYS** wrap the body of attachments with `untrack()` to avoid infinite reactivity loops.

### Simple Attachment

```typescript
const simpleAttachment = (node: HTMLElement) => {
	return untrack(() => {
		// Setup
		const listener = () => console.log('clicked');
		node.addEventListener('click', listener);

		// Cleanup
		return () => {
			node.removeEventListener('click', listener);
		};
	});
};
```

### Attachment with Reactive State (spinnerOverlay pattern)

```typescript
import { untrack } from 'svelte';

export const spinnerOverlay = (opts: { loading?: boolean; text?: string }) => {
	return (node: HTMLElement) => {
		// Read reactive props BEFORE untrack
		opts.loading;
		opts.text;

		return untrack(() => {
			// Logic that uses values but doesn't create dependencies
			const setup = () => {
				if (opts.loading) {
					// Add spinner
				} else {
					// Remove spinner
				}
			};

			setup();

			return () => {
				// Cleanup
			};
		});
	};
};
```

**Key Pattern**:

1. Read reactive props outside `untrack()` to create dependencies
2. Do setup/cleanup inside `untrack()` to avoid cascading effects

### Attachment that Combines Multiple Hooks

```typescript
contentAttachment = (node: HTMLElement) => {
	return untrack(() => {
		const cleanups: Array<(() => void) | void> = [];

		// Attach multiple hooks
		cleanups.push(this.focusTrap.attachment?.(node));
		cleanups.push(this.clickOutside.reference?.(node));
		cleanups.push(this.scrollLock.reference?.(node));

		// Return combined cleanup function
		return () => {
			cleanups.forEach((cleanup) => cleanup?.());
		};
	});
};
```

---

## 📝 $effect and Precautions

### When to Use `$effect`

Use `$effect` for:

- Synchronizing with external APIs (DOM, localStorage, etc.)
- Performing side effects based on state changes
- Logging or tracking changes

### Pattern with `untrack()` in `$effect`

```typescript
$effect(() => {
	const newValue = this.value; // Create the dependency

	untrack(() => {
		// Code that shouldn't create dependencies
		if (!this.mounted) {
			this.mounted = true;
		} else {
			if (this.hasError) {
				this.validate(newValue); // Use the value but without reactivity
			}
			this.onChange?.(newValue);
		}
	});
});
```

**Why?**

- The line `const newValue = this.value` creates the reactive dependency
- Code inside `untrack()` can read other reactive states without creating additional dependencies
- Avoids infinite loops if `validate()` or `onChange()` modify state

### Anti-pattern to Avoid

```typescript
// ❌ BAD: Can create infinite loop
$effect(() => {
	if (this.value) {
		this.validate(this.value); // If validate modifies value, infinite loop
	}
});

// ✅ GOOD: Use untrack for the rest of the logic
$effect(() => {
	const value = this.value;
	untrack(() => {
		if (value) {
			this.validate(value);
		}
	});
});
```

---

## 📋 Field Components (Form Fields)

Field components (TextInput, DateInput, TimeInput, etc.) follow a specific pattern with the `Field` component.

### Structure of a Field Component

```svelte
<script lang="ts">
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/fieldState.svelte.js';
	import type { TextInputProps } from './textInput.props.js';
	import { useTextInputTheme } from './textInput.theme.js';

	let {
		value = $bindable(null),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		placeholder = '',
		theme,
		disabled,
		name,
		onValidate,
		visible,
		onChange,
		...rest
	}: TextInputProps = $props();

	const id = $props.id();

	// Create field state
	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		},
		get errors() {
			return errors;
		},
		set errors(v) {
			errors = v;
		},
		get focused() {
			return focused;
		},
		set focused(v) {
			focused = v;
		},
		onChange: (v) => onChange?.(v),
		get disabled() {
			return disabled;
		},
		set disabled(v) {
			disabled = v;
		},
		required,
		name,
		onValidate,
		visible,
		type: 'text' // Field type
	});

	const classes = $derived(useTextInputTheme(theme));
</script>

<Field
	{field}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: field.disabled,
				size: rest.size
			})
		}
	}}
	{...rest}
>
	<input
		type="text"
		{id}
		name={field.name}
		bind:value={field.value}
		bind:this={field.node}
		bind:focused={field.focused}
		{placeholder}
		disabled={field.disabled}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
	/>
</Field>
```

### Props for a Field Component

```typescript
import type { InputProps } from '../Field/field.js';
import type { TextInputThemeProps } from './textInput.theme.js';

export type TextInputProps = InputProps<'text'> & {
	placeholder?: string;
	theme?: TextInputThemeProps & InputProps<'text'>['theme'];
};
```

### FieldState Features

`createFieldState` automatically provides:

- **Validation**: Via Valibot schemas and custom `onValidate`
- **Error management**: Bindable `errors` and derived `hasError`
- **Focus tracking**: Bindable `focused`
- **Form integration**: Connects to parent `FormState` context
- **Change tracking**: `onChange` called on modification
- **Auto-validation**: Automatically revalidates if errors exist

### $effect in FieldState

```typescript
constructor(options) {
  super(options);

  $effect(() => {
    const newValue = this.value;
    untrack(() => {
      if (!this.mounted) {
        this.mounted = true;  // Skip first execution
      } else {
        if (this.hasError) {
          this.validate(newValue);  // Revalidate if error exists
        }
        this.onChange?.(newValue);
        if (this.form) {
          this.form.updateField(field);  // Notify parent form
        }
      }
    });
  });
}
```

---

## 🎯 Slot Component

The `Slot` component is used to render snippets flexibly.

### Basic Usage

```svelte
<Slot
  render={prefix}           <!-- Snippet or string to render -->
  class={classes.prefix()}  <!-- CSS classes -->
/>
```

### With Fallback (children)

```svelte
<Slot render={header} class={classes.header()}>
	<!-- Default content if header is not provided -->
	<h2>Default Title</h2>
</Slot>
```

### Conditional Rendering

```svelte
<Slot
  render={footer}
  renderIf={hasFooter}  <!-- Controls rendering -->
  class={classes.footer()}
/>
```

### With Custom Element

```svelte
<Slot
  as="header"              <!-- Render as <header> instead of <div> -->
  attrs={{ role: 'banner' }}  <!-- HTML attributes -->
  render={header}
/>
```

---

## 📚 MCP Documentation

### Structure of `.mcp.ts` File

```typescript
export const componentDescription = `
# ComponentName Component

Brief description of the component and its purpose.

## Basic Usage

\`\`\`svelte
<ComponentName>Basic example</ComponentName>
<ComponentName color="primary" size="large">With props</ComponentName>
\`\`\`

## Props

### Core Props
- **prop1**: type (default: value)
  - Detailed description
  - Specific behavior

- **prop2**: 'option1' | 'option2' (default: 'option1')
  - option1: Description
  - option2: Description

### Layout Props
- **fullWidth**: boolean (default: false) - Description
- **disabled**: boolean (default: false) - Description

### Event Props
- **onClick**: (payload?: Payload) => void - Event description

### Content Props (Slots)
- **children**: Snippet - Main content
- **prefix**: Snippet - Content before (typically icons)
- **suffix**: Snippet - Content after

### Advanced Props
- **payload**: any - Data passed to event handlers
- **theme**: ComponentTheme - Theme overrides

## Structure

Description of the component's DOM structure.

## Examples

### Example 1
\`\`\`svelte
<ComponentName variant="outline" color="primary">
  Example
</ComponentName>
\`\`\`

### Example 2 - With Slots
\`\`\`svelte
<ComponentName>
  {#snippet prefix()}
    {@render icon()}
  {/snippet}
  Content
</ComponentName>
\`\`\`

## Accessibility

- Accessibility points
- ARIA attributes used
- Keyboard support

## Notes

- Important usage notes
- Known limitations
- Special behaviors
`;
```

---

## ✅ Component Creation Checklist

### 1. Planning

- [ ] Define required props
- [ ] Identify if complex state management is needed
- [ ] List variants and style options
- [ ] Define slots/snippets

### 2. Types (`*.props.ts`)

- [ ] Create prop types with `WithSlot` and `WithAttachments`
- [ ] Define variant types
- [ ] Document complex props with JSDoc

### 3. Theme (`*.theme.ts`)

- [ ] Create CVA for each component part
- [ ] Define variants (size, color, variant, disabled, etc.)
- [ ] Add `compoundVariants` if necessary
- [ ] Export `componentTheme`, `useComponentTheme`, `setComponentTheme`

### 4. State (optional, `*.state.svelte.ts`)

- [ ] Create class with `bind()` or `createBindableStateClass`
- [ ] Define `$state` and `$derived` properties
- [ ] Implement public methods
- [ ] Create attachments with `untrack()`
- [ ] Initialize utility hooks
- [ ] Manage context with `setContext`/`getContext`

### 5. Component (`*.svelte`)

- [ ] Destructure props with `$props()`
- [ ] Create state instance if needed
- [ ] Use `$derived` for computed values
- [ ] Implement slots with `Slot` component
- [ ] Apply classes with theme
- [ ] Use `{@attach}` for attachments
- [ ] Handle events

### 6. Documentation (`*.mcp.ts`)

- [ ] Write component description
- [ ] Document all props
- [ ] Provide usage examples
- [ ] Add accessibility notes
- [ ] Mention special behaviors

### 7. Exports (`index.ts`)

- [ ] Export default component
- [ ] Export all types
- [ ] Export theme and helpers

### 8. Tests (if applicable)

- [ ] Test different variants
- [ ] Test user interactions
- [ ] Test accessibility
- [ ] Test with different prop combinations

---

## 🎓 Complete Examples

### Example 1: Simple Component (Badge)

```typescript
// badge.props.ts
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';

export type BadgeProps = WithAttachments<{
	class?: string;
	color?: Colors;
	size?: Sizes;
	variant?: 'solid' | 'outline' | 'soft';
	children?: Snippet;
}>;
```

```typescript
// badge.theme.ts
import { cva } from '$lib/utils/cva.js';

const defaultBadge = cva({
	base: 'inline-flex items-center justify-center rounded-full font-medium',
	variants: {
		size: {
			small: 'px-2 py-0.5 text-xs',
			normal: 'px-2.5 py-1 text-sm',
			large: 'px-3 py-1.5 text-base'
		},
		color: {
			primary: 'bg-primary text-primary-contrast',
			danger: 'bg-danger text-danger-contrast'
			// ... other colors
		},
		variant: {
			solid: 'bg-color text-color-contrast',
			outline: 'bg-transparent border border-color text-color',
			soft: 'bg-color-muted text-color'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'primary',
		variant: 'solid'
	}
});

export const badgeTheme = { badge: defaultBadge };
export const useBadgeTheme = useComponentTheme('badge', badgeTheme);
export const setBadgeTheme = setComponentTheme<typeof badgeTheme>('badge');
```

```svelte
<!-- Badge.svelte -->
<script lang="ts">
	import type { BadgeProps } from './badge.props.js';
	import { useBadgeTheme } from './badge.theme.js';

	let {
		class: className,
		color = 'primary',
		size = 'normal',
		variant = 'solid',
		children,
		...attachments
	}: BadgeProps = $props();

	const classes = $derived(useBadgeTheme());
</script>

<span class={classes.badge({ color, size, variant, className })} {...attachments}>
	{@render children?.()}
</span>
```

### Example 2: Component with State (Tooltip)

```typescript
// tooltip.state.svelte.ts
import { bind } from '$lib/utils/state.svelte.js';
import { untrack } from 'svelte';
import { computePosition, offset, flip, shift } from '@floating-ui/dom';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';

interface TooltipOptions {
	id: string;
	isOpen: boolean;
	content: string;
	placement: Placement;
	delay: number;
}

export class TooltipState {
	triggerElement: HTMLElement | null = $state(null);
	tooltipElement: HTMLElement | null = $state(null);

	hoverAction = useHoverAction({
		isActive: () => !this.isOpen,
		onMouseEnter: () => this.open(),
		onMouseLeave: () => this.close(),
		delay: this.delay
	});

	constructor(options: TooltipOptions) {
		bind(this, options);
	}

	open = () => {
		this.isOpen = true;
	};

	close = () => {
		this.isOpen = false;
	};

	updatePosition = async () => {
		if (!this.triggerElement || !this.tooltipElement) return;

		const { x, y } = await computePosition(this.triggerElement, this.tooltipElement, {
			placement: this.placement,
			middleware: [offset(8), flip(), shift({ padding: 5 })]
		});

		Object.assign(this.tooltipElement.style, {
			left: `${x}px`,
			top: `${y}px`
		});
	};

	triggerAttachment = (node: HTMLElement) => {
		return untrack(() => {
			this.triggerElement = node;
			const cleanup = this.hoverAction.reference?.(node);

			return () => {
				cleanup?.();
				this.triggerElement = null;
			};
		});
	};

	tooltipAttachment = (node: HTMLElement) => {
		return untrack(() => {
			this.tooltipElement = node;
			void this.updatePosition();

			return () => {
				this.tooltipElement = null;
			};
		});
	};
}

export interface TooltipState extends TooltipOptions {}
```

---

## 🚨 Common Pitfalls and Solutions

### 1. Infinite Loops with $effect

**Problem**:

```typescript
$effect(() => {
	if (this.value !== previousValue) {
		this.value = transform(this.value); // ❌ Modifies the observed value
	}
});
```

**Solution**:

```typescript
$effect(() => {
	const currentValue = this.value;
	untrack(() => {
		const transformed = transform(currentValue);
		if (transformed !== currentValue) {
			this.value = transformed; // ✅ Inside untrack
		}
	});
});
```

### 2. Attachments Triggering Too Many Re-renders

**Problem**:

```typescript
const attachment = (node: HTMLElement) => {
	// ❌ Creates dependency on this.isOpen
	if (this.isOpen) {
		setupOverlay(node);
	}
	return () => {};
};
```

**Solution**:

```typescript
const attachment = (node: HTMLElement) => {
	this.isOpen; // Read to create dependency
	return untrack(() => {
		// ✅ Setup in untrack
		if (this.isOpen) {
			setupOverlay(node);
		}
		return () => {
			cleanupOverlay(node);
		};
	});
};
```

### 3. Forgetting Cleanup in Attachments

**Problem**:

```typescript
const attachment = (node: HTMLElement) => {
	node.addEventListener('click', handler);
	// ❌ No cleanup
};
```

**Solution**:

```typescript
const attachment = (node: HTMLElement) => {
	return untrack(() => {
		node.addEventListener('click', handler);
		return () => {
			node.removeEventListener('click', handler); // ✅ Cleanup
		};
	});
};
```

### 4. Bindable Props Not Synced with State

**Problem**:

```typescript
const state = new ComponentState({
	id,
	isOpen: isOpen // ❌ Static value
});
```

**Solution**:

```typescript
const state = new ComponentState({
	id,
	get isOpen() {
		return isOpen;
	}, // ✅ Reactive getter
	set isOpen(value) {
		isOpen = value;
	} // ✅ Bindable setter
});
```

### 5. CVA Classes Not Applied Correctly

**Problem**:

```typescript
<div class="{classes.container()} {className}">  // ❌ Bad merge
```

**Solution**:

```typescript
<div class={classes.container({ className })}>  // ✅ CVA merges automatically
```

---

## 📖 Resources and References

### Utility Types

- `WithSlot<Props, SlotNames>`: Adds props for snippets
- `WithAttachments<Props>`: Allows attachments
- `ResponsiveProps<T>`: Responsive props by breakpoint
- `Colors`, `Sizes`: Common types for colors and sizes

### Reusable Hooks

- `useClickOutside`: Detects clicks outside
- `useKeyDown`: Listens for keyboard keys
- `useScrollLock`: Locks scrolling
- `useFocusTrap`: Traps focus in an element
- `useHoverAction`: Handles hover with delay
- `useResizeObserver`: Observes size changes
- `useBoundingClientRect`: Tracks element dimensions

### Available Contexts

- `useTheme()`: Access global theme
- `getContext('form')`: Access parent form (for fields)
- `getContext('dialog')`: Access parent dialog (for nesting)
- `getContext('popover')`: Access parent popover

### Utilities

- `bind(target, props)`: Binds props to an object
- `createBindableStateClass<Props>()`: Creates class with bindable props
- `cva()`: Create CSS variants
- `cn()`: Merge CSS classes (via tailwind-merge)

---

## 🎯 Best Practices Summary

1. **Always use `untrack()` in attachments** to avoid infinite loops
2. **Create reactive dependencies before `untrack()`** by reading props
3. **Use `$derived` for computed values** rather than $effect
4. **Return a cleanup function** in all attachments
5. **Use `bind()` to link props to state** in classes
6. **Define getters/setters for bindable props** in state
7. **Use the `Slot` component** for all snippets
8. **Apply theme via CVA** with `useComponentTheme`
9. **Document in `.mcp.ts`** with complete examples
10. **Follow the file structure** for consistency
11. **For field components**, use `createFieldState` and the `Field` component
12. **Combine cleanups** when multiple attachments are used
13. **Make the mcp documentation available** by adding it into the hooks.server.ts
14. Look at other component like Button or Card or Popover to better understand the structure if you need to.

---

This guide constitutes the complete reference for creating consistent and maintainable components in the entasis system. Follow it step by step to ensure code quality and consistency.
