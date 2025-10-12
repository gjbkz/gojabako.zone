import { HttpStatusCode } from "@nlib/typing";
import { encodeToUint8Array } from "../../util/encodeToUint8Array.ts";
import { pageList } from "../../util/pageList.ts";
import { site } from "../../util/site.ts";

export const GET = () => {
	return new Response(
		new Blob([encodeToUint8Array(selialize()) as ArrayBufferView<ArrayBuffer>]),
		{
			status: HttpStatusCode.OK,
			headers: {
				"content-type": "application/xml; charset=utf-8",
				"cache-control": "max-age=10800",
			},
		},
	);
};

const selialize = function* () {
	yield '<?xml version="1.0" encoding="utf-8"?>\n';
	yield '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
	for (const page of pageList) {
		yield "  <url>\n";
		yield `    <loc>${new URL(page.path, site.baseUrl)}</loc>\n`;
		yield `    <lastmod>${page.updatedAt}</lastmod>\n`;
		yield "  </url>\n";
	}
	yield "</urlset>\n";
};
