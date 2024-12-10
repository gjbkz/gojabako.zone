import mdx from "@next/mdx";
import { all } from "lowlight";
import type { NextConfig } from "next";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { rehypeArticle } from "./src/unified/rehypeArticle.ts";
import { rehypeEmbed } from "./src/unified/rehypeEmbed.ts";
import { listEnvTestEntries } from "./src/util/testEnv.ts";

console.info("EnvTest:beforeConfig", [...listEnvTestEntries()]);

const withMDX = mdx({
	options: {
		remarkPlugins: [remarkGfm, remarkMath],
		rehypePlugins: [
			[rehypeHighlight, { languages: { ...all, terminal: all.bash } }],
			[rehypeSlug],
			[rehypeKatex, { output: "html" }],
			[rehypeEmbed],
			[rehypeArticle],
		],
	},
});

const nextConfig: NextConfig = {
	productionBrowserSourceMaps: true,
	pageExtensions: ["tsx", "ts", "mdx"],
	reactStrictMode: true,
	env: {
		OTEL_EXPORTER_OTLP_HEADERS: process.env.OTEL_EXPORTER_OTLP_HEADERS,
		APP_HOST: process.env.APP_HOST,
		VERCEL: process.env.VERCEL,
		NETLIFY: process.env.NETLIFY,
		K_SERVICE: process.env.K_SERVICE,
		AWS_REGION: process.env.AWS_REGION,
		EVTEST_CNF: "config",
		EVTEST_ENV_CNF: "config",
		EVTEST_CNF_HST: "config",
		NEXT_PUBLIC_EVTEST_CNF: "config",
		NEXT_PUBLIC_EVTEST_ENV_CNF: "config",
		NEXT_PUBLIC_EVTEST_CNF_HST: "config",
		EVTEST_ENV2: process.env.EVTEST_ENV,
		EVTEST_CNF2: process.env.EVTEST_CNF,
		EVTEST_HST2: process.env.EVTEST_HST,
		EVTEST_ENV_CNF2: process.env.EVTEST_ENV_CNF,
		EVTEST_ENV_HST2: process.env.EVTEST_ENV_HST,
		EVTEST_CNF_HST2: process.env.EVTEST_CNF_HST,
		NEXT_PUBLIC_EVTEST_ENV2: process.env.NEXT_PUBLIC_EVTEST_ENV,
		NEXT_PUBLIC_EVTEST_CNF2: process.env.NEXT_PUBLIC_EVTEST_CNF,
		NEXT_PUBLIC_EVTEST_HST2: process.env.NEXT_PUBLIC_EVTEST_HST,
		NEXT_PUBLIC_EVTEST_ENV_CNF2: process.env.NEXT_PUBLIC_EVTEST_ENV_CNF,
		NEXT_PUBLIC_EVTEST_ENV_HST2: process.env.NEXT_PUBLIC_EVTEST_ENV_HST,
		NEXT_PUBLIC_EVTEST_CNF_HST2: process.env.NEXT_PUBLIC_EVTEST_CNF_HST,
	},
	webpack: (config, _options) => {
		config.module.rules.push(
			...(function* () {
				// https://react-svgr.com/docs/next/#usage
				// 既存のSVG読み込みルールを取得
				const fileLoaderRule = config.module.rules.find(
					(rule: { test?: { test?: (s: string) => boolean } }) =>
						rule.test?.test?.(".svg"),
				);
				if (fileLoaderRule) {
					// ?urlが付いている場合は既存ルールで読む
					yield {
						...fileLoaderRule,
						test: /\.svg$/i,
						resourceQuery: /url/, // *.svg?url
					};
					// ReactComponentとして読む
					yield {
						test: /\.svg$/i,
						issuer: fileLoaderRule.issuer,
						resourceQuery: {
							not: [...fileLoaderRule.resourceQuery.not, /url/],
						},
						use: ["@svgr/webpack"],
					};
					// 既存のSVG読み込みルールは*.svgを無視させる
					fileLoaderRule.exclude = /\.svg$/i;
				} else {
					// ReactComponentとして読む
					yield { test: /\.svg$/i, use: ["@svgr/webpack"] };
				}
			})(),
		);
		return config;
	},
};

export default withMDX(nextConfig);
