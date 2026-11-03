export const diffDescription = `
# Diff Component

Renders rich, syntax-highlighted code diffs — split (side-by-side) or unified
(inline) — for one or more files. Diff parsing, layout, and highlighting are
delegated to the \`@pierre/diffs\` engine. The diff shares the Code component's
CSS-variable syntax palette, so colors adapt to light and dark automatically from
the design tokens.

The diff renders **client-side** by default: the component mounts the underlying
\`FileDiff\` instances inside an attachment and tears them down on cleanup. It compiles
without Svelte's \`experimental.async\`. To show it in the server HTML, render it ahead of
time with \`preloadDiff()\` in a \`load\` function and pass the result as \`preloaded\`.

## Basic Usage

Diff two raw files with a \`[oldFile, newFile]\` tuple:

\`\`\`svelte
<Diff
  files={[
    { name: 'greet.ts', contents: 'export const greet = () => "hi";' },
    { name: 'greet.ts', contents: 'export const greet = () => "hello";' }
  ]}
/>
\`\`\`

Or render a unified patch string (can contain multiple files):

\`\`\`svelte
<Diff patch={unifiedPatchString} />
\`\`\`

\`patch\` and \`files\` are mutually exclusive — passing both surfaces an error.

## Props

### Content Props
- **patch**: string - Unified diff/patch content (may cover multiple files). Mutually exclusive with \`files\`.
- **files**: [FileContents, FileContents] - Tuple of \`[oldFile, newFile]\` raw contents. Each \`FileContents\` is \`{ name, contents, cacheKey? }\`. Mutually exclusive with \`patch\`.

### Layout Props
- **diffStyle**: 'split' | 'unified' (default: 'split') - Side-by-side vs inline.
- **responsive**: boolean (default: true) - A split diff narrower than 36rem (a phone, a side panel) shows unified, since two columns of code no longer fit; the root then carries \`data-narrow\`. \`false\` keeps it split at any width.
- **lineNumbers**: boolean (default: true) - Show the line-number gutter.
- **wrapping**: boolean (default: false) - Wrap long lines instead of horizontal scrolling.
- **backgrounds**: boolean (default: true) - Show the tinted added/removed line backgrounds.
- **hunkSeparators**: 'simple' | 'metadata' | 'line-info' | 'line-info-basic' (default: 'line-info') - Style of the hunk separators.
- **lineDiffType**: 'word-alt' | 'word' | 'char' | 'none' - Intra-line diff granularity.
- **diffIndicators**: 'classic' | 'bars' | 'none' - Gutter change indicators.

### Annotation Props
- **lineAnnotations**: DiffLineAnnotation[] - Diff-side annotations. Each is \`{ side: 'deletions' | 'additions', lineNumber }\` (use \`lineNumber: 0\` for a file-level annotation).
- **renderAnnotation**: Snippet<[DiffLineAnnotation]> - Snippet used to render each annotation's content.
- **renderAnnotationClass**: string - Classes merged onto the annotation snippet host element.

### Selection Props
- **selection**: SelectedLineRange | null (bindable) - Controlled selected line range (\`{ start, end, side?, endSide? }\`). Use \`null\` to clear.
- **defaultSelection**: SelectedLineRange | null - Initial selected line range when \`selection\` is omitted.
- **onSelectionChange**: (payload: SelectedLineRange | null) => void - Fires once for each diff-driven selection change. Line selection is a selection model, so it uses the \`onSelectionChange\` state family, not \`onSelect\`.

### Advanced Props
- **options**: FileDiffOptions - Escape hatch forwarded to each \`@pierre/diffs\` \`FileDiff\`. The ergonomic props above win over matching fields.
- **preloaded**: DiffPreload - The diff rendered on the server by \`preloadDiff()\`, shown before hydration (see Server preview).
- **fileClass**: string - Extra classes for each per-file wrapper.
- **class**: string - Extra classes for the root element.
- **theme**: DiffThemeProps - Overrides for the \`diff\` (root), \`file\` (per-file wrapper), and \`error\` parts.

## Examples

### Split vs unified

\`\`\`svelte
<Diff files={files} diffStyle="split" />
<Diff files={files} diffStyle="unified" />
\`\`\`

### With line annotations

\`\`\`svelte
<Diff
  {files}
  lineAnnotations={[{ side: 'additions', lineNumber: 2 }]}
>
  {#snippet renderAnnotation(annotation)}
    <span class="text-info">Note on line {annotation.lineNumber}</span>
  {/snippet}
</Diff>
\`\`\`

### Controlled selection

\`\`\`svelte
<script>
  let selection = $state(null);
</script>

<Diff {files} bind:selection onSelectionChange={(r) => console.log(r)} />
\`\`\`

## Structure

\`\`\`
div[data-slot="diff"]           ← root (theme.diff)
├── div[role="alert"]           ← error surface, only when parsing/render fails (theme.error)
└── div (mount container)       ← @pierre/diffs FileDiff instances mount here
    └── div[data-diff-file]     ← one per file (theme.file / fileClass)
\`\`\`

## Notes

- Without \`preloaded\`, the server renders the empty mount container and the diff fills in on mount.

## Server preview

\`preloadDiff({ patch | files, ...displayProps })\` renders each file to HTML on the server; the
\`<Diff>\` writes it as declarative shadow DOM, so the diff is visible before hydration, then the
client takes it over in place. Pass the same content and display props to both.

\`\`\`ts
// +page.server.ts
import { preloadDiff } from 'entasis/diff';

export const load = async () => {
  const patch = await readPatch();
  return { patch, preloaded: await preloadDiff({ patch, diffStyle: 'split' }) };
};

async function readPatch() {
  return 'diff --git a/a.ts b/a.ts';
}
\`\`\`

\`\`\`svelte
<script lang="ts">
  import { Diff, type DiffPreload } from 'entasis/diff';

  let { data }: { data: { patch: string; preloaded: DiffPreload } } = $props();
</script>

<Diff patch={data.patch} diffStyle="split" preloaded={data.preloaded} />
\`\`\`
- Colors come from the shared Code syntax theme — the component renders \`<CodeTheme />\` so the \`--code-token-*\` variables exist wherever \`Diff\` is used, and light/dark adaptation is automatic.
- Invalid input (both \`patch\` and \`files\`, an empty patch, or unparseable content) is caught and shown in the error surface instead of throwing.
- Each file's code column scrolls horizontally inside the \`@pierre/diffs\` shadow root; while it overflows the component names it as a \`role="region"\` and gives it a tab stop, so long lines are reachable from the keyboard.
`;
