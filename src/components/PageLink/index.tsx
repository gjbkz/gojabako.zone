import { isString } from "@nlib/typing";
import Link from "next/link";
import type { PageData } from "../../util/type.ts";
import * as css from "./style.module.css";

interface PageLinkProps {
	page: PageData;
	showDescription?: boolean;
}

export const PageLink = ({ page, showDescription }: PageLinkProps) => {
	let { publishedAt } = page;
	if (isString(page.other?.originalPublishedAt)) {
		publishedAt = page.other?.originalPublishedAt;
	}
	const isUpdated =
		getDateString(page.publishedAt) !== getDateString(page.updatedAt);
	return (
		<Link href={page.path} className={css.container}>
			<span>{page.title.join("")}</span>
			<PageDate dateTime={publishedAt} suffix="公開" />
			{isUpdated && (
				<PageDate dateTime={page.updatedAt} suffix="更新" bracket />
			)}
			{showDescription && page.description && (
				<span className={css.description}>{page.description}</span>
			)}
		</Link>
	);
};

interface PageDateProps {
	dateTime: string;
	suffix?: string;
	bracket?: boolean;
}

const PageDate = ({ dateTime, suffix, bracket = false }: PageDateProps) => {
	const date = new Date(dateTime);
	return (
		<time
			className={css.time}
			dateTime={date.toISOString()}
			title={getJstString(date)}
		>
			{[
				...(function* () {
					if (bracket) {
						yield "(";
					}
					yield getDateString(dateTime);
					if (suffix) {
						yield suffix;
					}
					if (bracket) {
						yield ")";
					}
				})(),
			].join("")}
		</time>
	);
};

const getDateString = (dateTime: string | Date) => {
	const date = new Date(dateTime);
	return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
};

const getJstString = (date: Date) => {
	return `${date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST`;
};
