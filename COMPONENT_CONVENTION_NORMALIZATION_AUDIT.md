# Component Convention Normalization Audit

Scope: `src/lib/components/**/*.props.ts`, `src/lib/components/**/*.theme.ts`, component `index.ts` files, and `package.json` exports.

Note: the worktree was already heavily modified when this audit ran. Findings describe the current local state, not necessarily the last committed state.

## Summary

Highest-value normalization opportunities:

1. Theme root slot names should converge on `root`.
2. Theme context IDs should match the public component slug.
3. Controlled open-state props should use one shape across overlays and disclosures.
4. Pointer/click callback props need one casing and signature convention.
5. Form-control public nouns should be derived from one canonical component name.
6. `Field` size variants should match the exported `Sizes` token.
7. Slot/class behavior needs an explicit contract; several named slots currently bypass class plumbing.

## Finding 1: Theme Root Slot Names Drift

The outer/root theme slot is not named consistently. Some themes already use `root`, some use the component name, and some use structural names like `container`, `shell`, or `base`.

Examples:

- `src/lib/components/AppShell/appShell.theme.ts:12` uses `root`.
- `src/lib/components/Badge/badge.theme.ts:54` uses `badge` for the only/root slot.
- `src/lib/components/AspectRatio/aspectRatio.theme.ts:12` uses `container`.
- `src/lib/components/PageShell/pageShell.theme.ts:117` uses `shell`.
- `src/lib/components/ScrollArea/scrollArea.theme.ts:33` uses `base`.

Affected groups found in the inventory:

- Already normalized to `root`: `AppShell`, `Map`, `Mermaid`, `Tree`.
- Component-name root keys: `Accordion`, `Alert`, `Avatar`, `Badge`, `Button`, `ButtonGroup`, `Card`, `Chip`, `Code`, `Dialog`, `Diff`, `Empty`, `Form`, `Globe`, `Kbd`, `Menu`, `MenuOption`, `Meter`, `NetworkIndicator`, `Pagination`, `QRCode`, `Separator`, `Skeleton`, `Spinner`, `Stepper`, `Tabbar`, `Table`, `Tabs`, `Tooltip`.
- Structural root keys: `AspectRatio.container`, `Breadcrumbs.container`, `Carousel.container`, `Collapsible.container`, `Command.command`, `PageShell.shell`, `Popover.container`, `ScrollArea.base`, `PDFViewer.container`.
- Form inputs are a special case because many component themes style `input` and `inputContainer` while the shared `Field` owns the visible wrapper. That should be documented as an exception if kept.

Suggestion:

Adopt this convention for all component themes:

```ts
export const componentTheme = {
	root: defaultRoot,
	// semantic child slots after root
	header: defaultHeader,
	content: defaultContent
};
```

Migration path:

- Add `root` first.
- Keep the previous root key as a deprecated alias where needed.
- Document that `theme.root` always targets the first DOM element emitted by the exported component, except explicit field-input themes where `Field` owns the root.

## Finding 2: Theme Context IDs Drift Between Kebab Case and Camel Case

The `setComponentTheme()` / `useComponentTheme()` context key sometimes matches the public slug and sometimes uses camelCase. This makes theme-provider behavior harder to predict across compound component names.

Examples:

- Kebab-case context IDs already exist:
  - `src/lib/components/AppShell/appShell.theme.ts:19` uses `app-shell`.
  - `src/lib/components/AspectRatio/aspectRatio.theme.ts:19` uses `aspect-ratio`.
  - `src/lib/components/PageShell/pageShell.theme.ts:141` uses `page-shell`.
- CamelCase context IDs also exist:
  - `src/lib/components/ScrollArea/scrollArea.theme.ts:44` uses `scrollArea`.
  - `src/lib/components/ToggleButton/toggleButton.theme.ts:137` uses `toggleButton`.
  - `src/lib/components/ButtonGroup/buttonGroup.theme.ts:17` uses `buttonGroup`.
  - `src/lib/components/Form/TextInput/textInput.theme.ts:47` uses `textInput`.
  - `src/lib/components/QRCode/qrCode.theme.ts:35` uses `qrCode`.
- Some context IDs also drift from the exported component noun:
  - `src/lib/components/Form/RadioInput/radioInput.theme.ts:114` uses `radiosInput`.
  - `src/lib/components/Form/Switch/switch.theme.ts:96` uses `switchInput`.
  - `src/lib/components/Form/CheckboxesInput/checkBoxesInput.theme.ts:116` uses `checkboxesInput`.

The public package exports are already slug-shaped, for example `./switch`, `./date-input`, `./file-input`, `./radio-input`, and `./checkboxes-input` in `package.json:181` through `package.json:248`.

Suggestion:

Use the public component slug as the theme context ID:

