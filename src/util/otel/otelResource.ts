import { isString } from "@nlib/typing";
import { Resource } from "@opentelemetry/resources";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { appHost, hasProcess } from "../env";
import { site } from "../site";
import { listEnvTestEntries } from "../testEnv";
import { appVersion } from "../version";

const listRuntimeAttributes = function* (): Generator<
	[string, string | undefined | null]
> {
	const ns = site.namespace;
	yield [ATTR_SERVICE_NAME, site.name];
	yield [ATTR_SERVICE_VERSION, appVersion];
	yield [`${ns}.app_host`, appHost];
	if (hasProcess) {
		yield [`${ns}.node_env`, process.env.NODE_ENV || process.env.VERCEL_ENV];
		yield [`${ns}.node_version`, process.version];
		yield [`${ns}.vercel.env`, process.env.VERCEL_ENV];
		yield [`${ns}.vercel.edge`, process.env.VERCEL_EDGE];
		yield [`${ns}.vercel.region`, process.env.VERCEL_REGION];
		yield [`${ns}.vercel.deployment_id`, process.env.VERCEL_DEPLOYMENT_ID];
		yield [`${ns}.netlify.build_id`, process.env.BUILD_ID];
		yield [`${ns}.netlify.context`, process.env.CONTEXT];
		yield [`${ns}.netlify.deploy_id`, process.env.DEPLOY_ID];
		yield [`${ns}.gcp.service`, process.env.K_SERVICE];
		yield [`${ns}.gcp.revision`, process.env.K_REVISION];
		yield [`${ns}.gcp.configuration`, process.env.K_CONFIGURATION];
		yield [`${ns}.gcp.cloud_run_job`, process.env.CLOUD_RUN_JOB];
		yield [`${ns}.gcp.cloud_run_execution`, process.env.CLOUD_RUN_EXECUTION];
		yield [`${ns}.aws.app_id`, process.env.AWS_APP_ID];
		yield [`${ns}.aws.region`, process.env.AWS_REGION];
		yield [`${ns}.aws.execution_env`, process.env.AWS_EXECUTION_ENV];
		for (const [key, value] of listEnvTestEntries()) {
			yield [`${ns}.env.${key.toLowerCase()}`, value];
		}
	}
};

export const otelResource = new Resource(
	(() => {
		const attributes: Record<string, string> = {};
		for (const [key, value] of listRuntimeAttributes()) {
			if (isString(value)) {
				attributes[key] = value;
			}
		}
		return attributes;
	})(),
);
