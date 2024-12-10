import type { ReadonlyURLSearchParams } from "next/navigation";
import { hasLocation } from "./env.ts";
import { site } from "./site.ts";

interface Fn {
	(): URL;
	defaultSearchParams?: ReadonlyURLSearchParams | URLSearchParams;
}

export const getCurrentUrl: Fn = () => {
	if (hasLocation) {
		return new URL(location.href);
	}
	const { defaultSearchParams } = getCurrentUrl;
	const url = new URL(site.baseUrl);
	if (defaultSearchParams) {
		for (const [key, value] of defaultSearchParams) {
			url.searchParams.set(key, value);
		}
	}
	return url;
};
