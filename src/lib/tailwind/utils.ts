export const plugin = {
	withOptions<Options>(
		pluginFunction: (options?: Options) => unknown,
		configFunction: (options?: Options) => unknown = () => ({})
	) {
		const optionsFunction = (options?: Options) => {
			const handler = pluginFunction(options);
			const config = configFunction(options);
			return { handler, config };
		};
		return Object.assign(optionsFunction, { __isOptionsFunction: true as const });
	}
};
