/** The JSON Schema object a WebMCP tool declares for its input. */
export type WebMCPJsonSchema = Record<string, unknown>;

/** What a tool tells the agent and the browser about itself. Every hint defaults to false. */
export type WebMCPToolAnnotations = {
	/** The tool only reads data. */
	readOnlyHint?: boolean;
	/** The action is significant or hard to undo: the browser may ask the user to confirm. */
	consequentialHint?: boolean;
	/** The output holds external or user-written data, which the model must not trust. */
	untrustedContentHint?: boolean;
	/** The tool is for inspection and developer tooling. Chrome 156 and later. */
	debugging?: boolean;
};

/** One tool, as `useWebMCPTool` and `registerWebMCPTool` take it. */
export type WebMCPTool<Input = Record<string, unknown>> = {
	/** 1 to 128 characters: ASCII letters, digits, `_`, `-` and `.`. Must be unique on the page. */
	name: string;
	/** Short human-readable name. */
	title?: string;
	/** What the tool does and when to use it. The model reads this to decide. */
	description: string;
	inputSchema?: WebMCPJsonSchema;
	annotations?: WebMCPToolAnnotations;
	/** Runs the tool. The result is serialized as JSON and handed to the model. */
	execute: (input: Input, options: { signal?: AbortSignal }) => unknown;
};

export type WebMCPRegisterOptions = {
	/** Other origins allowed to see and run the tool. Same-origin only by default. */
	exposedTo?: string[];
	/**
	 * Makes the tool part of a modal surface: only the tools of the topmost surface stay available,
	 * because what is behind a modal cannot be used, by a person or by an agent. `true` opens a
	 * surface of its own; a string joins the modal Dialog with that `id`, and the tool is available
	 * while that Dialog is the topmost one.
	 */
	modal?: boolean | string;
};

/** The options `<Theme webmcp>` takes besides a plain `true`. */
export type WebMCPOptions = Pick<WebMCPRegisterOptions, 'exposedTo'>;

/**
 * How a component appears to AI agents under `<Theme webmcp>`, given to its `tool` prop. Everything
 * has a default taken from the props it already has.
 */
export type WebMCPToolOptions = {
	/** Tool name. Defaults to one taken from the component, with a suffix if already taken. */
	name?: string;
	/** Human-readable name. */
	title?: string;
	/** Tells the model what the component does, besides what its props say. */
	description?: string;
	/**
	 * Whether acting on it is significant or hard to undo, so the browser may ask the user first.
	 * Each component has its own default.
	 */
	consequential?: boolean;
	/** Other origins allowed to use this tool. Defaults to `<Theme webmcp>`'s `exposedTo`. */
	exposedTo?: string[];
};

/** The `tool` prop of a component: its options, or `false` to keep it from agents. */
export type WebMCPToolProp = boolean | WebMCPToolOptions;

/** The part of the browser's `ModelContext` entasis calls. */
export type ModelContextLike = {
	registerTool: (
		tool: Record<string, unknown>,
		options?: { signal?: AbortSignal; exposedTo?: string[] }
	) => unknown;
	/** Chrome before the signal option: tools were removed by name. */
	unregisterTool?: (name: string) => void;
};
