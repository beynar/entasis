// Kept out of richTextInput.props.ts on purpose: it mirrors edytor's own vocabulary (presence
// `share: 'caret'`), which the public props vocabulary check would otherwise read as entasis's.
/**
 * edytor's collaboration settings, passed to the editor as they are (read once, when it mounts):
 * \`room\` alone keeps a local copy in the browser and syncs its open tabs; with \`server\`, people
 * edit the room together. \`actor\` names the local author (presence and attribution); \`document\`
 * shares one \`createDocument()\` between views; \`sync\` is a custom provider.
 *
 * The type is written here rather than picked from edytor's own props: edytor is an optional peer,
 * and a declaration that imports it fails to typecheck in an application that does not install
 * it, even one that never renders a RichTextInput (Form's types reach these props). Every value
 * edytor accepts for these settings is accepted here; `document` and `sync` stay opaque, so
 * pass them the values edytor's `createDocument()` and sync factories return.
 */
export type RichTextInputCollaboration = {
	room?: string;
	server?: string;
	params?: Record<string, string>;
	/** The local author: a stable `id`, and the `name` and `color` presence shows. */
	actor?: { id: string; name?: string; color?: string };
	/** A document from edytor's `createDocument()`, shared between views. */
	document?: object;
	/** A custom sync provider: an edytor `EdytorSync`. */
	sync?: (payload: never) => unknown;
	presence?: {
		/** `'caret'` (default) shares the selection, `'block'` the focused block only, `'none'` nothing. */
		share?: 'caret' | 'block' | 'none';
		/** Minimum milliseconds between two presence writes. */
		throttle?: number;
	};
	requireHydration?: boolean;
	/** The server closed the socket because the credentials expired: put a fresh token in `params`. */
	onSyncExpired?: (state: { reason: string; attempts: number; nextRetryMs: number }) => void;
	/** The server refused the sync; `code` is the close code and `reason` what the server gave. */
	onSyncRefused?: (refusal: Error & { code: number; reason: string }) => void;
};
