# Migrating to svelai 0.3

Version 0.3 is a breaking release. The renamed APIs below have no forwarding aliases. The package
remains `svelai`, with public subpath imports and an MIT license.

## Controlled and uncontrolled state

Editable or selected state uses `value`, `defaultValue`, and `onValueChange`. Disclosure state uses
`open`, `defaultOpen`, and `onOpenChange`. Bindable props accept parent updates without echoing a
change callback. A library-originated transition emits once; selecting the current value emits
nothing. Defaults are read once and do not reset later edits when parent props change.

Controlled input:

```svelte
<script lang="ts">
	import { TextInput } from 'svelai/text-input';
	let name = $state<string | null>('Ada');
	let edits = $state(0);
</script>

<TextInput bind:value={name} label="Name" onValueChange={() => (edits += 1)} />
<p>{name}: {edits} edits</p>
```

Uncontrolled input:

```svelte
<script lang="ts">
	import { TextInput } from 'svelai/text-input';
	let lastName = $state<string | null>('Ada');
</script>

<TextInput defaultValue="Ada" label="Name" onValueChange={(value) => (lastName = value)} />
<p>{lastName}</p>
```

`onAfterOpen` and `onAfterClose` run after the corresponding transition. They do not replace the
state-change callback. For example, a parent can bind `Dialog.open` while `onAfterClose` restores
focus after the dialog leaves the screen.

| Previous state API                                                                                            | 0.3 API                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Input, Calendar, DateSelector, ColorPicker, Slider, PinInput, TagsInput, KeyValueInput, VoiceInput `onChange` | `onValueChange`                                                                          |
| Checkbox and radio value callbacks called `onClick`                                                           | `onValueChange`; native clicks use `inputAttrs.onclick`                                  |
| Tabs, Tabbar, SegmentedControl, ToggleButton, ToggleButtonGroup, ToggleMenu `onChange`                        | `onValueChange`                                                                          |
| Command search state / `onSearchChange`                                                                       | `value`, `defaultValue`, `onValueChange`                                                 |
| AIAskUserQuestion `values` / `onValuesChange` or `onChange`                                                   | `value`, `defaultValue`, `onValueChange(answerMap)`                                      |
| AIComposer `queuedMessages` / `onQueuedMessagesChange`                                                        | `queue` / `onQueueChange`                                                                |
| AIComposer `fileAccept`, `fileMaxFiles`, `fileMaxSize`                                                        | `accept` (string array), `maxFiles`, `maxFileSize`                                       |
| AIComposer `onSubmitMessage({ value, event, meta })`                                                          | `onSubmit(detail)`; the detail contains `markdown`, `event`, and the submission metadata |

Form, MultiStepForm, AIComposer, AIModelSelector, AITool, AISuggestion, and Accordion also expose the
appropriate value trio. DateSelector, Command, Sidebar, the overlay components, media-volume
popover, and model selector expose the open trio. Read-only values such as progress percentages,
QR content, and rating displays are not editable-state contracts.

## Native events and domain actions

Native handlers use lowercase Svelte 5 names and receive the original DOM event. This includes
`onclick`, `onpointerenter`, `onpointerleave`, `oninput`, and `onscroll`. Button no longer accepts a
`payload` prop. Close over application data when handling a button event.

| Previous API                                                                              | 0.3 API                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Button, Card, Chip, Breadcrumbs, Menu, Sidebar and other native `onClick` handlers        | `onclick(event)`                                                                        |
| `onEnter` / `onLeave`                                                                     | `onpointerenter(event)` / `onpointerleave(event)`                                       |
| Form action `onClick(form)`                                                               | `onAction(form)`; `onclick` remains a native event                                      |
| Form `submitButton`                                                                       | `actions` with `onAction: (form) => form.submit()`                                      |
| Dialog, Popover, HoverCard, LinkPreview, SelectionMenu and ImageZoom `onOpen` / `onClose` | `onAfterOpen` / `onAfterClose`                                                          |
| FloatingWindow `onClose`                                                                  | `onAfterClose`; use `onOpenChange` for disclosure state                                 |
| Toast `onOpen`                                                                            | `onAfterOpen`                                                                           |
| Rating `onStarClick` / `onStarPointerMove`                                                | `onclick` / `onpointermove` on each star; the original element is `event.currentTarget` |
| Stepper indicator `onIndicatorClick`                                                      | Native `onclick`                                                                        |
| AIThread and AIChat `onSuggestionClick`                                                   | `onSuggestionSelect`                                                                    |
| MediaVolume trigger or toggle snippet `onClick()`                                         | `activate()`                                                                            |
| Map `onmarkerclick`, `onclusterclick`, `onmapready`                                       | `onMarkerClick`, `onClusterClick`, `onReady`                                            |
| Map `onviewchange`, `onmoveend`, `onzoomend`, `onerror`                                   | `onViewChange`, `onMoveEnd`, `onZoomEnd`, `onError`                                     |

