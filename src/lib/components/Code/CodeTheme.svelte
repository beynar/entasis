<!--
	Defines every `--code-token-*` CSS variable in terms of our `--color-*` design
	tokens and maps the highlighter's `th-*` token classes onto them. Because the
	design tokens already switch per theme, the light block covers both modes for
	hues that read well in both; the dark override block only re-tunes the few
	roles that need a lighter treatment on the dark surface (notably `tag`, whose
	dark `--color-danger` is very dark).

	The Diff component's Shiki theme (`Diff/diff.syntax-theme.ts`) references the
	same variables, so diffs and code blocks share one palette.

	All selectors are `:global` so the styles reach the `{@html}` highlighter output.
	Mounting this component multiple times is harmless — the declarations are
	idempotent.
-->
<style>
	:global(:root) {
		--code-token-surface: var(--color-surface);
		--code-token-plain: var(--color-neutral);
		--code-token-comment: color-mix(in oklab, var(--color-neutral) 58%, var(--code-token-surface));
		--code-token-punctuation: color-mix(
			in oklab,
			var(--color-neutral) 72%,
			var(--code-token-surface)
		);
		--code-token-keyword: var(--color-primary-readable);
		--code-token-string: var(--color-success-readable);
		--code-token-number: var(--color-warning-readable);
		--code-token-constant: var(--color-warning-readable);
		--code-token-function: var(--color-info-readable);
		--code-token-variable: color-mix(in oklab, var(--color-neutral) 88%, var(--color-info));
		--code-token-property: color-mix(in oklab, var(--color-info) 60%, var(--color-neutral));
		--code-token-tag: var(--color-danger-readable);
		--code-token-regex: var(--color-success-readable);
		--code-token-escape: var(--color-warning-readable);
		--code-token-error: var(--color-danger-readable);
		--code-token-inserted: var(--color-success-readable);
		--code-token-deleted: var(--color-danger-readable);
		--code-token-changed: var(--color-warning-readable);
		--code-token-inserted-surface: color-mix(in oklab, var(--color-success) 14%, transparent);
		--code-token-deleted-surface: color-mix(in oklab, var(--color-danger) 14%, transparent);
		--code-token-changed-surface: color-mix(in oklab, var(--color-warning) 14%, transparent);
	}

	:global(html[data-theme='dark']),
	:global(.dark) {
		/* Dark `--color-danger` (#7f1d1d) is too dark to read as syntax; lift it. */
		--code-token-tag: color-mix(in oklab, var(--color-danger-light) 70%, var(--color-neutral));
		--code-token-deleted: color-mix(in oklab, var(--color-danger-light) 70%, var(--color-neutral));
		--code-token-error: color-mix(in oklab, var(--color-danger-light) 70%, var(--color-neutral));
		/* Keep property distinct from function against the darker surface. */
		--code-token-property: color-mix(in oklab, var(--color-info) 70%, var(--color-neutral));
	}

	/* The pre stays transparent so the container background shows through. */
	:global([data-slot='code'] pre.th-code) {
		margin: 0;
		background-color: transparent;
		color: var(--code-token-plain);
	}

	/* Token classes emitted by TanStack Highlight (`th-token th-<role>`), mapped to our roles. */
	:global([data-slot='code'] .th-token) {
		color: var(--code-token-plain);
	}
	:global([data-slot='code'] .th-keyword) {
		color: var(--code-token-keyword);
	}
	:global([data-slot='code'] .th-heading) {
		color: var(--code-token-keyword);
		font-weight: 600;
	}
	:global([data-slot='code'] .th-string),
	:global([data-slot='code'] .th-code-inline) {
		color: var(--code-token-string);
	}
	:global([data-slot='code'] .th-number) {
		color: var(--code-token-number);
	}
	:global([data-slot='code'] .th-literal) {
		color: var(--code-token-constant);
	}
	:global([data-slot='code'] .th-comment) {
		color: var(--code-token-comment);
		font-style: italic;
	}
	:global([data-slot='code'] .th-meta) {
		color: var(--code-token-comment);
	}
	:global([data-slot='code'] .th-function),
	:global([data-slot='code'] .th-command),
	:global([data-slot='code'] .th-type) {
		color: var(--code-token-function);
	}
	:global([data-slot='code'] .th-variable) {
		color: var(--code-token-variable);
	}
	:global([data-slot='code'] .th-property),
	:global([data-slot='code'] .th-attr) {
		color: var(--code-token-property);
	}
	:global([data-slot='code'] .th-tag),
	:global([data-slot='code'] .th-selector) {
		color: var(--code-token-tag);
	}
	:global([data-slot='code'] .th-operator) {
		color: var(--code-token-punctuation);
	}
	:global([data-slot='code'] .th-link) {
		color: var(--code-token-regex);
		text-decoration: underline;
	}
	:global([data-slot='code'] .th-inserted) {
		color: var(--code-token-inserted);
		background-color: var(--code-token-inserted-surface);
	}
	:global([data-slot='code'] .th-deleted) {
		color: var(--code-token-deleted);
		background-color: var(--code-token-deleted-surface);
	}

	/* Smooth the color transition when the theme flips, unless Theme has flagged
	   reduced motion on <html> (OS setting or `reduceMotion` prop). */
	:global(html:not([data-svelai-reduce-motion]) [data-slot='code'] .th-code span) {
		transition: color 160ms ease;
	}

	/* Line-number gutter — the highlighter wraps every line in `.th-line` carrying
	   its one-based number in `data-line`, so the gutter is a pseudo-element reading
	   that attribute and stays in sync regardless of wrapping. */
	:global([data-slot='code'] .th-code--line-numbers .th-line) {
		display: block;
	}

	/* Reserve the gutter on every visual row when a numbered line wraps. The
	   negative margin pulls the number into that reserved space on row one. */
	:global([data-slot='code'] .th-code--line-numbers[data-wrap] .th-line) {
		padding-left: 4rem;
	}

	:global([data-slot='code'] .th-code--line-numbers[data-wrap] .th-line)::before {
		margin-left: -4rem;
	}

	/* `sticky; left: 0` pins the gutter to the left edge so it stays visible while a long
	   line scrolls horizontally under it; the background strip masks the code sliding behind. */
	:global([data-slot='code'] .th-code--line-numbers .th-line)::before {
		content: attr(data-line);
		position: sticky;
		left: 0;
		display: inline-block;
		width: 3rem;
		padding-right: 1rem;
		margin-right: 1rem;
		text-align: right;
		color: var(--code-token-comment);
		background-color: var(--code-token-surface);
		user-select: none;
		-webkit-user-select: none;
	}
</style>
