import { ImageResponse } from "next/og";
import { site } from "../util/site.mts";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
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
        background: "#ffffff",
      }}
    >
      <svg viewBox={site.logo.viewBox.join(" ")} width={size.width * 0.67}>
        <title>Gojabako Zone</title>
        <path d={site.logo.d} fill="#1e293b" />
      </svg>
    </div>,
    { ...size },
  );
}