Domain actions that require several values receive one payload object:

| Callback                                                                   | 0.3 payload                                                                   |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Combobox `onValueChange`                                                   | `{ value, option }`                                                           |
| AIModelSelector `onValueChange`                                            | `{ value, model }`                                                            |
| Stepper `onValueChange`                                                    | `{ value, item }`, where `value` is the step index                            |
| MultiStepForm `onSubmitStep`                                               | `{ value, step, index }`                                                      |
| SortableList `onReorder`                                                   | `{ items, from, to, item }`                                                   |
| Resizable `onLayoutChanged` → `onLayoutCommit`                             | `{ sizes, isUserInteraction }`                                                |
| Sidebar `onWidthChanged`                                                   | `{ width, isUserInteraction }`                                                |
| FloatingWindow `onMove` / `onResize`                                       | `{ position, window }` / `{ dimensions, window }`                             |
| AudioPlayer and VideoPlayer `onError`                                      | `{ error, snapshot }`                                                         |
| ImageGallery `onIndexChange`                                               | `{ index, gallery }`                                                          |
| ImageGallery and ImageZoom `onOpenChange`                                  | The boolean only; lifecycle callbacks carry the component snapshot            |
| RichTextInput trigger `onSelect`                                           | `{ item, context }`                                                           |
| AIComposer trigger `onSelect`                                              | `{ item, context }`                                                           |
| AIComposer `onMentionSearch`                                               | `{ query, type }`                                                             |
| AIComposer queue add, cancel, edit-start, edit-cancel, and steer callbacks | `{ message, index }`                                                          |
| AIComposer queue edit-commit                                               | `{ message, index, previousMessage }`                                         |
| Tree `onDropError`                                                         | `{ error, event }`; callbacks inside raw `options` keep the upstream contract |
| AIMcpApp host request callbacks                                            | `{ params, tool, extra }`                                                     |
| AIMcpApp host `onLog` / `onError`                                          | `{ params, tool }` / `{ error, tool }`                                        |
| AIMcpApp `resolveResource`                                                 | `{ uri, client, tool, signal }`                                               |
| AIMcpApp `resolveSandboxUrl`                                               | `{ resource, tool, signal }`                                                  |

RichTextInput `onValueChange` supplies `{ markdown, tokens, isEmpty }`. Initialization, parent
Markdown replacement, and no-op clears do not emit it.

EventCalendar keeps its explicit domain event names. `onItemsChange`, `onItemClick`,
`onItemDoubleClick`, `onSlotClick`, `onSlotSelect`, and `onMoreClick` now take their exported
`EventCalendar*Payload` object instead of positional arguments.

Gantt collection callbacks are now `tasks.onTasksChange`, `dependencies.onDependenciesChange`, and
`assignments.onAssignmentsChange`; each receives its exported change object. In `events`, prefix
`selectionChange`, `expansionChange`, `zoomChange`, `visibleRangeChange`, `taskClick`,
`taskDoubleClick`, `dependencyClick`, `emptyRangeSelect`, `interactionBlocked`, and
`scheduleViolations` with `on` and capitalize the first letter. Task/dependency clicks and schedule
violations use their exported payload objects.

## Native attribute ownership

Move attributes to the element that implements the control:

- `inputAttrs` applies to an underlying `input`.
- `textareaAttrs` applies to an underlying `textarea`.
- `Select.triggerAttrs` applies to its combobox button.
- Other `*Attrs` properties identify their specific native control; use their exported types.
- `fieldAttrs` applies to the Field wrapper.