```ts
const componentSlug = 'scroll-area';

export const setScrollAreaTheme = setComponentTheme<ScrollAreaTheme>(componentSlug);
export const useScrollAreaTheme = useComponentTheme(componentSlug, scrollAreaTheme);
```

Suggested slug mapping for affected examples:

- `toggleButton` -> `toggle-button`
- `toggleButtonGroup` -> `toggle-button-group`
- `buttonGroup` -> `button-group`
- `textInput` -> `text-input`
- `qrCode` -> `qr-code`
- `scrollArea` -> `scroll-area`
- `radioInput` / `radiosInput` -> `radio-input`
- `checkboxesInput` -> `checkboxes-input`
- `switchInput` -> `switch`

Because these keys are used for Svelte context, this needs a compatibility plan if consumers already call `setXTheme()`.

## Finding 3: Open-State Props Use Multiple Shapes

Open-state APIs currently mix `isOpen`, `open`, lifecycle callbacks, and change callbacks.

Examples:

- `Dialog` uses `isOpen` plus lifecycle callbacks `onClose` and `onOpen` in `src/lib/components/Dialog/dialog.props.ts:29`.
- `Popover` uses `isOpen` plus lifecycle callbacks `onClose` and `onOpen` in `src/lib/components/Popover/popover.props.ts:13`.
- `ContextMenu` uses `isOpen` without an adjacent `onOpenChange` in `src/lib/components/ContextMenu/contextMenu.props.ts:24`.
- `Command` uses `isOpen` and `onOpenChange` in `src/lib/components/Command/command.props.ts:64`.
- `Collapsible` uses `open`, `defaultOpen`, and `onOpenChange` in `src/lib/components/Collapsible/collapsible.props.ts:20`.
- `Sidebar` uses `open` and `onOpenChange` in `src/lib/components/Sidebar/sidebar.props.ts:237`.

Suggestion:

Use one controlled-state convention for openable components:

```ts
open?: boolean;
defaultOpen?: boolean; // only when the component supports uncontrolled initial state
onOpenChange?: (open: boolean) => void;
```

Keep lifecycle callbacks only when they are truly different from state changes:

```ts
onOpen?: (state: ComponentState) => void;  // after transition/open side effect
onClose?: (state: ComponentState) => void; // after transition/close side effect
```

Affected components to normalize or document as exceptions:

- `Dialog`
- `Popover`
- `ContextMenu`
- `Command`
- `Collapsible`
- `Sidebar`

I think `open` is the better public prop for Svelte because it gives users `bind:open`, matching `bind:value`, `bind:checked`, and `bind:page`.

## Finding 4: Click and Pointer Callback Props Drift

Clickable primitives disagree on callback casing and callback payload.

Examples:

- `Button` exposes `onClick`, `onEnter`, and `onLeave`, but they receive `payload?: any`, not the DOM event: `src/lib/components/Button/button.props.ts:63`.
- `Button` binds pointer enter/leave and calls those handlers with `payload`: `src/lib/components/Button/Button.svelte:68`.
- `MenuOption` exposes `onClick`, `onEnter`, and `onLeave` with `MouseEvent`: `src/lib/components/MenuOption/menuOption.props.ts:38`.
- `MenuOption` binds them to `onclick`, `onpointerenter`, and `onpointerleave`: `src/lib/components/MenuOption/MenuOption.svelte:64`.
- `Chip` exposes lowercase `onenter` and `onleave`: `src/lib/components/Chip/chip.props.ts:28`.
- `Chip` destructures `onenter` / `onleave` and uses them to decide whether to render a button, but does not bind pointer handlers: `src/lib/components/Chip/Chip.svelte:12` and `src/lib/components/Chip/Chip.svelte:24`.

Suggestion:

Pick one convention per handler family:

- For primitive DOM-like components: prefer DOM event payloads.
- For data-driven items: pass domain values, but name those callbacks after the domain event (`onSelect`, `onValueChange`, etc.).
- For pointer handlers, prefer explicit names:

```ts
onPointerEnter?: (event: PointerEvent) => void;
onPointerLeave?: (event: PointerEvent) => void;
```

If shorter names are kept, normalize at least to `onEnter` / `onLeave` everywhere and avoid lowercase `onenter` / `onleave`.

Affected components:

- `Button`
- `MenuOption`
- `Chip`
- `Card` also uses `onEnter` / `onLeave`, so it should follow whichever convention is chosen for clickable primitives.

## Finding 5: Form-Control Nouns Are Not Canonical

Some form controls use different names for the same component across export path, component export, prop type, theme variable, and theme context.

Examples:

