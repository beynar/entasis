import type { RichTextInputThemeProps } from '../RichTextInput/richTextInput.theme.js';

// Composer chrome around the editor. Inline tokens carry `data-ai-token="<kind>"`, so each kind
// gets its own tint here without reaching into the editor's token node: commands read as
// actions (primary), mentions as people (info), skills as tools (success); files and references
// keep the neutral pill. On a narrow composer or a touch screen the text steps up to 16px, which
// also stops iOS Safari from zooming the page when the editor takes focus.
const touchText = '@max-md:text-base pointer-coarse:text-base';
const tokenTints = [
	'[&_[data-ai-token=command]]:border-primary-muted [&_[data-ai-token=command]]:bg-primary-muted [&_[data-ai-token=command]]:text-primary-muted-readable',
	'[&_[data-ai-token=mention]]:border-info-muted [&_[data-ai-token=mention]]:bg-info-muted [&_[data-ai-token=mention]]:text-info-muted-readable',
	'[&_[data-ai-token=skill]]:border-success-muted [&_[data-ai-token=skill]]:bg-success-muted [&_[data-ai-token=skill]]:text-success-muted-readable'
].join(' ');

export const aiComposerEditorTheme = {
	scrollArea: { base: '!min-h-0' },
	editorShell: { base: 'px-sm py-0' },
	editor: { base: `!min-h-row-md ${touchText} ${tokenTints}` },
	placeholder: { base: `left-2 top-0 ${touchText}` }
} satisfies RichTextInputThemeProps;
