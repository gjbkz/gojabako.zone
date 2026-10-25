// デプロイ先のヘルスチェック（Lambda、Node.js、CommonJS）。EventBridge から 1 分ごとに呼ばれる。
// 各デプロイ先の /health を確かめ、落ちているオリジンの ID を CloudFront Function のコード
// （function.js の unhealthyOriginIds の行）に書き込んで公開し直す。状態が変わったら SNS で知らせる。
// 環境変数: ORIGINS（[{"id":"vercel","domain":"xxx.vercel.app"}, ...] の JSON）、FUNCTION_NAME、TOPIC_ARN

const unhealthyLinePattern = /^const unhealthyOriginIds = (\[.*\]);$/m;

const readUnhealthy = (code) => {
	const match = unhealthyLinePattern.exec(code);
	if (!match) {
		throw new Error("unhealthyOriginIds was not found in the function code");
	}
	return JSON.parse(match[1]);
};

const writeUnhealthy = (code, ids) =>
	code.replace(
		unhealthyLinePattern,
		`const unhealthyOriginIds = ${JSON.stringify(ids)};`,
	);

const isSameSet = (a, b) =>
	a.length === b.length && a.every((v) => b.includes(v));

// 一時的な失敗で外さないよう、失敗したら 1 回だけやり直す。
const checkOrigin = async ({ domain }, fetchFn = fetch) => {
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const res = await fetchFn(`https://${domain}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			if (res.ok) {
				return true;
			}
		} catch {
			// やり直す
		}
	}
	return false;
};

const findUnhealthy = async (origins, fetchFn = fetch) => {
	const results = await Promise.all(
		origins.map((o) => checkOrigin(o, fetchFn)),
	);
	return origins.filter((_, i) => !results[i]).map((o) => o.id);
};

const handler = async () => {
	// Lambda の Node.js ランタイムに入っている AWS SDK を使う。
	const cloudfront = require("@aws-sdk/client-cloudfront");
	const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
	const origins = JSON.parse(process.env.ORIGINS);
	const name = process.env.FUNCTION_NAME;
	const unhealthy = await findUnhealthy(origins);

	const client = new cloudfront.CloudFrontClient({});
	const current = await client.send(
		new cloudfront.GetFunctionCommand({ Name: name, Stage: "LIVE" }),
	);
	const code = new TextDecoder().decode(current.FunctionCode);
	const before = readUnhealthy(code);
	if (isSameSet(before, unhealthy)) {
		return { unhealthy, changed: false };
	}

	const described = await client.send(
		new cloudfront.DescribeFunctionCommand({
			Name: name,
			Stage: "DEVELOPMENT",
		}),
	);
	const updated = await client.send(
		new cloudfront.UpdateFunctionCommand({
			Name: name,
			IfMatch: described.ETag,
			FunctionConfig: described.FunctionSummary.FunctionConfig,
			FunctionCode: new TextEncoder().encode(writeUnhealthy(code, unhealthy)),
		}),
	);
	await client.send(
		new cloudfront.PublishFunctionCommand({
			Name: name,
			IfMatch: updated.ETag,
		}),
	);
	await new SNSClient({}).send(
		new PublishCommand({
			TopicArn: process.env.TOPIC_ARN,
			Subject: "gojabako.zone: origin health changed",
			Message: `落ちているデプロイ先: ${JSON.stringify(before)} → ${JSON.stringify(unhealthy)}`,
		}),
	);
	return { unhealthy, changed: true };
};

module.exports = { handler, readUnhealthy, writeUnhealthy, findUnhealthy };