- `package.json:181` exports `./switch`, and `src/lib/components/Form/Switch/index.ts:1` exports `Switch`, but `src/lib/components/Form/Switch/index.ts:2` exports `SwitchInputProps`, and `src/lib/components/Form/Switch/switch.theme.ts:88` exports `switchInputTheme`.
- `src/lib/components/Form/RadioInput/radioInput.props.ts:14` exports `RadioInputProps`, but `src/lib/components/Form/RadioInput/radioInput.theme.ts:101` exports `radiosInputTheme`.
- `src/lib/components/Form/RadioInput/radioInput.props.ts:4` exports `RadiosOption`, while the component name is singular `RadioInput`.
- `src/lib/components/Form/CheckboxesInput/index.ts:1` exports `CheckBoxesInput`, while the package path is `./checkboxes-input` at `package.json:244`, and the first theme slot is `checkboxesInput` at `src/lib/components/Form/CheckboxesInput/checkBoxesInput.theme.ts:103`.

Suggestion:

Pick one canonical public noun per component and derive every symbol from it:

| Current area           | Suggested normal form                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `Switch` component     | `Switch`, `SwitchProps`, `switchTheme`, context `switch`                                      |
| `RadioInput` component | `RadioInput`, `RadioInputProps`, `RadioInputTheme`, context `radio-input`                     |
| Radio option type      | `RadioOption`, not `RadiosOption`                                                             |
| Checkboxes component   | `CheckboxesInput`, `CheckboxesInputProps`, `CheckboxesInputTheme`, context `checkboxes-input` |
| Checkbox option type   | `CheckboxOption`, not `CheckBoxesOption`                                                      |

The important part is not the exact noun above. The important part is one source of truth:

```txt
ComponentName -> ComponentNameProps -> componentNameTheme -> component-slug context/export path
```

## Finding 6: `Field` Size Variants Do Not Match `Sizes`

The exported shared size token is:

- `src/lib/types/theme.ts:69`: `Sizes = 'small' | 'normal' | 'large'`

But several `Field` theme parts define `medium`, not `normal`:

- `src/lib/components/Form/Field/field.ts:128` for `header`.
- `src/lib/components/Form/Field/field.ts:147` for `label`.
- `src/lib/components/Form/Field/field.ts:166` for `actions`.
- `src/lib/components/Form/Field/field.ts:177` for `errorsContainer`.
- `src/lib/components/Form/Field/field.ts:188` for `error`.

Other `Field` theme parts use `normal` correctly:

- `src/lib/components/Form/Field/field.ts:199` for `inputContainer`.
- `src/lib/components/Form/Field/field.ts:214` for `prefix`.
- `src/lib/components/Form/Field/field.ts:224` for `suffix`.
- `src/lib/components/Form/Field/field.ts:235` for `footer`.
- `src/lib/components/Form/Field/field.ts:245` for `description`.
- `src/lib/components/Form/Field/field.ts:255` for `helper`.

`Field.svelte` passes the same `size` prop into all of these slots: `src/lib/components/Form/Field/Field.svelte:50` through `src/lib/components/Form/Field/Field.svelte:84`.

Suggestion:

Normalize `medium` to `normal` in `Field` theme variants.

Then make size maps type-checked where possible:

```ts
const fieldHeaderSize = {
	small: 'gap-1',
	normal: 'gap-2',
	large: 'gap-3'
} satisfies Record<Sizes, string>;
```

This catches future `medium` / `normal` drift at compile time.

## Pattern Worth Codifying

There is an emerging useful pattern for slot-level class escape hatches:

- `FileInput` aligns snippets and class props: `fileList` / `fileListClass`, `file` / `fileClass`, `placeholderClass` in `src/lib/components/Form/File/fileInput.props.ts:31`.
- `PageShell` aligns theme slots and class props: `headerClass`, `contentClass`, `contentInnerClass`, `footerClass` in `src/lib/components/PageShell/pageShell.props.ts:98`.
- `Tree` aligns root and host class props: `class` and `hostClass` in `src/lib/components/Tree/tree.props.ts:30`.
- `Marquee` aligns `inner` theme slot and `innerClass` prop in `src/lib/components/Marquee/marquee.props.ts:43`.

Suggestion:

Make this explicit in the component authoring convention:

```txt
theme.<slotName>     // theme override for a structural part
<slotName>           // snippet/content override, when applicable
<slotName>Class      // class escape hatch for that same structural part
class                // always root class only
```

This rule would make future component APIs predictable without forcing every component to expose every slot as a prop.

## Finding 7: Slot Class Plumbing Is Not Uniform

The proposed `theme.<slotName>` / `<slotName>` / `<slotName>Class` convention only holds if named slots are either:

- rendered through `<Slot ... class={classes.<slotName>(...)} />`, or
- rendered inside a wrapper that clearly owns `theme.<slotName>`.

The primitive makes this important, and useful: `Slot.svelte` renders raw snippets when no `class` is passed, and wraps/applies `class`, `as`, `attrs`, `style`, and attachments when `className` is present at `src/lib/components/Slot/Slot.svelte:35`.

