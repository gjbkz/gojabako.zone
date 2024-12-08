export const hasProcess = typeof process === "object";
export const hasWindow = typeof window === "object";
export const hasLocation = typeof location === "object";
export const isNode = hasProcess && Boolean(process.version);
export const appHost = (() => {
	if (hasProcess) {
		if (process.env.APP_HOST) {
			return process.env.APP_HOST;
		}
		if (process.env.VERCEL) {
			return "Vercel";
		}
		if (process.env.NETLIFY) {
			return "Netlify";
		}
		if (process.env.K_SERVICE) {
			return "GCP";
		}
		if (process.env.AWS_REGION) {
			return "AWS";
		}
	}
	return null;
})();
