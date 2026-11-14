import type { RequestHandler } from './$types.js';
import { componentMarkdownResponse } from '../../agentDocs.server.js';

// `/components/card.md`: the component's documentation as Markdown, next to its HTML page.
export const GET: RequestHandler = ({ params, url }) =>
	componentMarkdownResponse(params.id, url.origin);
