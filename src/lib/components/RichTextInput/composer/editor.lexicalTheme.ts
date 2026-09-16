export const RICH_TEXT_INPUT_LEXICAL_THEME = {
	heading: {
		h1: 'text-xl font-semibold leading-snug',
		h2: 'text-lg font-semibold leading-snug',
		h3: 'text-base font-semibold leading-snug'
	},
	link: 'text-primary-readable underline underline-offset-2',
	list: {
		listitem: 'my-xs',
		nested: {
			listitem: 'list-none'
		},
		ol: 'list-decimal pl-layout-sm',
		ul: 'list-disc pl-layout-sm'
	},
	paragraph: 'm-0',
	quote: 'border-neutral-muted text-neutral/70 border-l-2 pl-lg',
	text: {
		bold: 'font-semibold',
		code: 'bg-surface-canvas rounded-sm px-xs py-micro font-mono text-[0.9em]',
		highlight: 'bg-primary/15 rounded-sm px-micro',
		italic: 'italic',
		strikethrough: 'line-through'
	}
};
