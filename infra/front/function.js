import cf from "cloudfront";

// CloudFront Functions (cloudfront-js-2.0) の viewer request で動く。
// 今の src/proxy.ts のうち外部通信の要らない処理と、デプロイ先の振り分けを担当する。

// originId は CloudFront のディストリビューションに登録したオリジンの ID。
// label は /apphost で返す表示名。weight は振り分けの比率。
const origins = [
	{ originId: "vercel", label: "Vercel", weight: 1 },
	{ originId: "netlify", label: "Netlify", weight: 1 },
	{ originId: "cloudrun", label: "Cloud Run", weight: 1 },
	{ originId: "aws", label: "AWS", weight: 1 },
];

// 主オリジンがこのステータスを返すか、接続できなければ予備オリジンに切り替える。
const failoverStatusCodes = [500, 502, 503, 504];

const forbiddenSuffixes = [
	".env",
	".exe",
	".sh",
	".bat",
	".ini",
	".pwd",
	".sql",
	".db",
	".yml",
	".key",
	".pem",
	".zip",
];

const forbiddenPrefixes = [
	"/admin",
	"/debug",
	"/.aws",
	"/.ssh",
	"/.svn",
	"/.env",
	"/.git",
	"/.vscode",
	"/.kube",
	"/config",
	"/_vti_pvt",
	"/wp",
	"/wordpress",
];

function isForbidden(uri) {
	return (
		/\.php\d*$/.test(uri) ||
		uri.includes("wp-") ||
		uri.includes("phpinfo") ||
		forbiddenSuffixes.some((v) => uri.endsWith(v)) ||
		forbiddenPrefixes.some((v) => uri.startsWith(v))
	);
}

// 同じ訪問者を同じ日のあいだ同じ主オリジンに振るためのハッシュ（djb2）。
function hash(text) {
	let h = 5381;
	for (let i = 0; i < text.length; i++) {
		h = (h * 33 + text.charCodeAt(i)) % 4294967296;
	}
	return h;
}

function pickByWeight(candidates, seed) {
	let total = 0;
	for (const o of candidates) {
		total += o.weight;
	}
	let point = seed % total;
	for (const o of candidates) {
		if (point < o.weight) {
			return o;
		}
		point -= o.weight;
	}
	return candidates[candidates.length - 1];
}

function pickOrigins(viewerIp, now) {
	const day = Math.floor(now / 86400000);
	const seed = hash(`${viewerIp}|${day}`);
	const primary = pickByWeight(origins, seed);
	const rest = origins.filter((o) => o !== primary);
	const secondary = pickByWeight(rest, Math.floor(seed / 65536));
	return { primary, secondary };
}

function textResponse(statusCode, contentType, data) {
	return {
		statusCode,
		headers: {
			"content-type": { value: contentType },
			"cache-control": { value: "no-store" },
		},
		body: { encoding: "text", data },
	};
}

// CloudFront Functions が名前で呼び出す。
// biome-ignore lint/correctness/noUnusedVariables: entry point of CloudFront Functions
function handler(event) {
	const request = event.request;
	const uri = request.uri;
	if (uri === "/health") {
		return textResponse(200, "text/plain", "OK");
	}
	if (isForbidden(uri)) {
		return { statusCode: 403, statusDescription: "Forbidden" };
	}
	if (uri === "/favicon.ico") {
		return {
			statusCode: 307,
			statusDescription: "Temporary Redirect",
			headers: { location: { value: "/icon" } },
		};
	}
	const { primary, secondary } = pickOrigins(event.viewer.ip, Date.now());
	if (uri === "/apphost") {
		return textResponse(200, "application/json", JSON.stringify(primary.label));
	}
	cf.createRequestOriginGroup({
		originIds: [
			{ originId: primary.originId },
			{ originId: secondary.originId },
		],
		failoverCriteria: { statusCodes: failoverStatusCodes },
	});
	return request;
}