Good existing patterns:

- `Field` applies classes to named slots like `header`, `label`, `actions`, `prefix`, `suffix`, `footer`, and `error`: `src/lib/components/Form/Field/Field.svelte:48`.
- `Form` wraps `header` through `classes.formHeader()` and title/description through their own classes: `src/lib/components/Form/Form/Form.svelte:51`.
- `PDFViewer` applies classes to `toolbar` and `error` slots: `src/lib/components/PDFViewer/PDFViewer.svelte:297` and `src/lib/components/PDFViewer/PDFViewer.svelte:459`.
- `PageShellFooter` wraps the custom `footer` region in `classes.footerContent()`: `src/lib/components/PageShell/PageShellFooter.svelte:20`.
- `Empty.content`, `Accordion.content`, `Collapsible.children`, `Pagination.pageItem`, `Breadcrumbs.item.label`, and `Table.cell.content` render raw slot content inside a themed parent. That is coherent if the parent element is the themed structural part.

Gaps or ambiguous cases:

- `Code.header` bypasses `classes.header()` when a custom header is provided: `src/lib/components/Code/Code.svelte:88`. The default header uses `classes.header()` at `src/lib/components/Code/Code.svelte:94`, so custom and default headers do not share the same structural class contract.
- `PageShell.title` and `PageShell.subtitle` apply `classes.title()` / `classes.subtitle()` only for string values. Snippet values render raw at `src/lib/components/PageShell/PageShellHeader.svelte:80` and `src/lib/components/PageShell/PageShellHeader.svelte:85`.
- `MultiStepForm.header` renders through `<Slot render={header}>` with no class, while `footer` has `classes.multiStepFormFooter()`: `src/lib/components/Form/MultiStepForm/MultiStepForm.svelte:63`. The theme also has `multiStepFormFooter` but no header slot at `src/lib/components/Form/MultiStepForm/multiStepForm.theme.ts:26`.
- `Menu.header` and `Menu.footer` are public snippet props at `src/lib/components/Menu/menu.props.ts:60`, but render raw at `src/lib/components/Menu/Menu.svelte:79` and `src/lib/components/Menu/Menu.svelte:152`. `menuTheme` only exposes the root `menu` slot, so these slots have no theme/class counterpart.
- `Command.trigger` is declared together with `empty` and `footer` in `WithSlot` at `src/lib/components/Command/command.props.ts:128`, but only `empty` and `footer` get classes. `trigger` renders raw at `src/lib/components/Command/Command.svelte:235`. This may be fine if `trigger` is a full trigger override, but then it should be documented/named as such.

Suggestion:

Use `Slot` itself as the normalization layer. For part-level slots, prefer this shape:

```svelte
<Slot
	as="header"
	render={header}
	class={classes.header({ size })}
	attrs={{ 'data-slot': 'component-header' }}
/>
```

That gives the consumer a custom snippet while preserving the library-owned structural element and class contract. It also means `<slotName>Class` can be merged at exactly one place:

```svelte
<Slot render={header} class={classes.header({ size, class: headerClass })} />
```

Make slot categories explicit:

```txt
children/content data slots
  Raw content is allowed when the surrounding element owns the structure/class.

part slots
  Must be rendered with <Slot class={classes.<slotName>(...)} />.
  Use Slot's as/attrs/style support to customize the wrapper element.
  Optional class escape hatch: <slotName>Class.

full replacement slots
  May render raw, but should be named/documented as replacing the whole part.
  Examples: renderHeader, headerOverride, trigger, item.
```

Then normalize the ambiguous cases:

- Render `Code.header` through `<Slot class={classes.header()} />`, or rename/document it as a full header replacement.
- Render `PageShell.title` and `PageShell.subtitle` snippets through `Slot` with the same classes as string values, or split into `title` text and `header` full override.
- Add `multiStepFormHeader` / `header` to `MultiStepFormTheme` and pass it to `<Slot class={classes.multiStepFormHeader(...)} />`, or mark `header` as a full raw override.
- Add `menu.header` / `menu.footer` theme slots plus `headerClass` / `footerClass`, rendered through `Slot`, or rename these props to signal raw before/after content.
- Document `Command.trigger` as a full trigger override, or add a `trigger` theme slot and render it through `Slot`.

## Suggested Normalization Order

1. Fix `Field` size token drift first. It is local, concrete, and affects all field-based inputs.
2. Normalize `Chip` callback casing and pointer binding. It is a small public API correction with an implementation symptom.
3. Decide the root theme slot convention and apply it with aliases.
4. Decide `open` vs `isOpen`, then migrate overlays/disclosures.
5. Normalize form-control nouns before adding more inputs.
6. Define the slot categories (`content`, `part`, `full replacement`) before adding `<slotName>Class` props.
7. Normalize theme context IDs with a compatibility plan.
