# Component Refactoring Prompt: Standardize Component Structure

## Objective

Refactor all non-Form components to follow the same standardized file structure pattern that was applied to Form components. Each component should have separate files for props, theme, and a unified index.ts export file.

## Standard Component Structure Pattern

Every component should follow this structure:

```
ComponentName/
├── index.ts                    # Main export file
├── componentName.props.ts      # Props type definitions
├── componentName.theme.ts      # Theme definitions and exports
├── ComponentName.svelte         # Component implementation
├── componentName.mcp.ts        # MCP definitions (if exists)
└── [other supporting files]    # State, utilities, etc.
```

## Required File Contents

### 1. `componentName.props.ts`

- Extract all prop types from the component's main types file
- Should export the main component props type (e.g., `ButtonProps`, `AvatarProps`)
- Import any dependencies needed for the props (e.g., `WithSlot`, `Colors`, etc.)
- Import theme types from `componentName.theme.ts` if theme is part of props

**Example structure:**

```typescript
import type { SomeDependency } from '../somewhere.js';
import type { ComponentThemeProps } from './componentName.theme.js';

export type ComponentProps = {
	// ... props definition
	theme?: ComponentThemeProps;
};
```

### 2. `componentName.theme.ts`

- Extract all theme-related code (CVA definitions, theme object, theme functions)
- Should export:
  - Theme object (e.g., `componentTheme`)
  - Theme type (`ComponentTheme`)
  - Theme props type (`ComponentThemeProps`)
  - `setComponentTheme` function (`setComponentTheme`)
  - `useComponentTheme` hook (`useComponentTheme`)

**Example structure:**

```typescript
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva.js';

const defaultComponent = cva({
  base: '...',
  variants: { ... }
});

export const componentTheme = {
  component: defaultComponent,
  // ... other theme parts
};

export type ComponentTheme = typeof componentTheme;
export type ComponentThemeProps = InferComponentTheme<ComponentTheme>;
export const setComponentTheme = setComponentTheme<ComponentTheme>('component');
export const useComponentTheme = useComponentTheme('component', componentTheme);
```

### 3. `index.ts`

- Export the component as default: `export { default as ComponentName } from './ComponentName.svelte';`
- Export props types: `export type { ComponentProps } from './componentName.props.js';`
- Export theme functions and types: `export { componentTheme, setComponentTheme, useComponentTheme, type ComponentTheme, type ComponentThemeProps } from './componentName.theme.js';`
- Export any other public types/utilities if needed

**Example structure:**

```typescript
export { default as ComponentName } from './ComponentName.svelte';
export type { ComponentProps } from './componentName.props.js';
export {
	componentTheme,
	setComponentTheme,
	useComponentTheme,
	type ComponentTheme,
	type ComponentThemeProps
} from './componentName.theme.js';
```

### 4. Component `.svelte` file

- Remove any `<script lang="ts" module>` blocks that export theme functions
- Import theme functions from `./componentName.theme.js` instead
- Import props types from `./componentName.props.js` instead of the main types file
- Update all imports to use the new separate files

**Before:**

```svelte
<script lang="ts" module>
	import { setComponentTheme, useComponentTheme } from '$lib/utils/cva.js';
	import { componentTheme } from './component.ts';
	export const setComponentTheme = setComponentTheme<typeof componentTheme>('component');
	export const useComponentTheme = useComponentTheme('component', componentTheme);
</script>

<script lang="ts">
	import type { ComponentProps } from './component.ts';
	// ...
</script>
```

**After:**

```svelte
<script lang="ts">
	import type { ComponentProps } from './componentName.props.js';
	import { useComponentTheme } from './componentName.theme.js';
	// ...
</script>
```

### 5. Original types file (e.g., `component.ts` or `componentName.ts`)

- Keep only shared types that are used by OTHER components
- Remove props types (moved to `componentName.props.ts`)
- Remove theme code (moved to `componentName.theme.ts`)
- If the file becomes empty or only contains internal types, you can:
  - Keep it for backwards compatibility with re-exports, OR
  - Delete it if no other components depend on it
- If keeping for backwards compatibility, add re-exports:
  ```typescript
  // Re-export for backwards compatibility
  export type { ComponentProps } from './componentName.props.js';
  export {
  	componentTheme,
  	setComponentTheme,
  	useComponentTheme,
  	type ComponentTheme,
  	type ComponentThemeProps
  } from './componentName.theme.js';
  ```

