import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "../components/Article";
import { PageLink } from "../components/PageLink";
import { SiteLayout } from "../components/SiteLayout";
import { pageList } from "../util/pageList.ts";
import { site } from "../util/site.ts";

export const metadata: Metadata = {};

export default function Page() {
	return (
		<SiteLayout>
			<main>
				<Article>
					<header>
						<h1>{site.name}</h1>
					</header>
					<p>
						<Link href="/author" prefetch={false}>
							{site.author.name}
						</Link>{" "}
						のサイトです。
					</p>
					<h2>最近公開したページ</h2>
					<ul>{[...listRecentPages(6, "publishedAt")]}</ul>
					<h2>最近更新したページ</h2>
					<ul>{[...listRecentPages(6, "updatedAt")]}</ul>
				</Article>
			</main>
		</SiteLayout>
	);
}

const listRecentPages = function* (
	limit: number,
	key: "publishedAt" | "updatedAt",
) {
	for (const page of pageList
		.slice()
		.sort((a, b) => Date.parse(b[key]) - Date.parse(a[key]))
		.slice(0, limit)) {
		yield (
			<li key={page.path}>
				<PageLink page={page} />
			</li>
		);
	}
};
