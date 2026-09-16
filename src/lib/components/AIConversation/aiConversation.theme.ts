import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// AIConversation is the headless provider for a conversation subtree: it renders its
// children and no box of its own. The slot exists so the conversation surface has the same
// override surface as every other component — `setAIConversationTheme` for an app-wide
// default, `useAIConversationTheme` for the composed AI components that render inside it.
const defaultAIConversationRoot = cva({
	base: ''
});

export const aiConversationTheme = {
	root: defaultAIConversationRoot
};

export type AIConversationTheme = typeof aiConversationTheme;
export type AIConversationThemeProps = InferComponentTheme<AIConversationTheme>;
export const setAIConversationTheme = setComponentTheme<AIConversationTheme>('ai-conversation');
export const useAIConversationTheme = useComponentTheme<AIConversationTheme>(
	'ai-conversation',
	aiConversationTheme
);
