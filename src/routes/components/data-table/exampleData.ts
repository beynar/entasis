export type PersonStatus = 'Active' | 'Invited' | 'Suspended';

export type Person = {
	id: string;
	name: string;
	email: string;
	department: string;
	role: string;
	status: PersonStatus;
	salary: number;
	joinedAt: Date;
	verified: boolean;
};

export const departments = ['Design', 'Engineering', 'Finance', 'Operations', 'Sales'] as const;
export const statuses = ['Active', 'Invited', 'Suspended'] as const;

const firstNames = [
	'Ada',
	'Grace',
	'Margaret',
	'Katherine',
	'Linus',
	'Barbara',
	'Donald',
	'Radia',
	'Ken',
	'Frances',
	'James',
	'Evelyn'
] as const;

const lastNames = [
	'Lovelace',
	'Hopper',
	'Hamilton',
	'Johnson',
	'Torvalds',
	'Liskov',
	'Knuth',
	'Perlman',
	'Thompson',
	'Allen',
	'Gosling',
	'Boyd'
] as const;

const roles = ['Designer', 'Engineer', 'Manager', 'Analyst', 'Director'] as const;

export function createPeople(count: number): Person[] {
	return Array.from({ length: count }, (_, index) => {
		const firstName = firstNames[index % firstNames.length];
		const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
		const department = departments[index % departments.length];
		return {
			id: `person-${index + 1}`,
			name: `${firstName} ${lastName}`,
			email: `${firstName}.${lastName}.${index + 1}@example.com`.toLowerCase(),
			department,
			role: roles[(index * 3) % roles.length],
			status: statuses[(index * 2) % statuses.length],
			salary: 62000 + ((index * 7919) % 98000),
			joinedAt: new Date(2021 + (index % 5), (index * 7) % 12, (index % 27) + 1),
			verified: index % 3 !== 1
		};
	});
}

const salaryFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});
const joinedAtFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const formatSalary = (value: unknown) =>
	typeof value === 'number' && Number.isFinite(value) ? salaryFormatter.format(value) : '';

export const formatJoinedAt = (value: unknown) =>
	value instanceof Date ? joinedAtFormatter.format(value) : '';

export const statusColor = (status: PersonStatus): 'success' | 'warning' | 'info' => {
	if (status === 'Active') return 'success';
	if (status === 'Suspended') return 'warning';
	return 'info';
};
