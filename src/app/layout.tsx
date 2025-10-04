import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";
import { HighlightHash } from "../components/HighlightHash";
import { site } from "../util/site.ts";
import "./globals.css";
import "./hljs.css";

export const metadata: Metadata = {
	metadataBase: site.baseUrl,
	title: { template: `%s | ${site.name}`, default: site.name },
	applicationName: site.name,
	authors: [site.author],
};

export const viewport: Viewport = { themeColor: "hsl(0,0%,100%)" };

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="ja">
			<head>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
					integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
					crossOrigin="anonymous"
				/>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin={""}
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap"
					rel="stylesheet"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
					rel="stylesheet"
				/>
				<style>
					{".material-symbols-rounded{font-size:inherit;vertical-align:middle}"}
				</style>
			</head>
			<body>{children}</body>
			<HighlightHash />
		</html>
	);
}
