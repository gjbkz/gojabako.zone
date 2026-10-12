import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";
import { HighlightHash } from "../components/HighlightHash";
import { site } from "../util/site.ts";
import "../fonts/webfonts.css";
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
			<body>{children}</body>
			<HighlightHash />
		</html>
	);
}
