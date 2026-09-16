import plugin, { type Config } from 'tailwindcss/plugin';
import { applyGlobalEngine, globalKeyframes, type GlobalEngineOptions } from './global.js';

export default plugin.withOptions<GlobalEngineOptions>(
	(options) => (api) => applyGlobalEngine(api, options),
	(options) =>
		({
			theme: {
				extend: {
					keyframes: globalKeyframes(options)
				}
			}
		}) satisfies Config
);
