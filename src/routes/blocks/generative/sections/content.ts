/**
 * One fictional product voice for every generative section, so any composition reads as one site.
 * Copy is fixed: levers choose how much of it shows and how it is laid out, never what it says.
 */
export const brand = {
	name: 'Meridian',
	tagline: 'Plan the work. Ship the plan.',
	pitch:
		'Meridian keeps roadmaps, decisions, and delivery in one calm place, so teams spend less time syncing and more time shipping.',
	short: 'Roadmaps, decisions, and delivery in one calm place.'
};

export const navLinks = ['Product', 'Solutions', 'Pricing', 'Customers', 'Changelog'];

export const heroCopy = {
	eyebrow: 'New · Meridian 3.0 is here',
	title: 'Plan the work. Ship the plan.',
	body: 'Roadmaps, decisions, and delivery in one calm place — so your team spends less time syncing and more time shipping.',
	primary: 'Start free',
	secondary: 'Book a demo'
};

export const logoNames = [
	'Northwind',
	'Lumen',
	'Kestrel',
	'Atlas&Co',
	'Fieldnote',
	'Halcyon',
	'Parallel',
	'Orbitly',
	'Saltwater',
	'Cobalt',
	'Waypoint',
	'Brightline'
];

export const features = [
	{
		title: 'Living roadmaps',
		body: 'Drag a milestone and every dependent date, owner, and status updates with it.'
	},
	{
		title: 'Decision log',
		body: 'Capture why, not just what. Every decision links back to the work it shaped.'
	},
	{
		title: 'Calm notifications',
		body: 'One digest a day, tuned to what you own. Nothing urgent gets buried.'
	},
	{
		title: 'Shared rituals',
		body: 'Stand-ups, reviews, and retros run from templates your team actually keeps.'
	},
	{
		title: 'Instant reporting',
		body: 'Progress rolls up from real work. Status meetings become optional.'
	},
	{
		title: 'Guest access',
		body: 'Invite clients to a single project without exposing the rest of your workspace.'
	},
	{
		title: 'Two-way sync',
		body: 'Issues, pull requests, and docs stay current across the tools you already use.'
	},
	{
		title: 'Audit trail',
		body: 'Every change is versioned, attributed, and reversible in a click.'
	}
];

export const stats = [
	{ value: '38%', label: 'fewer status meetings', trend: '+12 pts this year' },
	{ value: '2.4×', label: 'faster planning cycles', trend: 'Median across teams' },
	{ value: '9,800', label: 'teams shipping weekly', trend: '+1,200 this quarter' },
	{ value: '99.98%', label: 'uptime over 12 months', trend: 'Independently audited' }
];

export const testimonials = [
	{
		quote:
			'Meridian replaced three tools and a weekly meeting. Our roadmap finally matches what we actually ship.',
		name: 'Maya Chen',
		role: 'VP Product, Northwind'
	},
	{
		quote:
			'The decision log alone saved us a quarter of rework. New hires read it like the history of the product.',
		name: 'Theo Park',
		role: 'Engineering Lead, Kestrel'
	},
	{
		quote: 'Planning used to take a week. Now it takes an afternoon, and nobody dreads it.',
		name: 'Nora Ellis',
		role: 'Head of Delivery, Lumen'
	},
	{
		quote:
			'Our clients see exactly what they need and nothing else. Guest access is quietly brilliant.',
		name: 'Idris Okafor',
		role: 'Founder, Fieldnote Studio'
	},
	{
		quote: 'It is the first planning tool our designers open without being asked.',
		name: 'Lena Marsh',
		role: 'Design Director, Halcyon'
	},
	{
		quote: 'We rolled it out to 400 people in two weeks. The defaults are that good.',
		name: 'Ravi Shah',
		role: 'COO, Parallel'
	}
];

export const plans = [
	{
		name: 'Starter',
		price: '$0',
		cadence: 'forever',
		yearly: '$0',
		description: 'For small teams finding their rhythm.',
		features: [
			'Up to 5 members',
			'Unlimited projects',
			'Roadmaps and boards',
			'7-day history',
			'Community support'
		],
		cta: 'Start free'
	},
	{
		name: 'Team',
		price: '$12',
		cadence: 'per member / month',
		yearly: '$10',
		description: 'For teams that plan and ship together.',
		features: [
			'Unlimited members',
			'Decision log',
			'Guest access',
			'Two-way sync',
			'Priority support'
		],
		cta: 'Start a trial'
	},
	{
		name: 'Enterprise',
		price: 'Custom',
		cadence: 'annual agreement',
		yearly: 'Custom',
		description: 'For organisations with many teams.',
		features: [
			'SSO and SCIM',
			'Audit trail',
			'Data residency',
			'Custom contracts',
			'Dedicated success'
		],
		cta: 'Talk to sales'
	}
];

export const faqs = [
	{
		id: 'trial',
		title: 'Is there a free trial?',
		content: 'Every paid plan starts with a 14-day trial. No card required, and you keep your data.'
	},
	{
		id: 'import',
		title: 'Can we import from our current tool?',
		content:
			'Yes. Importers cover the common trackers and spreadsheets, with a preview before anything moves.'
	},
	{
		id: 'guests',
		title: 'Do guests count as members?',
		content: 'No. Guests are free and see only the projects you share with them.'
	},
	{
		id: 'security',
		title: 'How is our data protected?',
		content: 'Data is encrypted in transit and at rest, with SOC 2 reports available on request.'
	},
	{
		id: 'cancel',
		title: 'What happens if we cancel?',
		content: 'Your workspace becomes read-only and exportable. Nothing is deleted for 90 days.'
	},
	{
		id: 'support',
		title: 'What does support look like?',
		content: 'Real people, every weekday, with a median first reply under two hours.'
	}
];

export const team = [
	{ name: 'Maya Chen', role: 'Co-founder, CEO' },
	{ name: 'Theo Park', role: 'Co-founder, CTO' },
	{ name: 'Nora Ellis', role: 'Head of Design' },
	{ name: 'Idris Okafor', role: 'Engineering' },
	{ name: 'Lena Marsh', role: 'Product' },
	{ name: 'Ravi Shah', role: 'Operations' },
	{ name: 'Ana Ruiz', role: 'Customer Success' },
	{ name: 'Jonas Berg', role: 'Engineering' }
];

export const footerColumns = [
	{ title: 'Product', links: ['Roadmaps', 'Decision log', 'Reporting', 'Integrations'] },
	{ title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
	{ title: 'Resources', links: ['Guides', 'Templates', 'Changelog', 'Status'] },
	{ title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] }
];

/** Photos already used by the Blocks catalog; media never reaches for anything new. */
export const photos = [
	'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1100&q=80',
	'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1100&q=80',
	'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=80',
	'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1100&q=80'
];
