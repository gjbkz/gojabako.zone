import type { Author } from "next/dist/lib/metadata/types/metadata-types";

const baseUrl = new URL("https://gojabako.zone/");
const author: Author = {
	name: "伊藤 慶 - Kei Ito",
	url: baseUrl,
};
const namespace = "gjbkz";
export const site = {
	name: "Gojabako Zone",
	namespace,
	baseUrl,
	repositoryUrl: new URL("https://github.com/gjbkz/gojabako.zone/"),
	vercelBaseUrl: new URL("https://gojabako-zone-gjbkzs-projects.vercel.app/"),
	author,
	themeColor: "hsla(0,0%,100%,0.8)",
	logo: {
		viewBox: [0, 0, 8, 4],
		d: "M0 0H2V1H1V2H2V4H0zM3 0H5V4H3V2H4V1H3zM6 0H8V4H7V3H6z",
	},
	iri: (pagePath: string) => `${namespace}://${baseUrl.hostname}${pagePath}`,
};
