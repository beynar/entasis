import { redirect } from '@sveltejs/kit';

// The shimmer is a Tailwind utility, documented under /utilities/shimmer. This route only keeps
// old /components/ai-shimmer links working.
export const load = () => {
	redirect(308, '/utilities/shimmer');
};
