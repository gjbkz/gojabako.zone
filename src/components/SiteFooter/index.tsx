import Link from "next/link";
import type { FC, HTMLAttributes } from "react";
import IconGitHub from "../../svg/fa-6.6.0/brands/github.svg";
import IconXTwitter from "../../svg/fa-6.6.0/brands/x-twitter.svg";
import IconRss from "../../svg/rss.svg";
import { classnames } from "../../util/classnames.ts";
import { site } from "../../util/site.ts";
import { AppHost } from "../AppHost";
import { SiteMap } from "../SiteMap";
import * as css from "./style.module.css";

const links: Array<{ Icon: FC; href: string; title: string }> = [
	{ Icon: IconRss, href: "/feed.atom", title: "更新情報 (Atom)" },
	{
		Icon: IconGitHub,
		href: "https://github.com/gjbkz",
		title: "GitHub @gjbkz",
	},
	{
		Icon: IconXTwitter,
		href: "https://x.com/gjbkz",
		title: "Twitter/X @gjbkz",
	},
];

export const SiteFooter = async (props: HTMLAttributes<HTMLElement>) => (
	<footer {...props} className={classnames(css.container, props.className)}>
		<section className={css.sitemap}>
			<SiteMap />
		</section>
		<section className={css.info}>
			<div>
				<AppHost />
			</div>
			<div>
				<div>©</div>
				<Link href="/author" prefetch={false}>
					{site.author.name}
				</Link>
				<div className={css.links}>
					{links.map(({ Icon, href, title }) => (
						<Link key={href} href={href} title={title} target="_blank">
							<Icon />
						</Link>
					))}
				</div>
			</div>
		</section>
	</footer>
);
