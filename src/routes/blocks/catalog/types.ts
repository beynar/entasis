export type BlockGroup = 'Marketing' | 'Application' | 'Commerce' | 'Content';

export interface BlockDefinition {
	id: string;
	title: string;
	description: string;
	/** Source file relative to the catalog directory. */
	file: string;
	/** The inspected layout that this Entasis composition adapts. */
	reference: string;
	components: string[];
}

export interface BlockCategory {
	slug: string;
	title: string;
	group: BlockGroup;
	description: string;
	blocks: BlockDefinition[];
}
