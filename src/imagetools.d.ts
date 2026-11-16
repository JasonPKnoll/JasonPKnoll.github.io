// Single-image vite-imagetools imports, e.g. `photo.jpg?w=800&format=jpg&as=url`.
declare module '*&as=url' {
	const src: string;
	export default src;
}
