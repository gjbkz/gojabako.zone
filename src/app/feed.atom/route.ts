import { HttpStatusCode } from "@nlib/typing";
import { encodeToUint8Array } from "../../util/encodeToUint8Array.ts";
import { pageList } from "../../util/pageList.ts";
import { site } from "../../util/site.ts";

export const GET = () => {
	return new Response(
		encodeToUint8Array(selialize()) as ArrayBufferView<ArrayBuffer>,
		{
			status: HttpStatusCode.OK,
			headers: {
				"content-type": "application/atom+xml; charset=utf-8",
				"cache-control": "max-age=10800",
			},
		},
	);
};

const selialize = function* () {
	yield '<?xml version="1.0" encoding="utf-8"?>\n';
	yield '<feed xmlns="http://www.w3.org/2005/Atom">\n';
	yield `  <title>${site.name}</title>\n`;
	yield `  <link href="${site.baseUrl}"/>\n`;
	let updated = 0;
	for (const page of pageList) {
		updated = Math.max(updated, Date.parse(page.updatedAt));
	}
	yield `  <updated>${new Date(updated).toISOString()}</updated>\n`;
	yield `  <id>${site.baseUrl}</id>\n`;
	for (const page of pageList) {
		yield "  <entry>\n";
		yield `    <id>${page.iri}</id>\n`;
		yield `    <title>${page.title.join("")}</title>\n`;
		yield `    <link href="${new URL(page.path, site.baseUrl)}"/>\n`;
		yield `    <updated>${page.updatedAt}</updated>\n`;
		yield `    <published>${page.publishedAt}</published>\n`;
		yield "  </entry>\n";
	}
	yield "</feed>\n";
};
