import { ImageResponse } from "next/og";
import { site } from "../util/site.ts";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{/* biome-ignore lint/a11y/noSvgWithoutTitle: 画像出力のため不要 */}
			<svg viewBox={site.logo.viewBox.join(" ")} width={size.width}>
				<path d={site.logo.d} fill="#1e293b" />
			</svg>
		</div>,
		{ ...size },
	);
}
