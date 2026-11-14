import type { RequestHandler } from './$types.js';
import { llmsTxtResponse } from '../agentDocs.server.js';

export const GET: RequestHandler = ({ url }) => llmsTxtResponse(url.origin);
