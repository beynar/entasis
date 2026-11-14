import type { RequestHandler } from './$types.js';
import { componentMarkdownResponse } from '../../agentDocs.server.js';

// `/utilities/hitbox.md`: the same Markdown as `/components/<id>.md`, beside the utility pages.
export const GET: RequestHandler = ({ params, url }) =>
	componentMarkdownResponse(params.id, url.origin);
