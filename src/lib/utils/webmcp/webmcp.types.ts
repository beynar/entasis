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
	 * surface of its own; a string joins the modal Dialog with that `id`, which needs no tool to
	 * pause the page.
	 */
	modal?: boolean | string;
};

/** The options `<Theme webmcp>` takes besides a plain `true`. */
export type WebMCPOptions = Pick<WebMCPRegisterOptions, 'exposedTo'>;

/** The part of the browser's `ModelContext` entasis calls. */
export type ModelContextLike = {
	registerTool: (
		tool: Record<string, unknown>,
		options?: { signal?: AbortSignal; exposedTo?: string[] }
	) => unknown;
	/** Chrome before the signal option: tools were removed by name. */
	unregisterTool?: (name: string) => void;
};
