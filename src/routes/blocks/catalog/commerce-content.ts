import type { BlockCategory } from './types.js';

export const commerceContentCategories: BlockCategory[] = [
	{
		slug: 'address-book',
		title: 'Address Book',
		group: 'Commerce',
		description: 'Standalone address book compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'address-list',
				title: 'Editable address list',
				description:
					'Address book list with edit modes and default selection. Composed with Entasis.',
				file: 'address-book/AddressList.svelte',
				reference: 'https://www.shadcnblocks.com/block/address-book1',
				components: ['Heading', 'Button', 'Chip', 'Form']
			},
			{
				id: 'address-cards',
				title: 'Address cards',
				description: 'Card grid address book with default selection. Composed with Entasis.',
				file: 'address-book/AddressCards.svelte',
				reference: 'https://www.shadcnblocks.com/block/address-book2',
				components: ['Heading', 'Card', 'Chip', 'Button', 'Dialog', 'Form']
			}
		]
	},
	{
		slug: 'awards',
		title: 'Awards',
		group: 'Content',
		description: 'Standalone awards compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'awards-table',
				title: 'Recognition table',
				description: 'Awards table with logos and date subtitle. Composed with Entasis.',
				file: 'awards/AwardsTable.svelte',
				reference: 'https://www.shadcnblocks.com/block/awards4',
				components: ['Heading', 'Chip']
			},
			{
				id: 'accolades-rail',
				title: 'Accolades with an introduction',
				description: 'Sticky label with awards list. Composed with Entasis.',
				file: 'awards/AccoladesRail.svelte',
				reference: 'https://www.shadcnblocks.com/block/awards2',
				components: ['Heading', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'blog',
		title: 'Blog',
		group: 'Content',
		description: 'Standalone blog compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'filtered-journal',
				title: 'Filterable journal',
				description: 'Latest posts grid with filters. Composed with Entasis.',
				file: 'blog/FilteredJournal.svelte',
				reference: 'https://www.shadcnblocks.com/block/blog1',
				components: ['Heading', 'Card', 'Chip', 'Tabbar', 'Avatar']
			},
			{
				id: 'featured-journal',
				title: 'Featured story and popular posts',
				description: 'Featured article with popular posts. Composed with Entasis.',
				file: 'blog/FeaturedJournal.svelte',
				reference: 'https://www.shadcnblocks.com/block/blog14',
				components: ['Heading', 'Chip', 'Button', 'Separator']
			},
			{
				id: 'journal-rows',
				title: 'Horizontal article cards',
				description: 'Horizontal blog cards with thumbnails. Composed with Entasis.',
				file: 'blog/JournalRows.svelte',
				reference: 'https://www.shadcnblocks.com/block/blog24',
				components: ['Heading', 'Chip', 'Button']
			},
			{
				id: 'writing-archive',
				title: 'Writing archive',
				description: 'Year-grouped writing archive. Composed with Entasis.',
				file: 'blog/WritingArchive.svelte',
				reference: 'https://www.shadcnblocks.com/block/blog57',
				components: ['Heading', 'Chip']
			}
		]
	},
	{
		slug: 'blog-post',
		title: 'Blog Post',
		group: 'Content',
		description: 'Standalone blog post compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'article-sidebar',
				title: 'Article with reading rail',
				description: 'Article with sticky sidebar. Composed with Entasis.',
				file: 'blog-post/ArticleSidebar.svelte',
				reference: 'https://www.shadcnblocks.com/block/blogpost2',
				components: ['Heading', 'Avatar', 'Chip', 'Button']
			},
			{
				id: 'split-article',
				title: 'Split article and pull quote',
				description: 'Split hero with quote pull block. Composed with Entasis.',
				file: 'blog-post/SplitArticle.svelte',
				reference: 'https://www.shadcnblocks.com/block/blogpost11',
				components: ['Heading', 'Avatar', 'Separator']
			},
			{
				id: 'minimal-article',
				title: 'Minimal editorial article',
				description: 'Centered minimal article with drop cap. Composed with Entasis.',
				file: 'blog-post/MinimalArticle.svelte',
				reference: 'https://www.shadcnblocks.com/block/blogpost12',
				components: ['Heading', 'Avatar', 'Chip']
			}
		]
	},
	{
		slug: 'careers',
		title: 'Careers',
		group: 'Content',
		description: 'Standalone careers compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'department-jobs',
				title: 'Openings by department',
				description: 'Careers list grouped by department. Composed with Entasis.',
				file: 'careers/DepartmentJobs.svelte',
				reference: 'https://www.shadcnblocks.com/block/careers1',
				components: ['Heading', 'Chip', 'Button', 'Dialog']
			},
			{
				id: 'job-cards',
				title: 'Open position cards',
				description: 'Job openings grid with dashed frame. Composed with Entasis.',
				file: 'careers/JobCards.svelte',
				reference: 'https://www.shadcnblocks.com/block/careers2',
				components: ['Heading', 'Card', 'Chip', 'Button', 'Dialog']
			},
			{
				id: 'filtered-positions',
				title: 'Filterable positions',
				description: 'Filterable open positions by department. Composed with Entasis.',
				file: 'careers/FilteredPositions.svelte',
				reference: 'https://www.shadcnblocks.com/block/careers8',
				components: ['Heading', 'Tabbar', 'TextInput', 'Button', 'Dialog']
			}
		]
	},
	{
		slug: 'case-studies',
		title: 'Case Studies',
		group: 'Content',
		description: 'Standalone case studies compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'customer-grid',
				title: 'Customer story grid',
				description: 'Three-column case study grid with centered heading. Composed with Entasis.',
				file: 'case-studies/CustomerGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/case-studies11',
				components: ['Heading', 'Card', 'Chip', 'Button']
			},
			{
				id: 'story-carousel',
				title: 'Customer story carousel',
				description: 'Masked two-up landscape case study carousel. Composed with Entasis.',
				file: 'case-studies/StoryCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/case-studies10',
				components: ['Heading', 'Carousel', 'Chip', 'Button']
			},
			{
				id: 'metric-stories',
				title: 'Quotes and outcomes',
				description: 'Case studies with quotes and metrics. Composed with Entasis.',
				file: 'case-studies/MetricStories.svelte',
				reference: 'https://www.shadcnblocks.com/block/case-studies2',
				components: ['Heading', 'Avatar', 'Button', 'Separator']
			}
		]
	},
	{
		slug: 'case-study',
		title: 'Case Study',
		group: 'Content',
		description: 'Standalone case study compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'customer-case-study',
				title: 'Case study with metrics',
				description: 'Long-form case study with metrics and sidebar. Composed with Entasis.',
				file: 'case-study/CustomerCaseStudy.svelte',
				reference: 'https://www.shadcnblocks.com/block/case-study1',
				components: ['Stack', 'Heading', 'Chip', 'Card', 'Avatar']
			},
			{
				id: 'company-case-study',
				title: 'Case study with company rail',
				description: 'Case study article with company sidebar. Composed with Entasis.',
				file: 'case-study/CompanyCaseStudy.svelte',
				reference: 'https://www.shadcnblocks.com/block/case-study8',
				components: ['Heading', 'Card', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'changelog',
		title: 'Changelog',
		group: 'Content',
		description: 'Standalone changelog compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'release-rail',
				title: 'Release notes with version rail',
				description: 'Changelog with sticky version and date rail. Composed with Entasis.',
				file: 'changelog/ReleaseRail.svelte',
				reference: 'https://www.shadcnblocks.com/block/changelog1',
				components: ['Heading', 'Chip', 'Card']
			},
			{
				id: 'release-feed',
				title: 'Categorized release feed',
				description: 'Two-column changelog posts with category dots. Composed with Entasis.',
				file: 'changelog/ReleaseFeed.svelte',
				reference: 'https://www.shadcnblocks.com/block/changelog3',
				components: ['Heading', 'Tabbar', 'Chip', 'Avatar']
			}
		]
	},
	{
		slug: 'checkout',
		title: 'Checkout',
		group: 'Commerce',
		description: 'Standalone checkout compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'stepped-checkout',
				title: 'Guided checkout',
				description: 'Multi-step checkout with progress and order review. Composed with Entasis.',
				file: 'checkout/SteppedCheckout.svelte',
				reference: 'https://www.shadcnblocks.com/block/checkout12',
				components: ['Heading', 'Chip', 'Button', 'Form', 'Meter', 'Card']
			},
			{
				id: 'split-checkout',
				title: 'Checkout with order summary',
				description: 'Two-column checkout with cart and address forms. Composed with Entasis.',
				file: 'checkout/SplitCheckout.svelte',
				reference: 'https://www.shadcnblocks.com/block/checkout2',
				components: ['Heading', 'Form', 'Button', 'Chip', 'Dialog']
			}
		]
	},
	{
		slug: 'code-example',
		title: 'Code Example',
		group: 'Content',
		description: 'Standalone code example compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'language-examples',
				title: 'Language switcher',
				description: 'Tabbed database query examples in multiple languages. Composed with Entasis.',
				file: 'code-example/LanguageExamples.svelte',
				reference: 'https://www.shadcnblocks.com/block/code-example1',
				components: ['Heading', 'Tabs', 'Code', 'Chip']
			},
			{
				id: 'file-explorer',
				title: 'File explorer and code',
				description: 'File tree with selectable code preview. Composed with Entasis.',
				file: 'code-example/FileExplorer.svelte',
				reference: 'https://www.shadcnblocks.com/block/code-example4',
				components: ['Heading', 'Button', 'Code', 'Button']
			}
		]
	},
	{
		slug: 'compare-products',
		title: 'Compare Products',
		group: 'Commerce',
		description: 'Standalone compare products compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'product-comparison',
				title: 'Product comparison cards',
				description: 'Side-by-side product comparison with specs and cart. Composed with Entasis.',
				file: 'compare-products/ProductComparison.svelte',
				reference: 'https://www.shadcnblocks.com/block/compare-products1',
				components: ['Heading', 'Card', 'Chip', 'Button']
			},
			{
				id: 'specification-comparison',
				title: 'Specification comparison table',
				description: 'Product comparison table with images and pricing. Composed with Entasis.',
				file: 'compare-products/SpecificationComparison.svelte',
				reference: 'https://www.shadcnblocks.com/block/compare-products2',
				components: ['Heading', 'Button', 'Checkbox']
			}
		]
	},
	{
		slug: 'content',
		title: 'Content',
		group: 'Content',
		description: 'Standalone content compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'content-outline',
				title: 'Guide with section outline',
				description: 'Long-form story with sticky section outline. Composed with Entasis.',
				file: 'content/ContentOutline.svelte',
				reference: 'https://www.shadcnblocks.com/block/content1',
				components: ['Heading', 'Chip', 'Separator']
			},
			{
				id: 'content-hub',
				title: 'Content hub',
				description: 'Content hub explainer with type grid. Composed with Entasis.',
				file: 'content/ContentHub.svelte',
				reference: 'https://www.shadcnblocks.com/block/content2',
				components: ['Heading', 'Card', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'deals',
		title: 'Deals',
		group: 'Commerce',
		description: 'Standalone deals compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'offers-drawer',
				title: 'Offer drawer',
				description: 'Exclusive deals sheet with gift trigger. Composed with Entasis.',
				file: 'deals/OffersDrawer.svelte',
				reference: 'https://www.shadcnblocks.com/block/deals1',
				components: ['Heading', 'Dialog', 'Button', 'Chip']
			},
			{
				id: 'bundle-builder',
				title: 'Tiered bundle builder',
				description: 'Stepped bundle builder with discount tiers. Composed with Entasis.',
				file: 'deals/BundleBuilder.svelte',
				reference: 'https://www.shadcnblocks.com/block/deals2',
				components: ['Heading', 'Button', 'Checkbox', 'Meter', 'Chip']
			}
		]
	},
	{
		slug: 'ecommerce-footer',
		title: 'Ecommerce Footer',
		group: 'Commerce',
		description: 'Standalone ecommerce footer compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'store-footer',
				title: 'Store footer with preferences',
				description:
					'Ecommerce footer with newsletter, language selector, and contact row. Composed with Entasis.',
				file: 'ecommerce-footer/StoreFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-footer1',
				components: ['Button', 'Select', 'Chip']
			},
			{
				id: 'accordion-store-footer',
				title: 'Accordion store footer',
				description:
					'Accordion ecommerce footer with newsletter strip and social icons. Composed with Entasis.',
				file: 'ecommerce-footer/AccordionStoreFooter.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-footer2',
				components: ['Heading', 'Accordion', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'ecommerce-hero',
		title: 'Ecommerce Hero',
		group: 'Commerce',
		description: 'Standalone ecommerce hero compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'collection-carousel',
				title: 'Collection carousel hero',
				description: 'Full Bleed Carousel With Product Detail. Composed with Entasis.',
				file: 'ecommerce-hero/CollectionCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-hero7',
				components: ['Heading', 'Carousel', 'Button', 'Chip']
			},
			{
				id: 'split-collection',
				title: 'Split collection hero',
				description: 'Split Hero With Product Carousel. Composed with Entasis.',
				file: 'ecommerce-hero/SplitCollection.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-hero6',
				components: ['Heading', 'Carousel', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'ecommerce-navbar',
		title: 'Ecommerce Navbar',
		group: 'Commerce',
		description: 'Standalone ecommerce navbar compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'mega-store-navigation',
				title: 'Store navigation with mega menu',
				description: 'Mega Menu Storefront Navbar. Composed with Entasis.',
				file: 'ecommerce-navbar/MegaStoreNavigation.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-navbar1',
				components: ['Heading', 'Popover', 'Button', 'Chip', 'TextInput']
			},
			{
				id: 'layered-store-navigation',
				title: 'Store navigation with categories',
				description: 'Layered Dropdown Store Navbar. Composed with Entasis.',
				file: 'ecommerce-navbar/LayeredStoreNavigation.svelte',
				reference: 'https://www.shadcnblocks.com/block/ecommerce-navbar2',
				components: ['Heading', 'Popover', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'experience',
		title: 'Experience',
		group: 'Content',
		description: 'Standalone experience compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'experience-rows',
				title: 'Experience rows',
				description: 'Work history rows with CV download. Composed with Entasis.',
				file: 'experience/ExperienceRows.svelte',
				reference: 'https://www.shadcnblocks.com/block/experience1',
				components: ['Heading', 'Chip', 'Button']
			},
			{
				id: 'experience-timeline',
				title: 'Experience timeline',
				description: 'Sticky intro with timeline column. Composed with Entasis.',
				file: 'experience/ExperienceTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/experience2',
				components: ['Heading', 'Timeline', 'Avatar']
			}
		]
	},
	{
		slug: 'gallery',
		title: 'Gallery',
		group: 'Content',
		description: 'Standalone gallery compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'photo-grid',
				title: 'Three column photo gallery',
				description: 'Three column image grid. Composed with Entasis.',
				file: 'gallery/PhotoGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/gallery40',
				components: ['Heading', 'ImageZoom']
			},
			{
				id: 'photo-mosaic',
				title: 'Asymmetric photo mosaic',
				description: 'Asymmetric bento image grid. Composed with Entasis.',
				file: 'gallery/PhotoMosaic.svelte',
				reference: 'https://www.shadcnblocks.com/block/gallery45',
				components: ['Heading', 'ImageZoom', 'Chip']
			},
			{
				id: 'photo-carousel',
				title: 'Captioned photo carousel',
				description: 'Single slide gallery carousel. Composed with Entasis.',
				file: 'gallery/PhotoCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/gallery44',
				components: ['Heading', 'Carousel', 'Chip']
			},
			{
				id: 'filtered-gallery',
				title: 'Filterable photo gallery',
				description: 'Filterable category gallery. Composed with Entasis.',
				file: 'gallery/FilteredGallery.svelte',
				reference: 'https://www.shadcnblocks.com/block/gallery46',
				components: ['Heading', 'Tabbar', 'ImageZoom', 'Chip']
			}
		]
	},
	{
		slug: 'incentives',
		title: 'Incentives',
		group: 'Commerce',
		description: 'Standalone incentives compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'service-incentives',
				title: 'Shopping service row',
				description: 'Icon row of shopping incentives. Composed with Entasis.',
				file: 'incentives/ServiceIncentives.svelte',
				reference: 'https://www.shadcnblocks.com/block/incentives1',
				components: ['Heading', 'Icons']
			},
			{
				id: 'incentive-band',
				title: 'Shopping incentive band',
				description: 'Centered incentives on a primary band. Composed with Entasis.',
				file: 'incentives/IncentiveBand.svelte',
				reference: 'https://www.shadcnblocks.com/block/incentives2',
				components: ['Heading', 'Icons']
			}
		]
	},
	{
		slug: 'live-purchase',
		title: 'Live Purchase',
		group: 'Commerce',
		description: 'Standalone live purchase compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'purchase-notification',
				title: 'Purchase notification preview',
				description: 'Rotating purchase toast card. Composed with Entasis.',
				file: 'live-purchase/PurchaseNotification.svelte',
				reference: 'https://www.shadcnblocks.com/block/live-purchase1',
				components: ['Heading', 'Card', 'Button', 'Chip']
			},
			{
				id: 'purchase-pill',
				title: 'Purchase activity pill',
				description: 'Live purchase pill with location. Composed with Entasis.',
				file: 'live-purchase/PurchasePill.svelte',
				reference: 'https://www.shadcnblocks.com/block/live-purchase2',
				components: ['Heading', 'Avatar', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'offer-modal',
		title: 'Offer Modal',
		group: 'Commerce',
		description: 'Standalone offer modal compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'welcome-offer',
				title: 'Welcome offer dialog',
				description: 'Corner newsletter discount modal. Composed with Entasis.',
				file: 'offer-modal/WelcomeOffer.svelte',
				reference: 'https://www.shadcnblocks.com/block/offer-modal1',
				components: ['Heading', 'Dialog', 'Button', 'Form', 'Chip']
			},
			{
				id: 'member-offer',
				title: 'Membership offer dialog',
				description: 'Membership offer modal with photo. Composed with Entasis.',
				file: 'offer-modal/MemberOffer.svelte',
				reference: 'https://www.shadcnblocks.com/block/offer-modal4',
				components: ['Heading', 'Dialog', 'Button', 'Chip', 'Checkbox']
			}
		]
	},
	{
		slug: 'order-history',
		title: 'Order History',
		group: 'Commerce',
		description: 'Standalone order history compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'order-tabs',
				title: 'Order history with status filters',
				description: 'Order history with status tabs. Composed with Entasis.',
				file: 'order-history/OrderTabs.svelte',
				reference: 'https://www.shadcnblocks.com/block/order-history1',
				components: ['Heading', 'Tabbar', 'Chip', 'Button', 'Dialog']
			},
			{
				id: 'order-accordion',
				title: 'Expandable order history',
				description: 'Collapsible order history with filters. Composed with Entasis.',
				file: 'order-history/OrderAccordion.svelte',
				reference: 'https://www.shadcnblocks.com/block/order-history2',
				components: ['Heading', 'Accordion', 'TextInput', 'Chip', 'Button', 'Dialog']
			}
		]
	},
	{
		slug: 'order-summary',
		title: 'Order Summary',
		group: 'Commerce',
		description: 'Standalone order summary compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'order-receipt',
				title: 'Itemized order receipt',
				description: 'Order confirmation with itemized totals. Composed with Entasis.',
				file: 'order-summary/OrderReceipt.svelte',
				reference: 'https://www.shadcnblocks.com/block/order-summary1',
				components: ['Heading', 'Chip', 'Card', 'Button']
			},
			{
				id: 'delivery-summary',
				title: 'Order delivery timeline',
				description: 'Order confirmation with status timeline. Composed with Entasis.',
				file: 'order-summary/DeliverySummary.svelte',
				reference: 'https://www.shadcnblocks.com/block/order-summary4',
				components: ['Heading', 'Timeline', 'Chip', 'Card']
			}
		]
	},
	{
		slug: 'our-story',
		title: 'Our Story',
		group: 'Content',
		description: 'Standalone our story compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'story-chapters',
				title: 'Brand story chapters',
				description: 'Tabbed brand timeline. Composed with Entasis.',
				file: 'our-story/StoryChapters.svelte',
				reference: 'https://www.shadcnblocks.com/block/our-story1',
				components: ['Heading', 'Tabs', 'Chip']
			},
			{
				id: 'story-timeline',
				title: 'Brand story timeline',
				description: 'Sticky vertical timeline. Composed with Entasis.',
				file: 'our-story/StoryTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/our-story4',
				components: ['Heading', 'Timeline']
			}
		]
	},
	{
		slug: 'payment-methods',
		title: 'Payment Methods',
		group: 'Commerce',
		description: 'Standalone payment methods compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'payment-list',
				title: 'Editable payment methods',
				description: 'Payment methods list with inline edit. Composed with Entasis.',
				file: 'payment-methods/PaymentList.svelte',
				reference: 'https://www.shadcnblocks.com/block/payment-methods1',
				components: ['Heading', 'Chip', 'Button', 'Form']
			},
			{
				id: 'payment-cards',
				title: 'Payment card selection',
				description: 'Payment methods grid with default card. Composed with Entasis.',
				file: 'payment-methods/PaymentCards.svelte',
				reference: 'https://www.shadcnblocks.com/block/payment-methods2',
				components: ['Heading', 'Button', 'Chip', 'Dialog', 'Form']
			}
		]
	},
	{
		slug: 'product-card',
		title: 'Product Card',
		group: 'Commerce',
		description: 'Standalone product card compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'sale-product',
				title: 'Sale product card',
				description: 'Product card with sale badge. Composed with Entasis.',
				file: 'product-card/SaleProduct.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-card1',
				components: ['Card', 'Chip', 'Button', 'Rating']
			},
			{
				id: 'variant-product',
				title: 'Color variant product card',
				description: 'Product card with color variants. Composed with Entasis.',
				file: 'product-card/VariantProduct.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-card6',
				components: ['Card', 'Button']
			},
			{
				id: 'configurable-product',
				title: 'Configurable product card',
				description: 'Product card with expandable cart form. Composed with Entasis.',
				file: 'product-card/ConfigurableProduct.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-card8',
				components: ['Card', 'Chip', 'Button', 'Select', 'NumberInput']
			}
		]
	},
	{
		slug: 'product-categories',
		title: 'Product Categories',
		group: 'Commerce',
		description:
			'Standalone product categories compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'collection-banner',
				title: 'Split category banner',
				description: 'Split category banner with image. Composed with Entasis.',
				file: 'product-categories/CollectionBanner.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-categories1',
				components: ['Heading', 'Chip', 'Button']
			},
			{
				id: 'category-grid',
				title: 'Category card grid',
				description: 'Category card grid. Composed with Entasis.',
				file: 'product-categories/CategoryGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-categories2',
				components: ['Heading', 'Card']
			}
		]
	},
	{
		slug: 'product-detail',
		title: 'Product Detail',
		group: 'Commerce',
		description: 'Standalone product detail compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'technical-product',
				title: 'Technical product detail',
				description: 'Product detail with specs list. Composed with Entasis.',
				file: 'product-detail/TechnicalProduct.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-detail1',
				components: ['Heading', 'Chip', 'Button', 'Rating', 'Accordion', 'NumberInput']
			},
			{
				id: 'apparel-product',
				title: 'Apparel with size and color',
				description: 'Product detail with color and size. Composed with Entasis.',
				file: 'product-detail/ApparelProduct.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-detail3',
				components: ['Heading', 'Chip', 'Button', 'Select', 'Accordion']
			},
			{
				id: 'product-editorial',
				title: 'Three column product detail',
				description: 'Product detail with three-column layout. Composed with Entasis.',
				file: 'product-detail/ProductEditorial.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-detail10',
				components: ['Heading', 'Chip', 'Button', 'Rating']
			}
		]
	},
	{
		slug: 'product-gallery',
		title: 'Product Gallery',
		group: 'Commerce',
		description: 'Standalone product gallery compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'product-carousel',
				title: 'Product view carousel',
				description: 'Product image carousel and grid. Composed with Entasis.',
				file: 'product-gallery/ProductCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-gallery1',
				components: ['Heading', 'Carousel', 'Chip']
			},
			{
				id: 'product-thumbnails',
				title: 'Product thumbnail gallery',
				description: 'Thumbnail sidebar product gallery. Composed with Entasis.',
				file: 'product-gallery/ProductThumbnails.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-gallery4',
				components: ['Heading', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'product-list',
		title: 'Product List',
		group: 'Commerce',
		description: 'Standalone product list compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'collection-grid',
				title: 'Product collection grid',
				description: 'Product grid with badges. Composed with Entasis.',
				file: 'product-list/CollectionGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-list1',
				components: ['Heading', 'Card', 'Chip', 'Button', 'Select']
			},
			{
				id: 'collection-tabs',
				title: 'Tabbed product collections',
				description: 'Tabbed product carousel with promo. Composed with Entasis.',
				file: 'product-list/CollectionTabs.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-list9',
				components: ['Heading', 'Tabs', 'Carousel', 'Button', 'Chip']
			},
			{
				id: 'product-rows',
				title: 'Product rows and collection promo',
				description: 'Product rows with featured promo. Composed with Entasis.',
				file: 'product-list/ProductRows.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-list10',
				components: ['Heading', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'product-quick-view',
		title: 'Product Quick View',
		group: 'Commerce',
		description:
			'Standalone product quick view compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'variant-quick-view',
				title: 'Variant quick view dialog',
				description: 'Dialog quick view with variants. Composed with Entasis.',
				file: 'product-quick-view/VariantQuickView.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-quick-view4',
				components: ['Heading', 'Card', 'Button', 'Chip', 'Dialog', 'Select']
			},
			{
				id: 'product-quick-drawer',
				title: 'Product quick view drawer',
				description: 'Sheet quick view with rating. Composed with Entasis.',
				file: 'product-quick-view/ProductQuickDrawer.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-quick-view6',
				components: ['Heading', 'Button', 'Dialog', 'Rating', 'Accordion']
			}
		]
	},
	{
		slug: 'product-search',
		title: 'Product Search',
		group: 'Commerce',
		description: 'Standalone product search compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'search-popover',
				title: 'Search product popover',
				description: 'Search popover with product carousel. Composed with Entasis.',
				file: 'product-search/SearchPopover.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-search1',
				components: ['Heading', 'Popover', 'Button', 'TextInput', 'Empty', 'Chip']
			},
			{
				id: 'search-drawer',
				title: 'Product search drawer',
				description: 'Search sheet with product results. Composed with Entasis.',
				file: 'product-search/SearchDrawer.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-search2',
				components: ['Heading', 'Dialog', 'Button', 'TextInput', 'Empty', 'Tabbar']
			}
		]
	},
	{
		slug: 'product-specs',
		title: 'Product Specs',
		group: 'Commerce',
		description: 'Standalone product specs compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'specification-accordion',
				title: 'Expandable specifications',
				description: 'Collapsible product spec tables. Composed with Entasis.',
				file: 'product-specs/SpecificationAccordion.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-specs1',
				components: ['Heading', 'Accordion', 'Chip']
			},
			{
				id: 'specification-tabs',
				title: 'Specification tabs',
				description: 'Tabbed product specifications. Composed with Entasis.',
				file: 'product-specs/SpecificationTabs.svelte',
				reference: 'https://www.shadcnblocks.com/block/product-specs2',
				components: ['Heading', 'Tabs', 'Card']
			}
		]
	},
	{
		slug: 'project',
		title: 'Project',
		group: 'Content',
		description: 'Standalone project compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'project-metadata',
				title: 'Project detail with metadata',
				description: 'Project detail with serif title and metadata columns. Composed with Entasis.',
				file: 'project/ProjectMetadata.svelte',
				reference: 'https://www.shadcnblocks.com/block/project2',
				components: ['Heading', 'Chip', 'Button']
			},
			{
				id: 'project-narrative',
				title: 'Project narrative',
				description:
					'Long-form case study with prose content and breakout images. Composed with Entasis.',
				file: 'project/ProjectNarrative.svelte',
				reference: 'https://www.shadcnblocks.com/block/project4',
				components: ['Heading', 'Chip', 'ImageZoom']
			},
			{
				id: 'exhibition-project',
				title: 'Exhibition and material details',
				description:
					'Exhibition project with metadata table and image gallery. Composed with Entasis.',
				file: 'project/ExhibitionProject.svelte',
				reference: 'https://www.shadcnblocks.com/block/project5',
				components: ['Heading', 'Chip', 'Button']
			},
			{
				id: 'architecture-project',
				title: 'Architectural project gallery',
				description:
					'Architectural case study with hero, carousel, and image grid. Composed with Entasis.',
				file: 'project/ArchitectureProject.svelte',
				reference: 'https://www.shadcnblocks.com/block/project7',
				components: ['Heading', 'Carousel']
			}
		]
	},
	{
		slug: 'projects',
		title: 'Projects',
		group: 'Content',
		description: 'Standalone projects compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'portfolio-cards',
				title: 'Selected project cards',
				description: 'Animated project cards with year badges. Composed with Entasis.',
				file: 'projects/PortfolioCards.svelte',
				reference: 'https://www.shadcnblocks.com/block/projects5',
				components: ['Heading', 'Chip']
			},
			{
				id: 'filtered-portfolio',
				title: 'Filterable portfolio',
				description: 'Three-column filterable gallery with overlays. Composed with Entasis.',
				file: 'projects/FilteredPortfolio.svelte',
				reference: 'https://www.shadcnblocks.com/block/projects8',
				components: ['Heading', 'Tabbar', 'Chip']
			},
			{
				id: 'portfolio-carousel',
				title: 'Project carousel',
				description: 'Project card carousel with full metadata. Composed with Entasis.',
				file: 'projects/PortfolioCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/projects17b',
				components: ['Heading', 'Carousel', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'promo-banner',
		title: 'Promo Banner',
		group: 'Commerce',
		description: 'Standalone promo banner compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'shipping-progress',
				title: 'Free shipping progress',
				description: 'Free shipping progress banner. Composed with Entasis.',
				file: 'promo-banner/ShippingProgress.svelte',
				reference: 'https://www.shadcnblocks.com/block/promo-banner1',
				components: ['Heading', 'Meter', 'Button', 'Chip']
			},
			{
				id: 'seasonal-promotion',
				title: 'Seasonal sale banner',
				description: 'Sale banner with shop-now link. Composed with Entasis.',
				file: 'promo-banner/SeasonalPromotion.svelte',
				reference: 'https://www.shadcnblocks.com/block/promo-banner2',
				components: ['Heading', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'resource',
		title: 'Resource',
		group: 'Content',
		description: 'Standalone resource compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'guide-resource',
				title: 'Guide with resource sidebar',
				description: 'Resource detail with breadcrumb and sticky sidebar. Composed with Entasis.',
				file: 'resource/GuideResource.svelte',
				reference: 'https://www.shadcnblocks.com/block/resource3',
				components: ['Heading', 'Breadcrumbs', 'Card', 'Chip', 'Button']
			},
			{
				id: 'article-resource',
				title: 'Resource article and share link',
				description: 'Article detail with social share. Composed with Entasis.',
				file: 'resource/ArticleResource.svelte',
				reference: 'https://www.shadcnblocks.com/block/resource2',
				components: ['Heading', 'Avatar', 'Button', 'Chip']
			}
		]
	},
	{
		slug: 'resources',
		title: 'Resources',
		group: 'Content',
		description: 'Standalone resources compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'resource-library',
				title: 'Searchable resource library',
				description: 'Resources page with category filter and email form. Composed with Entasis.',
				file: 'resources/ResourceLibrary.svelte',
				reference: 'https://www.shadcnblocks.com/block/resources1',
				components: ['Heading', 'TextInput', 'Tabbar', 'Card', 'Chip', 'Button']
			},
			{
				id: 'featured-resources',
				title: 'Featured resource and reading list',
				description: 'Featured resource with article list. Composed with Entasis.',
				file: 'resources/FeaturedResources.svelte',
				reference: 'https://www.shadcnblocks.com/block/resources3',
				components: ['Heading', 'Chip', 'Button', 'Separator']
			}
		]
	},
	{
		slug: 'reviews',
		title: 'Reviews',
		group: 'Commerce',
		description: 'Standalone reviews compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'review-list',
				title: 'Customer review list',
				description: 'Customer review list with average rating. Composed with Entasis.',
				file: 'reviews/ReviewList.svelte',
				reference: 'https://www.shadcnblocks.com/block/reviews1',
				components: ['Heading', 'Rating', 'Avatar', 'Chip']
			},
			{
				id: 'review-distribution',
				title: 'Rating distribution and reviews',
				description: 'Reviews with rating distribution sidebar. Composed with Entasis.',
				file: 'reviews/ReviewDistribution.svelte',
				reference: 'https://www.shadcnblocks.com/block/reviews2',
				components: ['Heading', 'Meter', 'Rating', 'Button', 'Avatar']
			},
			{
				id: 'helpful-reviews',
				title: 'Photo reviews with helpful votes',
				description: 'Photo reviews with helpful votes. Composed with Entasis.',
				file: 'reviews/HelpfulReviews.svelte',
				reference: 'https://www.shadcnblocks.com/block/reviews3',
				components: ['Heading', 'Rating', 'Avatar', 'Chip', 'Button']
			}
		]
	},
	{
		slug: 'shop-the-look',
		title: 'Shop The Look',
		group: 'Commerce',
		description: 'Standalone shop the look compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'outfit-builder',
				title: 'Outfit builder',
				description: 'Outfit builder with variants. Composed with Entasis.',
				file: 'shop-the-look/OutfitBuilder.svelte',
				reference: 'https://www.shadcnblocks.com/block/shop-the-look2',
				components: ['Heading', 'Button', 'Checkbox', 'Select']
			},
			{
				id: 'complementary-bundle',
				title: 'Frequently bought together',
				description: 'Frequently bought together bundle. Composed with Entasis.',
				file: 'shop-the-look/ComplementaryBundle.svelte',
				reference: 'https://www.shadcnblocks.com/block/shop-the-look3',
				components: ['Heading', 'Button', 'Checkbox', 'Chip']
			}
		]
	},
	{
		slug: 'shopping-cart',
		title: 'Shopping Cart',
		group: 'Commerce',
		description: 'Standalone shopping cart compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'page-cart',
				title: 'Shopping bag page',
				description: 'Simple page shopping cart. Composed with Entasis.',
				file: 'shopping-cart/PageCart.svelte',
				reference: 'https://www.shadcnblocks.com/block/shopping-cart1',
				components: ['Heading', 'Chip', 'Button', 'NumberInput', 'Card', 'Empty', 'Dialog', 'Meter']
			},
			{
				id: 'cart-drawer',
				title: 'Shopping bag drawer',
				description: 'Sheet cart with product cards. Composed with Entasis.',
				file: 'shopping-cart/CartDrawer.svelte',
				reference: 'https://www.shadcnblocks.com/block/shopping-cart14',
				components: ['Heading', 'Button', 'Dialog', 'NumberInput', 'Empty', 'Chip']
			},
			{
				id: 'mini-cart',
				title: 'Compact cart popover',
				description: 'Popover cart with express checkout. Composed with Entasis.',
				file: 'shopping-cart/MiniCart.svelte',
				reference: 'https://www.shadcnblocks.com/block/shopping-cart20',
				components: ['Heading', 'Popover', 'Button', 'Chip', 'Dialog', 'Empty']
			}
		]
	},
	{
		slug: 'skills',
		title: 'Skills',
		group: 'Content',
		description: 'Standalone skills compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'tool-experience',
				title: 'Tools and experience list',
				description: 'Sticky tools list with experience badges. Composed with Entasis.',
				file: 'skills/ToolExperience.svelte',
				reference: 'https://www.shadcnblocks.com/block/skills1',
				components: ['Heading', 'Chip']
			},
			{
				id: 'tool-grid',
				title: 'Tools and usage grid',
				description: 'Two-column tools grid with usage. Composed with Entasis.',
				file: 'skills/ToolGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/skills2',
				components: ['Heading', 'Card', 'Chip']
			}
		]
	},
	{
		slug: 'social-media-trending',
		title: 'Social Media Trending',
		group: 'Content',
		description:
			'Standalone social media trending compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'social-carousel',
				title: 'Community photo carousel',
				description: 'Auto-Scroll Image Carousel. Composed with Entasis.',
				file: 'social-media-trending/SocialCarousel.svelte',
				reference: 'https://www.shadcnblocks.com/block/social-media-trending2',
				components: ['Heading', 'Carousel', 'Avatar', 'Chip']
			},
			{
				id: 'creator-gallery',
				title: 'Featured creator gallery',
				description: 'Featured Profile Image Grid. Composed with Entasis.',
				file: 'social-media-trending/CreatorGallery.svelte',
				reference: 'https://www.shadcnblocks.com/block/social-media-trending3',
				components: ['Heading', 'Avatar', 'Button', 'ImageZoom', 'Chip']
			}
		]
	},
	{
		slug: 'timeline',
		title: 'Timeline',
		group: 'Content',
		description: 'Standalone timeline compositions for editorial sites and portfolios.',
		blocks: [
			{
				id: 'launch-timeline',
				title: 'Horizontal launch timeline',
				description: 'Horizontal phase timeline with progress. Composed with Entasis.',
				file: 'timeline/LaunchTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/timeline11',
				components: ['Heading', 'Timeline', 'Chip']
			},
			{
				id: 'phase-timeline',
				title: 'Vertical project phases',
				description: 'Vertical Icon Phase Timeline. Composed with Entasis.',
				file: 'timeline/PhaseTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/timeline20',
				components: ['Heading', 'Timeline', 'Chip']
			},
			{
				id: 'interactive-timeline',
				title: 'Interactive project timeline',
				description: 'Interactive stepper with progress bar. Composed with Entasis.',
				file: 'timeline/InteractiveTimeline.svelte',
				reference: 'https://www.shadcnblocks.com/block/timeline7',
				components: ['Heading', 'Button', 'Meter', 'Chip']
			}
		]
	},
	{
		slug: 'trust-strip',
		title: 'Trust Strip',
		group: 'Commerce',
		description: 'Standalone trust strip compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'store-guarantees',
				title: 'Store guarantee strip',
				description: 'Icon grid of store guarantees. Composed with Entasis.',
				file: 'trust-strip/StoreGuarantees.svelte',
				reference: 'https://www.shadcnblocks.com/block/trust-strip1',
				components: ['Heading', 'Icons']
			},
			{
				id: 'ratings-press',
				title: 'Ratings and press strip',
				description: 'Ratings strip with press logos. Composed with Entasis.',
				file: 'trust-strip/RatingsPress.svelte',
				reference: 'https://www.shadcnblocks.com/block/trust-strip2',
				components: ['Rating', 'Chip', 'Separator']
			}
		]
	},
	{
		slug: 'wishlist',
		title: 'Wishlist',
		group: 'Commerce',
		description: 'Standalone wishlist compositions for storefronts and customer accounts.',
		blocks: [
			{
				id: 'wishlist-grid',
				title: 'Wishlist product grid',
				description: 'Wishlist grid with price-drop badges. Composed with Entasis.',
				file: 'wishlist/WishlistGrid.svelte',
				reference: 'https://www.shadcnblocks.com/block/wishlist1',
				components: ['Heading', 'Button', 'Card', 'Chip', 'Empty']
			},
			{
				id: 'wishlist-rows',
				title: 'Sortable wishlist',
				description: 'Wishlist list with sort and share. Composed with Entasis.',
				file: 'wishlist/WishlistRows.svelte',
				reference: 'https://www.shadcnblocks.com/block/wishlist2',
				components: ['Heading', 'Button', 'Select', 'Empty']
			}
		]
	}
];
