import type { BlockCategory } from './types.js';

export const marketingCategories: BlockCategory[] = [
	{
		slug: 'about',
		title: 'About',
		group: 'Marketing',
		description: 'Standalone about compositions, built with Entasis.',
		blocks: [
			{
				id: 'about-story-columns',
				title: 'A story in two columns',
				description:
					'An editorial introduction with an oversized statement and two narrative columns.',
				file: 'about/StoryColumns.svelte',
				reference: 'https://www.shadcnblocks.com/block/about1',
				components: ['Button', 'Chip', 'Heading', 'Separator', 'Stat']
			},
			{
				id: 'about-mission-panels',
				title: 'Mission and principles',
				description: 'A broad mission statement followed by contrasting narrative panels.',
				file: 'about/MissionPanels.svelte',
				reference: 'https://www.shadcnblocks.com/block/about18',
				components: ['Button', 'Card', 'Heading']
			},
			{
				id: 'about-company-profile',
				title: 'Company profile',
				description: 'A compact company sidebar paired with a long-form studio profile.',
				file: 'about/CompanyProfile.svelte',
				reference: 'https://www.shadcnblocks.com/block/about10',
				components: ['AvatarGroup', 'Button', 'Heading', 'Separator', 'Stat']
			},
			{
				id: 'about-tabbed-profile',
				title: 'A company, three perspectives',
				description:
					'A tabbed studio profile that swaps a statement, metrics, and supporting details.',
				file: 'about/TabbedProfile.svelte',
				reference: 'https://www.shadcnblocks.com/block/about17',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stat', 'Tabbar']
			}
		]
	},
	{
		slug: 'background-pattern',
		title: 'Background Pattern',
		group: 'Marketing',
		description: 'Standalone background pattern compositions, built with Entasis.',
		blocks: [
			{
				id: 'background-pattern-radial-atmosphere',
				title: 'Radial atmosphere',
				description: 'A luminous radial surface surrounding a centered call to action.',
				file: 'background-pattern/RadialAtmosphere.svelte',
				reference: 'https://www.shadcnblocks.com/block/background-pattern1',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'background-pattern-blueprint-grid',
				title: 'Blueprint grid',
				description: 'A crisp grid background with a corner fade and an offset product callout.',
				file: 'background-pattern/BlueprintGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/background-pattern4',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Meter']
			}
		]
	},
	{
		slug: 'banner',
		title: 'Banner',
		group: 'Marketing',
		description: 'Standalone banner compositions, built with Entasis.',
		blocks: [
			{
				id: 'banner-announcement-bar',
				title: 'Dismissible release bar',
				description:
					'A full-width announcement with a release tag, link, and local dismiss control.',
				file: 'banner/AnnouncementBar.svelte',
				reference: 'https://www.shadcnblocks.com/block/banner1',
				components: ['Button', 'Chip']
			},
			{
				id: 'banner-community-pill',
				title: 'Community invitation pill',
				description: 'A compact rounded invitation with overlapping avatars and a clear action.',
				file: 'banner/CommunityPill.svelte',
				reference: 'https://www.shadcnblocks.com/block/banner6',
				components: ['AvatarGroup', 'Button']
			},
			{
				id: 'banner-floating-release',
				title: 'Floating release note',
				description:
					'An inset announcement card with an icon, compact release text, and a footer link.',
				file: 'banner/FloatingRelease.svelte',
				reference: 'https://www.shadcnblocks.com/block/banner5',
				components: ['Button', 'Card', 'Stack']
			}
		]
	},
	{
		slug: 'bento',
		title: 'Bento',
		group: 'Marketing',
		description: 'Standalone bento compositions, built with Entasis.',
		blocks: [
			{
				id: 'bento-collaboration-bento',
				title: 'Teamwork, in four tiles',
				description:
					'An asymmetric collaboration grid with people, project progress, and a weekly snapshot.',
				file: 'bento/CollaborationBento.svelte',
				reference: 'https://www.shadcnblocks.com/block/bento2',
				components: ['Avatar', 'AvatarGroup', 'Card', 'Chip', 'Heading', 'Meter', 'Stat', 'Stack']
			},
			{
				id: 'bento-value-bento',
				title: 'Four reasons to build',
				description:
					'A balanced four-tile value grid with a large lead tile and concise proof points.',
				file: 'bento/ValueBento.svelte',
				reference: 'https://www.shadcnblocks.com/block/bento3',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'bento-workflow-bento',
				title: 'A workflow in motion',
				description:
					'A two-by-two feature grid containing a workflow checklist, budget meter, schedule, and people.',
				file: 'bento/WorkflowBento.svelte',
				reference: 'https://www.shadcnblocks.com/block/bento8',
				components: ['AvatarGroup', 'Card', 'Chip', 'Heading', 'Meter', 'Stat', 'Stack']
			},
			{
				id: 'bento-analytics-bento',
				title: 'The bigger picture',
				description:
					'A wide analytics composition with weekly bars, a prominent metric, and layered activity cards.',
				file: 'bento/AnalyticsBento.svelte',
				reference: 'https://www.shadcnblocks.com/block/bento10',
				components: ['Card', 'Chip', 'ProgressCircle', 'Stat']
			}
		]
	},
	{
		slug: 'book-a-demo',
		title: 'Book A Demo',
		group: 'Marketing',
		description: 'Standalone book a demo compositions, built with Entasis.',
		blocks: [
			{
				id: 'book-a-demo-benefits-demo',
				title: 'Demo with a clear agenda',
				description:
					'A split booking form with three benefits, social proof, and an honest local request draft.',
				file: 'book-a-demo/BenefitsDemo.svelte',
				reference: 'https://www.shadcnblocks.com/block/book-a-demo1',
				components: ['AvatarGroup', 'Card', 'Chip', 'Form', 'Heading', 'Stack']
			},
			{
				id: 'book-a-demo-proof-demo',
				title: 'Demo beside customer stories',
				description:
					'A compact booking form beside a stack of customer quotes and a clear meeting summary.',
				file: 'book-a-demo/ProofDemo.svelte',
				reference: 'https://www.shadcnblocks.com/block/book-a-demo3',
				components: ['Avatar', 'Card', 'Chip', 'Form', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'community',
		title: 'Community',
		group: 'Marketing',
		description: 'Standalone community compositions, built with Entasis.',
		blocks: [
			{
				id: 'community-community-invite',
				title: 'A centered community invitation',
				description:
					'A centered invitation with member avatars and two clear places to get started.',
				file: 'community/CommunityInvite.svelte',
				reference: 'https://www.shadcnblocks.com/block/community1',
				components: ['AvatarGroup', 'Button', 'Chip', 'Heading']
			},
			{
				id: 'community-community-channels',
				title: 'Four doors into the community',
				description:
					'A responsive grid of community destinations with icons, descriptions, and calls to action.',
				file: 'community/CommunityChannels.svelte',
				reference: 'https://www.shadcnblocks.com/block/community2',
				components: ['Button', 'Card', 'Chip', 'Heading']
			}
		]
	},
	{
		slug: 'compare',
		title: 'Compare',
		group: 'Marketing',
		description: 'Standalone compare compositions, built with Entasis.',
		blocks: [
			{
				id: 'compare-feature-comparison',
				title: 'A clear feature comparison',
				description:
					'A three-column comparison matrix with a featured product column and a concise introduction.',
				file: 'compare/FeatureComparison.svelte',
				reference: 'https://www.shadcnblocks.com/block/compare1',
				components: ['Button', 'Chip', 'Heading', 'Table']
			},
			{
				id: 'compare-before-after',
				title: 'From scattered to shared',
				description:
					'Two contrasting checklists compare a fragmented workflow with a shared product workspace.',
				file: 'compare/BeforeAfter.svelte',
				reference: 'https://www.shadcnblocks.com/block/compare10',
				components: ['Button', 'Card', 'Heading']
			},
			{
				id: 'compare-model-comparison',
				title: 'Choose a working model',
				description:
					'Tabbed comparison of two workflows, with a three-model matrix that updates locally.',
				file: 'compare/ModelComparison.svelte',
				reference: 'https://www.shadcnblocks.com/block/compare6',
				components: ['Heading', 'Tabbar', 'Table']
			}
		]
	},
	{
		slug: 'compliance',
		title: 'Compliance',
		group: 'Marketing',
		description: 'Standalone compliance compositions, built with Entasis.',
		blocks: [
			{
				id: 'compliance-trust-pillars',
				title: 'Security principles and badges',
				description:
					'A security overview with three concrete practices and a framework status strip.',
				file: 'compliance/TrustPillars.svelte',
				reference: 'https://www.shadcnblocks.com/block/compliance3',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stack']
			},
			{
				id: 'compliance-security-overview',
				title: 'A split trust overview',
				description:
					'A security narrative beside a stacked set of explicit framework status cards.',
				file: 'compliance/SecurityOverview.svelte',
				reference: 'https://www.shadcnblocks.com/block/compliance4',
				components: ['Button', 'Card', 'Chip', 'Heading']
			}
		]
	},
	{
		slug: 'contact',
		title: 'Contact',
		group: 'Marketing',
		description: 'Standalone contact compositions, built with Entasis.',
		blocks: [
			{
				id: 'contact-centered-contact',
				title: 'A focused contact form',
				description: 'A narrow centered contact form with a clear local draft review.',
				file: 'contact/CenteredContact.svelte',
				reference: 'https://www.shadcnblocks.com/block/contact5',
				components: ['Card', 'Chip', 'Form', 'Heading', 'Stack']
			},
			{
				id: 'contact-contact-channels',
				title: 'Choose the right conversation',
				description: 'Three contact method cards with useful destinations and a concise lead-in.',
				file: 'contact/ContactChannels.svelte',
				reference: 'https://www.shadcnblocks.com/block/contact7',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'contact-office-directory',
				title: 'A global office directory',
				description:
					'A concise introduction followed by a three-office directory and a shared contact card.',
				file: 'contact/OfficeDirectory.svelte',
				reference: 'https://www.shadcnblocks.com/block/contact3',
				components: ['Button', 'Card', 'Heading', 'Separator']
			},
			{
				id: 'contact-personal-contact',
				title: 'A personal introduction',
				description: 'A compact contact card led by an avatar and a short, useful inquiry form.',
				file: 'contact/PersonalContact.svelte',
				reference: 'https://www.shadcnblocks.com/block/contact14',
				components: ['Avatar', 'Card', 'Chip', 'Form', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'cookie-banner',
		title: 'Cookie Banner',
		group: 'Marketing',
		description: 'Standalone cookie banner compositions, built with Entasis.',
		blocks: [
			{
				id: 'cookie-banner-cookie-bar',
				title: 'A simple consent bar',
				description:
					'A responsive consent strip with independent accept, decline, and reset actions.',
				file: 'cookie-banner/CookieBar.svelte',
				reference: 'https://www.shadcnblocks.com/block/cookie-banner1',
				components: ['Button', 'Heading']
			},
			{
				id: 'cookie-banner-cookie-preference-card',
				title: 'An expandable preference card',
				description: 'A corner consent card that expands into individual optional preferences.',
				file: 'cookie-banner/CookiePreferenceCard.svelte',
				reference: 'https://www.shadcnblocks.com/block/cookie-banner10',
				components: ['Button', 'Card', 'Switch', 'Stack']
			},
			{
				id: 'cookie-banner-cookie-category-panel',
				title: 'A consent panel with categories',
				description: 'A wide consent panel with explicit category cards and a local saved state.',
				file: 'cookie-banner/CookieCategoryPanel.svelte',
				reference: 'https://www.shadcnblocks.com/block/cookie-banner15',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Switch', 'Stack']
			}
		]
	},
	{
		slug: 'cta',
		title: 'CTA',
		group: 'Marketing',
		description: 'Standalone cta compositions, built with Entasis.',
		blocks: [
			{
				id: 'cta-feature-checklist-cta',
				title: 'A call to action with proof',
				description:
					'An inset call to action balancing a large headline with a compact feature checklist.',
				file: 'cta/FeatureChecklistCta.svelte',
				reference: 'https://www.shadcnblocks.com/block/cta4',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Separator']
			},
			{
				id: 'cta-action-band',
				title: 'A bold action band',
				description:
					'A full-width band with a strong invitation and a pair of complementary actions.',
				file: 'cta/ActionBand.svelte',
				reference: 'https://www.shadcnblocks.com/block/cta10',
				components: ['Button', 'Heading']
			},
			{
				id: 'cta-resource-cta',
				title: 'The next step, three ways',
				description: 'A split invitation with a vertical stack of resource links.',
				file: 'cta/ResourceCta.svelte',
				reference: 'https://www.shadcnblocks.com/block/cta19',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'cta-circle-cta',
				title: 'A centered invitation with rings',
				description:
					'Concentric theme-colored rings frame a centered headline and a single focused action.',
				file: 'cta/CircleCta.svelte',
				reference: 'https://www.shadcnblocks.com/block/cta17',
				components: ['Button', 'Chip', 'Heading']
			}
		]
	},
	{
		slug: 'download',
		title: 'Download',
		group: 'Marketing',
		description: 'Standalone download compositions, built with Entasis.',
		blocks: [
			{
				id: 'download-download-guide',
				title: 'A single-file download',
				description: 'A focused downloadable project brief card with a real text-file download.',
				file: 'download/DownloadGuide.svelte',
				reference: 'https://www.shadcnblocks.com/block/download3',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'download-platform-downloads',
				title: 'Platform installation notes',
				description:
					'Three platform cards offering real downloadable setup notes and clear requirements.',
				file: 'download/PlatformDownloads.svelte',
				reference: 'https://www.shadcnblocks.com/block/download6',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'download-install-command',
				title: 'One command to get started',
				description:
					'An installation hub with package-manager tabs and an honest clipboard result.',
				file: 'download/InstallCommand.svelte',
				reference: 'https://www.shadcnblocks.com/block/download5',
				components: ['Button', 'Card', 'Chip', 'Code', 'Heading', 'Separator', 'Tabbar', 'Stack']
			}
		]
	},
	{
		slug: 'faq',
		title: 'FAQ',
		group: 'Marketing',
		description: 'Standalone faq compositions, built with Entasis.',
		blocks: [
			{
				id: 'faq-centered-questions',
				title: 'A focused FAQ',
				description: 'A narrow accordion with clear answers and one question initially open.',
				file: 'faq/CenteredQuestions.svelte',
				reference: 'https://www.shadcnblocks.com/block/faq1',
				components: ['Accordion', 'Chip', 'Heading']
			},
			{
				id: 'faq-split-questions',
				title: 'Answers beside an invitation',
				description: 'A two-column FAQ with a concise support invitation beside the accordion.',
				file: 'faq/SplitQuestions.svelte',
				reference: 'https://www.shadcnblocks.com/block/faq7',
				components: ['Accordion', 'AvatarGroup', 'Button', 'Card', 'Chip', 'Heading', 'Stack']
			},
			{
				id: 'faq-categorized-questions',
				title: 'Questions, by topic',
				description:
					'A category tab strip filters the FAQ accordion to the topic the reader needs.',
				file: 'faq/CategorizedQuestions.svelte',
				reference: 'https://www.shadcnblocks.com/block/faq18',
				components: ['Accordion', 'Button', 'Heading', 'Tabbar']
			}
		]
	},
	{
		slug: 'feature',
		title: 'Feature',
		group: 'Marketing',
		description: 'Standalone feature compositions, built with Entasis.',
		blocks: [
			{
				id: 'feature-numbered-workflow',
				title: 'A numbered workflow',
				description:
					'A three-step timeline with alternating working examples and concise explanations.',
				file: 'feature/NumberedWorkflow.svelte',
				reference: 'https://www.shadcnblocks.com/block/feature102',
				components: ['Card', 'Chip', 'Heading', 'Meter']
			},
			{
				id: 'feature-feature-checklist-grid',
				title: 'Four capabilities with detail',
				description:
					'Four feature cards pair clear capability statements with short implementation-independent benefits.',
				file: 'feature/FeatureChecklistGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/feature203',
				components: ['Card', 'Chip', 'Heading', 'Separator', 'Stack']
			},
			{
				id: 'feature-vertical-feature-tabs',
				title: 'Explore a feature, see the result',
				description:
					'A vertical tab rail swaps a large project preview with a different content model per tab.',
				file: 'feature/VerticalFeatureTabs.svelte',
				reference: 'https://www.shadcnblocks.com/block/feature175',
				components: [
					'Avatar',
					'Button',
					'Card',
					'Chip',
					'Heading',
					'Meter',
					'Stat',
					'Tabbar',
					'Stack'
				]
			},
			{
				id: 'feature-utility-feature-grid',
				title: 'A compact capability grid',
				description: 'A split headline and action introduce a clean, icon-led six-feature grid.',
				file: 'feature/UtilityFeatureGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/feature148',
				components: ['Button', 'Heading', 'Separator']
			},
			{
				id: 'feature-workflow-stack',
				title: 'A workflow feature stack',
				description:
					'A compact feature narrative beside stacked workflow cards and an outcome strip.',
				file: 'feature/WorkflowStack.svelte',
				reference: 'https://www.shadcnblocks.com/block/feature118',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stat']
			}
		]
	},
	{
		slug: 'footer',
		title: 'Footer',
		group: 'Marketing',
		description: 'Standalone footer compositions, built with Entasis.',
		blocks: [
			{
				id: 'footer-classic-footer',
				title: 'A classic multi-column footer',
				description:
					'A brand introduction, three concise navigation columns, and a separated legal row.',
				file: 'footer/ClassicFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/footer2',
				components: ['Chip', 'Heading', 'Separator']
			},
			{
				id: 'footer-contact-footer',
				title: 'A conversation-led footer',
				description:
					'An oversized contact invitation with a small navigation grid and a minimal signature.',
				file: 'footer/ContactFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/footer24',
				components: ['Button', 'Chip', 'Heading', 'Separator']
			},
			{
				id: 'footer-newsletter-footer',
				title: 'A footer with a reading list',
				description:
					'A compact subscription form paired with navigation columns and a brand signature.',
				file: 'footer/NewsletterFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/footer3',
				components: ['Form', 'Heading', 'Separator']
			},
			{
				id: 'footer-accordion-footer',
				title: 'A compact accordion footer',
				description:
					'An adaptive footer with three expandable navigation groups and a large brand signature.',
				file: 'footer/AccordionFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/footer49',
				components: ['Accordion', 'Button', 'Chip', 'Heading', 'Separator']
			}
		]
	},
	{
		slug: 'hero',
		title: 'Hero',
		group: 'Marketing',
		description: 'Standalone hero compositions, built with Entasis.',
		blocks: [
			{
				id: 'hero-dashboard-hero',
				title: 'A hero with a live product preview',
				description: 'A centered headline and dual actions sit above a tabbed dashboard preview.',
				file: 'hero/DashboardHero.svelte',
				reference: 'https://www.shadcnblocks.com/block/hero195',
				components: [
					'Avatar',
					'AvatarGroup',
					'Button',
					'Card',
					'Chip',
					'Heading',
					'Meter',
					'Stat',
					'Tabbar',
					'Stack'
				]
			},
			{
				id: 'hero-integration-orbit-hero',
				title: 'An orbit of possibilities',
				description:
					'A split hero pairs an integration story with a geometric orbit of component icons.',
				file: 'hero/IntegrationOrbitHero.svelte',
				reference: 'https://www.shadcnblocks.com/block/hero18',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'hero-split-benefits-hero',
				title: 'A split hero with product detail',
				description:
					'A two-column hero combines a clear promise, benefit list, and a composed project workspace.',
				file: 'hero/SplitBenefitsHero.svelte',
				reference: 'https://www.shadcnblocks.com/block/hero261',
				components: ['AvatarGroup', 'Button', 'Card', 'Chip', 'Heading', 'Separator', 'Stack']
			},
			{
				id: 'hero-grid-hero',
				title: 'A centered hero on a grid',
				description:
					'A centered invitation on a faint grid, followed by a restrained partner wordmark strip.',
				file: 'hero/GridHero.svelte',
				reference: 'https://www.shadcnblocks.com/block/hero10',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'hero-framed-product-hero',
				title: 'A framed product introduction',
				description:
					'An editorial hero sits above a framed product preview and a divided feature band.',
				file: 'hero/FramedProductHero.svelte',
				reference: 'https://www.shadcnblocks.com/block/hero294',
				components: ['Button', 'Card', 'Heading', 'Meter', 'Stat']
			}
		]
	},
	{
		slug: 'industries',
		title: 'Industries',
		group: 'Marketing',
		description: 'Standalone industries compositions, built with Entasis.',
		blocks: [
			{
				id: 'industries-industry-list',
				title: 'A field of possibilities',
				description:
					'An editorial list of industries with concise use cases and a shared introduction.',
				file: 'industries/IndustryList.svelte',
				reference: 'https://www.shadcnblocks.com/block/industries2',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'industries-expandable-industries',
				title: 'Explore each industry',
				description:
					'Expandable industry rows reveal a short use case, relevant capabilities, and a matching action.',
				file: 'industries/ExpandableIndustries.svelte',
				reference: 'https://www.shadcnblocks.com/block/industries4',
				components: ['Accordion', 'Button', 'Card', 'Chip', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'integration',
		title: 'Integration',
		group: 'Marketing',
		description: 'Standalone integration compositions, built with Entasis.',
		blocks: [
			{
				id: 'integration-integration-grid',
				title: 'An integration card grid',
				description:
					'A useful grid of integration examples with real descriptive detail and local selection.',
				file: 'integration/IntegrationGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/integration9',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stack']
			},
			{
				id: 'integration-categorized-integrations',
				title: 'Integrations by purpose',
				description: 'A category tab strip filters a compact integration grid.',
				file: 'integration/CategorizedIntegrations.svelte',
				reference: 'https://www.shadcnblocks.com/block/integration16',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Tabbar']
			},
			{
				id: 'integration-integration-marquee',
				title: 'An always-connected toolkit',
				description: 'A centered introduction above a gently moving band of integration cards.',
				file: 'integration/IntegrationMarquee.svelte',
				reference: 'https://www.shadcnblocks.com/block/integration2',
				components: ['Button', 'Chip', 'Heading', 'Marquee']
			},
			{
				id: 'integration-integration-hub',
				title: 'A connected workspace hub',
				description:
					'A responsive hub-and-spoke diagram with selectable tools and a live detail card.',
				file: 'integration/IntegrationHub.svelte',
				reference: 'https://www.shadcnblocks.com/block/integration19',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'logos',
		title: 'Logos',
		group: 'Marketing',
		description: 'Standalone logos compositions, built with Entasis.',
		blocks: [
			{
				id: 'logos-partner-strip',
				title: 'A restrained partner strip',
				description: 'A single quiet row of text-based example wordmarks beneath a small heading.',
				file: 'logos/PartnerStrip.svelte',
				reference: 'https://www.shadcnblocks.com/block/logos1',
				components: ['Chip']
			},
			{
				id: 'logos-partner-grid',
				title: 'A two-row partner grid',
				description:
					'A divided partner grid balances six wordmarks with a compact company introduction.',
				file: 'logos/PartnerGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/logos5',
				components: ['Chip', 'Heading']
			},
			{
				id: 'logos-partner-marquee',
				title: 'A continuous partner band',
				description: 'A calm moving wordmark band with a centered headline and theme-aware fade.',
				file: 'logos/PartnerMarquee.svelte',
				reference: 'https://www.shadcnblocks.com/block/logos3',
				components: ['Heading', 'Marquee']
			}
		]
	},
	{
		slug: 'navbar',
		title: 'Navbar',
		group: 'Marketing',
		description: 'Standalone navbar compositions, built with Entasis.',
		blocks: [
			{
				id: 'navbar-simple-navbar',
				title: 'A responsive product navbar',
				description: 'A clean brand and link row with an expandable mobile navigation panel.',
				file: 'navbar/SimpleNavbar.svelte',
				reference: 'https://www.shadcnblocks.com/block/navbar2',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'navbar-floating-navbar',
				title: 'A floating pill navigation',
				description: 'An inset rounded navbar with a resource dropdown and a compact mobile menu.',
				file: 'navbar/FloatingNavbar.svelte',
				reference: 'https://www.shadcnblocks.com/block/navbar6',
				components: ['Button', 'Heading', 'Popover']
			},
			{
				id: 'navbar-mega-menu-navbar',
				title: 'A navigation with a feature panel',
				description:
					'A product dropdown opens a two-column menu with a featured getting-started card.',
				file: 'navbar/MegaMenuNavbar.svelte',
				reference: 'https://www.shadcnblocks.com/block/navbar5',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Popover', 'Stack']
			}
		]
	},
	{
		slug: 'newsletter',
		title: 'Newsletter',
		group: 'Marketing',
		description: 'Standalone newsletter compositions, built with Entasis.',
		blocks: [
			{
				id: 'newsletter-centered-newsletter',
				title: 'A quiet newsletter invitation',
				description: 'A centered editorial signup with an honest local subscription draft.',
				file: 'newsletter/CenteredNewsletter.svelte',
				reference: 'https://www.shadcnblocks.com/block/newsletter1',
				components: ['Card', 'Form', 'Heading']
			},
			{
				id: 'newsletter-feature-newsletter',
				title: 'A newsletter with a clear promise',
				description: 'A split subscription section explains exactly what readers would receive.',
				file: 'newsletter/FeatureNewsletter.svelte',
				reference: 'https://www.shadcnblocks.com/block/newsletter4',
				components: ['Card', 'Chip', 'Form', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'pricing',
		title: 'Pricing',
		group: 'Marketing',
		description: 'Standalone pricing compositions, built with Entasis.',
		blocks: [
			{
				id: 'pricing-four-tier-pricing',
				title: 'Four plans, one clear choice',
				description:
					'A four-tier pricing grid with short feature lists and a highlighted team plan.',
				file: 'pricing/FourTierPricing.svelte',
				reference: 'https://www.shadcnblocks.com/block/pricing1',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Separator']
			},
			{
				id: 'pricing-billing-pricing',
				title: 'Two plans with billing choice',
				description:
					'Two contrasting plan cards with a working monthly and annual billing selector.',
				file: 'pricing/BillingPricing.svelte',
				reference: 'https://www.shadcnblocks.com/block/pricing2',
				components: ['Button', 'Card', 'Chip', 'Heading', 'SegmentedControl']
			},
			{
				id: 'pricing-single-plan-pricing',
				title: 'One complete plan',
				description: 'A single pricing card paired with two groups of included capabilities.',
				file: 'pricing/SinglePlanPricing.svelte',
				reference: 'https://www.shadcnblocks.com/block/pricing6',
				components: ['Button', 'Card', 'Chip', 'Heading']
			},
			{
				id: 'pricing-pricing-matrix',
				title: 'Compare the plans in detail',
				description:
					'A horizontal feature matrix with working billing controls and a recommended column.',
				file: 'pricing/PricingMatrix.svelte',
				reference: 'https://www.shadcnblocks.com/block/pricing9',
				components: ['Button', 'Heading', 'Switch', 'Table']
			},
			{
				id: 'pricing-add-on-pricing',
				title: 'Extend your workspace',
				description: 'Two featured add-ons and a compact list of additional capabilities.',
				file: 'pricing/AddOnPricing.svelte',
				reference: 'https://www.shadcnblocks.com/block/pricing12',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'process',
		title: 'Process',
		group: 'Marketing',
		description: 'Standalone process compositions, built with Entasis.',
		blocks: [
			{
				id: 'process-sticky-process',
				title: 'A process with a clear thread',
				description: 'A sticky introduction accompanies four numbered process steps.',
				file: 'process/StickyProcess.svelte',
				reference: 'https://www.shadcnblocks.com/block/process1',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'process-banded-process',
				title: 'A process in three bands',
				description:
					'Three broad color bands each pair a process stage with an outcome and a short description.',
				file: 'process/BandedProcess.svelte',
				reference: 'https://www.shadcnblocks.com/block/process3',
				components: ['Button', 'Card', 'Heading']
			}
		]
	},
	{
		slug: 'rate-card',
		title: 'Rate Card',
		group: 'Marketing',
		description: 'Standalone rate card compositions, built with Entasis.',
		blocks: [
			{
				id: 'rate-card-monthly-studio-rate',
				title: 'A monthly studio partnership',
				description: 'A large monthly service rate beside a three-step working arrangement.',
				file: 'rate-card/MonthlyStudioRate.svelte',
				reference: 'https://www.shadcnblocks.com/block/rate-card1',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Stack']
			},
			{
				id: 'rate-card-studio-rate-plans',
				title: 'Two ways to work together',
				description:
					'Two studio rate cards compare a focused engagement with an ongoing partnership.',
				file: 'rate-card/StudioRatePlans.svelte',
				reference: 'https://www.shadcnblocks.com/block/rate-card2',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Separator', 'Stack']
			}
		]
	},
	{
		slug: 'service',
		title: 'Service',
		group: 'Marketing',
		description: 'Standalone service compositions, built with Entasis.',
		blocks: [
			{
				id: 'service-service-detail',
				title: 'An editorial service detail',
				description: 'A service introduction followed by readable scope and deliverable sections.',
				file: 'service/ServiceDetail.svelte',
				reference: 'https://www.shadcnblocks.com/block/service1',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Separator']
			},
			{
				id: 'service-service-with-sidebar',
				title: 'A service with a scope sidebar',
				description:
					'A detailed service narrative sits beside expertise, outputs, and related-service cards.',
				file: 'service/ServiceWithSidebar.svelte',
				reference: 'https://www.shadcnblocks.com/block/service5',
				components: ['Accordion', 'Button', 'Card', 'Chip', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'services',
		title: 'Services',
		group: 'Marketing',
		description: 'Standalone services compositions, built with Entasis.',
		blocks: [
			{
				id: 'services-service-checklist-grid',
				title: 'Three services with clear scope',
				description:
					'Three service cards each present a discipline, a promise, and a practical deliverable checklist.',
				file: 'services/ServiceChecklistGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/services1',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Separator', 'Stack']
			},
			{
				id: 'services-service-rows',
				title: 'An editorial service list',
				description:
					'Numbered service rows pair discipline, scope, and an action in three aligned columns.',
				file: 'services/ServiceRows.svelte',
				reference: 'https://www.shadcnblocks.com/block/services3',
				components: ['Button', 'Chip', 'Heading']
			},
			{
				id: 'services-service-accordion',
				title: 'Services with deliverables',
				description:
					'An expandable service list reveals a detailed scope and a practical output card.',
				file: 'services/ServiceAccordion.svelte',
				reference: 'https://www.shadcnblocks.com/block/services8',
				components: ['Accordion', 'Button', 'Card', 'Chip', 'Heading', 'Stack']
			}
		]
	},
	{
		slug: 'shader',
		title: 'Shader',
		group: 'Marketing',
		description: 'Standalone shader compositions, built with Entasis.',
		blocks: [
			{
				id: 'shader-fluid-field',
				title: 'A flowing vector field',
				description:
					'A real WebGL fluid-field shader with theme-derived colors, speed controls, and reduced-motion support.',
				file: 'shader/FluidField.svelte',
				reference: 'https://www.shadcnblocks.com/block/shader7',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Slider']
			},
			{
				id: 'shader-kaleidoscope',
				title: 'A kaleidoscope of possibilities',
				description:
					'A real folded-polar WebGL shader paired with a compact control panel and a paused-motion option.',
				file: 'shader/Kaleidoscope.svelte',
				reference: 'https://www.shadcnblocks.com/block/shader2',
				components: ['Button', 'Card', 'Chip', 'Heading', 'Slider', 'Stack']
			}
		]
	},
	{
		slug: 'stats',
		title: 'Stats',
		group: 'Marketing',
		description: 'Standalone stats compositions, built with Entasis.',
		blocks: [
			{
				id: 'stats-three-column-stats',
				title: 'Three meaningful metrics',
				description:
					'A restrained three-column metric display with clear labels and supporting context.',
				file: 'stats/ThreeColumnStats.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats5',
				components: ['Button', 'Chip', 'Heading', 'Stat']
			},
			{
				id: 'stats-period-stats',
				title: 'Progress over time',
				description:
					'A split metric section with a monthly and quarterly selector that changes the snapshot.',
				file: 'stats/PeriodStats.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats12',
				components: ['Chip', 'Heading', 'SegmentedControl', 'Stat']
			},
			{
				id: 'stats-radial-stats',
				title: 'A radial progress snapshot',
				description: 'A large completion ring balances three stacked performance metrics.',
				file: 'stats/RadialStats.svelte',
				reference: 'https://www.shadcnblocks.com/block/stats17',
				components: ['Chip', 'Heading', 'ProgressCircle', 'Stat']
			}
		]
	},
	{
		slug: 'team',
		title: 'Team',
		group: 'Marketing',
		description: 'Standalone team compositions, built with Entasis.',
		blocks: [
			{
				id: 'team-centered-team',
				title: 'A team with room to breathe',
				description:
					'A centered four-person team grid with avatars, roles, and short personal introductions.',
				file: 'team/CenteredTeam.svelte',
				reference: 'https://www.shadcnblocks.com/block/team1',
				components: ['Avatar', 'Button', 'Chip', 'Heading']
			},
			{
				id: 'team-department-team',
				title: 'A compact team directory',
				description:
					'Compact people cards pair initials, short role descriptions, and department tags.',
				file: 'team/DepartmentTeam.svelte',
				reference: 'https://www.shadcnblocks.com/block/team6',
				components: ['Avatar', 'Card', 'Chip', 'Heading', 'Stack']
			},
			{
				id: 'team-filterable-team',
				title: 'Find a teammate',
				description:
					'A searchable team grid with working department tabs and an explicit empty state.',
				file: 'team/FilterableTeam.svelte',
				reference: 'https://www.shadcnblocks.com/block/team9',
				components: ['Avatar', 'Button', 'Card', 'Chip', 'Heading', 'Tabbar', 'TextInput', 'Stack']
			},
			{
				id: 'team-expert-carousel',
				title: 'A carousel of perspectives',
				description:
					'An accessible team carousel with larger expert cards and experience callouts.',
				file: 'team/ExpertCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/team8',
				components: ['Avatar', 'Button', 'Card', 'Carousel', 'Chip', 'Heading', 'Separator']
			}
		]
	},
	{
		slug: 'testimonial',
		title: 'Testimonial',
		group: 'Marketing',
		description: 'Standalone testimonial compositions, built with Entasis.',
		blocks: [
			{
				id: 'testimonial-centered-quote',
				title: 'One voice, given space',
				description:
					'A centered customer quote with a wordmark, avatar, and restrained attribution.',
				file: 'testimonial/CenteredQuote.svelte',
				reference: 'https://www.shadcnblocks.com/block/testimonial3',
				components: ['Avatar', 'Chip', 'Rating']
			},
			{
				id: 'testimonial-featured-quotes',
				title: 'A lead story with supporting voices',
				description: 'A large featured quote beside two shorter customer stories.',
				file: 'testimonial/FeaturedQuotes.svelte',
				reference: 'https://www.shadcnblocks.com/block/testimonial4',
				components: ['Avatar', 'Card', 'Heading', 'Rating', 'Stack']
			},
			{
				id: 'testimonial-quote-carousel',
				title: 'A carousel of customer stories',
				description:
					'An accessible quote carousel with keyboard-operable controls and visible attribution.',
				file: 'testimonial/QuoteCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/testimonial6',
				components: ['Avatar', 'Card', 'Carousel', 'Chip', 'Heading', 'Rating']
			},
			{
				id: 'testimonial-masonry-quotes',
				title: 'A wall of thoughtful feedback',
				description:
					'A responsive masonry-style quote collection with ratings and compact author rows.',
				file: 'testimonial/MasonryQuotes.svelte',
				reference: 'https://www.shadcnblocks.com/block/testimonial11',
				components: ['Avatar', 'Card', 'Heading', 'Rating', 'Separator', 'Stack']
			}
		]
	},
	{
		slug: 'waitlist',
		title: 'Waitlist',
		group: 'Marketing',
		description: 'Standalone waitlist compositions, built with Entasis.',
		blocks: [
			{
				id: 'waitlist-community-waitlist',
				title: 'A waitlist with a human touch',
				description:
					'A centered early-access invitation with member avatars and a local request draft.',
				file: 'waitlist/CommunityWaitlist.svelte',
				reference: 'https://www.shadcnblocks.com/block/waitlist1',
				components: ['AvatarGroup', 'Card', 'Chip', 'Form', 'Heading', 'Stack']
			},
			{
				id: 'waitlist-countdown-waitlist',
				title: 'A countdown to the next chapter',
				description:
					'A release countdown and a compact waitlist form share one centered launch panel.',
				file: 'waitlist/CountdownWaitlist.svelte',
				reference: 'https://www.shadcnblocks.com/block/waitlist2',
				components: ['Card', 'Chip', 'Form', 'Heading', 'Stack']
			}
		]
	}
];
