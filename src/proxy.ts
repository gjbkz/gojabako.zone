import { HttpStatusCode } from "@nlib/typing";
import { type NextRequest, NextResponse } from "next/server";
import { getOtelAttributesFromNextRequest } from "./util/otel/getOtelAttributesFromNextRequest";
import { otelLogger } from "./util/otel/otelLogger";
import { listEnvTestEntries } from "./util/testEnv";

const proceed = (): NextResponse => NextResponse.next();

interface Handler {
	isResponsibleFor: (request: NextRequest) => boolean;
	handle: (request: NextRequest) => NextResponse;
}

const handlers: Array<Handler> = [
	{
		isResponsibleFor: (request) => request.nextUrl.pathname === "/health",
		handle: () => new NextResponse("OK", { status: HttpStatusCode.OK }),
	},
	{
		isResponsibleFor: ({ nextUrl: { pathname } }) =>
			/\.php\d*$/.test(pathname) ||
			pathname.includes("wp-") ||
			pathname.includes("phpinfo") ||
			[
				".env",
				".exe",
				".sh",
				".bat",
				".ini",
				".pwd",
				".sql",
				".db",
				".yml",
				".key",
				".pem",
				".zip",
			].some((v) => pathname.endsWith(v)) ||
			[
				"/admin",
				"/debug",
				"/.aws",
				"/.ssh",
				"/.svn",
				"/.env",
				"/.git",
				"/.vscode",
				"/.kube",
				"/config",
				"/_vti_pvt",
				"/wp",
				"/wordpress",
			].some((v) => pathname.startsWith(v)),
		handle: () => new NextResponse(null, { status: HttpStatusCode.Forbidden }),
	},
	{
		isResponsibleFor: ({ nextUrl: { pathname } }) =>
			pathname === "/favicon.ico",
		handle: (req) => NextResponse.redirect(new URL("/icon", req.nextUrl)),
	},
	{
		isResponsibleFor: ({ nextUrl: { pathname } }) => pathname === "/envtest",
		handle: () => NextResponse.json([...listEnvTestEntries()]),
	},
	{
		isResponsibleFor: ({ nextUrl: { pathname } }) => pathname === "/apphost",
		handle: () => NextResponse.json(process.env.NEXT_PUBLIC_APP_HOST),
	},
	{
		isResponsibleFor: ({ headers, nextUrl: { pathname } }) =>
			headers.get("sec-fetch-dest") === "empty" ||
			["/icon"].includes(pathname) ||
			["/_next/static", "/_next/image", "/.netlify/verification"].some((v) =>
				pathname.startsWith(v),
			) ||
			[".js", ".css", ".woff", ".woff2", "/robots.txt"].some((v) =>
				pathname.endsWith(v),
			),
		handle: proceed,
	},
	{
		isResponsibleFor: () => true,
		handle: (request) => {
			logRequest(request);
			return proceed();
		},
	},
];

const logRequest = (request: NextRequest) => {
	otelLogger.emit({
		body: `${request.method} ${request.nextUrl.pathname}`,
		attributes: getOtelAttributesFromNextRequest(request),
	});
};

export const proxy = async (request: NextRequest) => {
	console.info(`${request.method} ${request.nextUrl.href}`);
	for (const handler of handlers) {
		if (handler.isResponsibleFor(request)) {
			return handler.handle(request);
		}
	}
	return NextResponse.rewrite(new URL("/not-found", request.nextUrl));
};