Native input handlers are composed with the library's state updates and receive the original
event. Library-owned IDs, disabled state, and accessibility relationships stay with the control.
Disabled anchors have no active destination and cannot activate by pointer or keyboard.

The unused `PhoneInput.separator` and `Accordion.actions` props were removed. They had no rendering
behavior. Use the supported formatting or content slots at those owners.

## Field and custom controls

`Field`, `createFieldState`, `FieldState`, and `fieldSchemas` are public through `svelai/field`.
A field controller exposes `value`, `setValue`, validation and errors, control/label/error IDs,
`controlAttrs`, the control attachment, disabled/required state, size, and density.

Use a Form entry with `type: 'field'` for a custom value-bearing control. Set `fieldType` to the
existing field schema and supply its `snippet`. That snippet receives the registered field
controller. The value participates in inference, validation, submission, and `bind:value`.
`type: 'custom'` remains display-only.

Form stays a programmatic state and validation component rendered with a `div`. Field and Form
remain the validation owners; a custom control must call `field.setValue` instead of implementing
a separate validation path. Explicit `null` values remain distinct from missing values.

## Geometry, density, and theme ownership

Semantic component geometry uses `size: 'small' | 'normal' | 'large'`. Internal whitespace uses the
same vocabulary through `density`, independently of size. Color props select semantic palette
roles. Native color data, chart encodings, and other domain values keep their documented types.

| Previous API                                       | 0.3 API                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| `Separator.size`                                   | `Separator.thickness`                               |
| `NetworkIndicator.size`                            | `NetworkIndicator.height`                           |
| `DataTableColumn.size`, `minSize`, `maxSize`       | `width`, `minWidth`, `maxWidth`                     |
| Numeric `ProgressCircle.size`                      | `diameter`; semantic `size` remains available       |
| `QRCode.DownloadOptions.size`                      | `dimension`                                         |
| `QRCode.dataModulesSettings.size`                  | `scale`                                             |
| `ChartBandAnnotation.size`                         | `thickness`                                         |
| Sidebar item size `default`, `sm`, `lg`            | `normal`, `small`, `large`                          |
| Sidebar subitem size `sm`, `md`                    | `small`, `normal`                                   |
| Tree density `compact`, `default`, `relaxed`       | `small`, `normal`, `large`                          |
| Numeric Tree density                               | `options.density` at the raw adapter boundary       |
| Field header/input-container theme `size` variants | `density` variants; label typography retains `size` |

File byte counts, chart size channels, globe marker magnitude, and resizable panel shares keep
`size` because it names domain data. The API check records explicit numeric-size justifications.

Component CVAs live in `<owner>.theme.ts`. Reusable consumer presets live in
`<consumer>.<role>.theme.ts`, including the VideoPlayer slider/settings-menu and MediaVolume slider
presets. Geometry maps use `<owner>.geometry.ts`; RichTextInput's Lexical adapter uses
`editor.lexicalTheme.ts`. Re-run the semantic-theme check when moving or changing these files.

## Public entrypoints and verification

Import from documented `svelai/<subpath>` entrypoints. `Slot` is public through `svelai/slot`;
`GridSpan` is exported by `svelai/grid`. Icons are snippets imported by name from
`svelai/icons/<name>`, not a generic `Icon` component.

Use `svelai/tailwind-plugin` for the shared Tailwind utilities and
`svelai/tailwind-plugin/theme` for named color themes. Install the optional Tailwind 4 peer when
using either plugin. Source-tree plugin paths are not consumer entrypoints.

The public manifest owns exports, typesVersions, source aliases, documentation navigation, MCP
registration, related components, and both agent inventories. Run `npm run generate:component-contract`
after editing the manifest; never edit its outputs by hand.

Validate with the manifest, API, and semantic-theme checks, `npm run check`, `npm run lint`, unit
and browser tests, and `npm run build`. `npm run check:packed-library` installs the produced tarball
in an isolated consumer and checks every declared symbol and icon module, the license, and the
Tailwind runtime. `npm run check:package-consumer` checks the workflow examples separately.
