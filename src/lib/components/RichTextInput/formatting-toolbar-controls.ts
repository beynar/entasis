import { codeIcon } from '../Icons/code.js';
import { highlighterIcon } from '../Icons/highlighter.js';
import { linkIcon } from '../Icons/link.js';
import { listBulletsIcon } from '../Icons/listBullets.js';
import { listNumbersIcon } from '../Icons/listNumbers.js';
import { paragraphIcon } from '../Icons/paragraph.js';
import { quotesIcon } from '../Icons/quotes.js';
import { textBIcon } from '../Icons/textB.js';
import { textHOneIcon } from '../Icons/textHOne.js';
import { textHThreeIcon } from '../Icons/textHThree.js';
import { textHTwoIcon } from '../Icons/textHTwo.js';
import { textItalicIcon } from '../Icons/textItalic.js';
import { textStrikethroughIcon } from '../Icons/textStrikethrough.js';
import type { RichTextInputFormat } from './richTextInput.props.js';
import type { Messages } from '$lib/i18n/en.js';
import type {
	AIComposerSelectionBlockType,
	AIComposerSelectionFormat,
	AIComposerSelectionFormats,
	AIComposerSelectionListType
} from './composer/selection-formatting.js';

export type RichTextInputToolbarButtonConfig = {
	id: string;
	label: string;
	icon: typeof textBIcon;
	active: boolean;
	shortcut?: string;
	onSelect: () => void;
};

type HasFormat = (format: RichTextInputFormat) => boolean;

export function getRichTextInputBlockControls(options: {
	hasFormat: HasFormat;
	blockType: AIComposerSelectionBlockType;
	onBlock: (blockType: AIComposerSelectionBlockType) => void;
	messages: Messages;
}): RichTextInputToolbarButtonConfig[] {
	const { hasFormat, blockType, onBlock, messages } = options;
	return [
		{
			id: 'paragraph',
			label: messages.richTextParagraph,
			icon: paragraphIcon,
			active: blockType === 'paragraph',
			onSelect: () => onBlock('paragraph')
		},
		...optionalControl(hasFormat('heading1'), {
			id: 'heading1',
			label: messages.richTextHeading(1),
			icon: textHOneIcon,
			active: blockType === 'heading1',
			onSelect: () => onBlock('heading1')
		}),
		...optionalControl(hasFormat('heading2'), {
			id: 'heading2',
			label: messages.richTextHeading(2),
			icon: textHTwoIcon,
			active: blockType === 'heading2',
			onSelect: () => onBlock('heading2')
		}),
		...optionalControl(hasFormat('heading3'), {
			id: 'heading3',
			label: messages.richTextHeading(3),
			icon: textHThreeIcon,
			active: blockType === 'heading3',
			onSelect: () => onBlock('heading3')
		}),
		...optionalControl(hasFormat('quote'), {
			id: 'quote',
			label: messages.richTextBlockQuote,
			icon: quotesIcon,
			active: blockType === 'quote',
			onSelect: () => onBlock('quote')
		})
	];
}

export function getRichTextInputInlineControls(options: {
	hasFormat: HasFormat;
	formats: AIComposerSelectionFormats;
	hasActiveLink: boolean;
	onFormat: (format: AIComposerSelectionFormat) => void;
	onLink: () => void;
	messages: Messages;
}): RichTextInputToolbarButtonConfig[] {
	const { hasFormat, formats, hasActiveLink, onFormat, onLink, messages } = options;
	return [
		...optionalControl(hasFormat('bold'), {
			id: 'bold',
			label: messages.richTextBold,
			icon: textBIcon,
			active: formats.bold,
			shortcut: 'Mod+B',
			onSelect: () => onFormat('bold')
		}),
		...optionalControl(hasFormat('italic'), {
			id: 'italic',
			label: messages.richTextItalic,
			icon: textItalicIcon,
			active: formats.italic,
			shortcut: 'Mod+I',
			onSelect: () => onFormat('italic')
		}),
		...optionalControl(hasFormat('code'), {
			id: 'code',
			label: messages.richTextInlineCode,
			icon: codeIcon,
			active: formats.code,
			onSelect: () => onFormat('code')
		}),
		...optionalControl(hasFormat('strikethrough'), {
			id: 'strikethrough',
			label: messages.richTextStrikethrough,
			icon: textStrikethroughIcon,
			active: formats.strikethrough,
			onSelect: () => onFormat('strikethrough')
		}),
		...optionalControl(hasFormat('highlight'), {
			id: 'highlight',
			label: messages.richTextHighlight,
			icon: highlighterIcon,
			active: formats.highlight,
			onSelect: () => onFormat('highlight')
		}),
		...optionalControl(hasFormat('link'), {
			id: 'link',
			label: messages.richTextLink,
			icon: linkIcon,
			active: hasActiveLink,
			onSelect: onLink
		})
	];
}

export function getRichTextInputListControls(options: {
	hasFormat: HasFormat;
	listType: AIComposerSelectionListType | null;
	onList: (listType: AIComposerSelectionListType) => void;
	messages: Messages;
}): RichTextInputToolbarButtonConfig[] {
	const { hasFormat, listType, onList, messages } = options;
	return [
		...optionalControl(hasFormat('bulletList'), {
			id: 'bulletList',
			label: messages.richTextBulletList,
			icon: listBulletsIcon,
			active: listType === 'bullet',
			onSelect: () => onList('bullet')
		}),
		...optionalControl(hasFormat('orderedList'), {
			id: 'orderedList',
			label: messages.richTextOrderedList,
			icon: listNumbersIcon,
			active: listType === 'number',
			onSelect: () => onList('number')
		})
	];
}

function optionalControl(
	condition: boolean,
	control: RichTextInputToolbarButtonConfig
): RichTextInputToolbarButtonConfig[] {
	return condition ? [control] : [];
}
