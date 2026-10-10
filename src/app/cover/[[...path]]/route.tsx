import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { FontStyle, FontWeight } from "../../../util/fontFace.ts";
import { listLines, measureTextWidth } from "../../../util/measureTextWidth.ts";
import { pageList } from "../../../util/pageList.ts";
import { site } from "../../../util/site.ts";
import type { PageData } from "../../../util/type.ts";

interface FontOptions {
	data: Buffer;
	name: string;
	weight: FontWeight;
	style: FontStyle;
	lang?: string;
}

interface RouteContext {
	params: Promise<{ path?: Array<string> }>;
}

export const dynamicParams = false;
const size = { width: 1200, height: 630 };
const fontDir = join(process.cwd(), "public", "fonts", "noto-sans-jp");
const loadFont = async (
	fileName: string,
	options: Omit<FontOptions, "data">,
): Promise<FontOptions> => ({
	...options,
	data: await readFile(join(fontDir, fileName)),
});

export const generateStaticParams = () =>
	pageList.map((page) => ({ path: page.path.split("/").filter(Boolean) }));

export const GET = async (_req: Request, { params }: RouteContext) => {
	const { path = [] } = await params;
	const pagePath = `/${path.join("/")}`;
	const page = pageList.find((p) => p.path === pagePath);
	if (!page) {
		notFound();
	}
	return new ImageResponse(<ImageComponent page={page} />, {
		...size,
		fonts: await Promise.all([
			loadFont("japanese-900-normal.woff", {
				name: "Noto Sans JP",
				style: "normal",
				weight: 900,
			}),
			loadFont("japanese-700-normal.woff", {
				name: "Noto Sans JP",
				style: "normal",
				weight: 700,
			}),
		]),
		// debug: true,
	});
};

const ImageComponent = ({ page }: { page: PageData }) => {
	const color = "#1e293b";
	const outerPadding = 36;
	const innerPadding = 36;
	const lineHeight = 1.2;
	const h1LineHeight = 1.2;
	const innerWidth = size.width - outerPadding * 2;
	const textWidth = innerWidth - innerPadding * 2;
	const titleLength = measureTextWidth(page.title.join(""));
	const baseFontSize = 32;
	const h1FontSize0 = Math.min((16 * textWidth) / titleLength, 72);
	const logoHeight = baseFontSize * lineHeight;
	const logoWidth = logoHeight * 2;
	let lineCount = 1;
	let h1AvailableHeight = size.height - outerPadding * 2;
	h1AvailableHeight -= logoHeight;
	h1AvailableHeight -= innerPadding + baseFontSize * lineHeight * 1.25 * 2;
	let h1FontSize = h1FontSize0;
	while (
		h1FontSize0 * lineCount < baseFontSize * 1.1 &&
		(lineCount + 1) * h1FontSize * h1LineHeight < h1AvailableHeight
	) {
		lineCount += 1;
		h1FontSize = h1FontSize0 * lineCount;
	}
	h1FontSize *= 0.9;
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: outerPadding,
				color,
				backgroundColor: "#f1f5f9",
				fontFamily: "Noto Sans JP",
				fontSize: baseFontSize,
				fontWeight: 700,
				lineHeight,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: outerPadding,
					right: outerPadding,
					top: outerPadding,
					bottom: outerPadding,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					justifyContent: "center",
					padding: innerPadding,
					backgroundColor: "#ffffff",
					borderRadius: 20,
					boxShadow: "0 0 8px rgba(0, 0, 0, 0.25)",
				}}
			>
				{/* biome-ignore lint/a11y/noSvgWithoutTitle: ロゴに字が出てしまうので */}
				<svg
					viewBox={site.logo.viewBox.join(" ")}
					width={logoWidth}
					height={logoHeight}
					style={{
						position: "absolute",
						right: innerPadding,
						bottom: innerPadding,
					}}
				>
					<path d={site.logo.d} fill={color} />
				</svg>
				<h1
					style={{
						alignSelf: "stretch",
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						fontSize: h1FontSize,
						fontWeight: 900,
						lineHeight: h1LineHeight,
					}}
				>
					{[...listLines(page.title, textWidth, h1FontSize / 16)].map(
						(line, index) => {
							const key = `line-${index}`;
							return (
								<span key={key} style={{ whiteSpace: "nowrap" }}>
									{line}
								</span>
							);
						},
					)}
				</h1>
				<div style={{ display: "flex" }}>
					<span>
						<DateJP date={page.publishedAt} />
						に公開
					</span>
					{page.updatedAt !== page.publishedAt && (
						<span>
							（
							<DateJP date={page.updatedAt} />
							に更新）
						</span>
					)}
				</div>
				<div>{new URL(page.path, site.baseUrl).href}</div>
			</div>
		</div>
	);
};

const DateJP = ({ date }: { date: string }) => {
	const d = new Date(date);
	let dateString = `${d.getFullYear()}年`;
	dateString += `${d.getMonth() + 1}月`;
	dateString += `${d.getDate()}日`;
	return <time dateTime={d.toISOString()}>{dateString}</time>;
};