## Components to Refactor

Refactor the following components (verify each has the standard structure):

### Non-Form Components:

- Avatar
- Badge
- Button
- ButtonGroup
- Chip
- Code
- Confirmation
- Dialog
- Heading
- Icons (verify structure)
- Meter
- Popover
- ScrollArea
- Slot
- Stepper
- Theme
- ToggleButton
- ToggleButtonGroup
- Tooltip
- Toast

### Field Component (if it should be exported):

- Field (currently internal, verify if it needs refactoring)

## Package.json Updates

### Exports Section

For each component, ensure the export follows this pattern:

```json
"./component-name": {
  "types": "./dist/components/ComponentName/index.d.ts",
  "svelte": "./dist/components/ComponentName/index.js",
  "default": "./dist/components/ComponentName/index.js"
}
```

**Rules:**

- Use kebab-case for export names (e.g., `./button`, `./avatar`, `./dialog`)
- All paths should point to `index.js` and `index.d.ts` files
- Remove any old exports pointing directly to `.svelte` files

### typesVersion Section

Update the `typesVersion` section to:

- Use kebab-case export names
- Point to `index.d.ts` files instead of `.svelte.d.ts` files
- Only include components that are actually exported

**Example:**

```json
"./button": [
  "./dist/components/Button/index.d.ts"
]
```

## Refactoring Steps for Each Component

1. **Analyze the component structure**
   - Check if `index.ts` exists
   - Check if `componentName.props.ts` exists
   - Check if `componentName.theme.ts` exists
   - Review the main types file to understand what needs to be extracted

2. **Create `componentName.props.ts`** (if missing)
   - Extract props types from the main types file
   - Ensure proper imports and dependencies

3. **Create `componentName.theme.ts`** (if missing)
   - Extract theme CVA definitions
   - Extract theme object
   - Create theme functions (`setComponentTheme`, `useComponentTheme`)
   - Export theme types

4. **Create/Update `index.ts`**
   - Export component as default
   - Export props types
   - Export theme functions and types

5. **Update Component `.svelte` file**
   - Remove module script block with theme exports
   - Update imports to use new separate files
   - Import theme hook from `componentName.theme.js`

6. **Update original types file**
   - Remove props types (moved to props file)
   - Remove theme code (moved to theme file)
   - Keep only shared types used by other components
   - Optionally add re-exports for backwards compatibility

7. **Update any other files that import from the component**
   - Update imports in dependent files
   - Check `componentName.mcp.ts` if it exists
   - Update any state files or utilities

8. **Update `package.json`**
   - Update exports section with kebab-case naming
   - Ensure paths point to `index.js` files
   - Update `typesVersion` section if needed

9. **Verify**
   - Run linter to check for errors
   - Verify all imports are correct
   - Ensure no circular dependencies

## Special Cases

### Components with Multiple Exports

Some components like `Calendar` export multiple components (e.g., `CalendarInput` and `CalendarPrimitive`). Keep this pattern but ensure the structure is consistent.

### Components without Themes

If a component doesn't have a theme file, that's okay. Just ensure:

- `index.ts` exports the component
- Props are in `componentName.props.ts`
- Package.json points to `index.js`

### Components with Complex State

Keep state files separate (e.g., `componentState.svelte.ts`). Don't move them into props or theme files.

## Verification Checklist

After refactoring each component, verify:

- [ ] `index.ts` exists and exports component, props, and theme
- [ ] `componentName.props.ts` exists and contains props types
- [ ] `componentName.theme.ts` exists (if component has theme) and exports theme functions
- [ ] Component `.svelte` file imports from new separate files
- [ ] Original types file is cleaned up (no props/theme code)
- [ ] All imports in dependent files are updated
- [ ] `package.json` export uses kebab-case and points to `index.js`
- [ ] `typesVersion` section updated if component is listed there
- [ ] No linter errors
- [ ] No TypeScript errors

## Notes

- **Preserve backwards compatibility**: If other components or files import from the old types file, consider keeping re-exports in that file
- **Check dependencies**: Before deleting any code, verify no other components import it
- **Follow existing patterns**: Match the structure already established in Form components
- **Maintain consistency**: All components should follow the exact same pattern

## Expected Outcome

After refactoring:

- All components follow the same file structure
- Props and themes are cleanly separated
- Package.json exports are consistent with kebab-case naming
- All exports point to `index.js` files
- Code is more maintainable and follows clear separation of concerns
