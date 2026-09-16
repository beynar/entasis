export const bind = (ref: object, props: object) => {
	const descriptors = Object.getOwnPropertyDescriptors(props);
	for (const key in descriptors) {
		Object.defineProperty(ref, key, descriptors[key]);
	}
};
