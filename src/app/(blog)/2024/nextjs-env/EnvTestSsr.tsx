import { listEnvTestEntries } from "../../../../util/testEnv";
import { EnvTestData } from "./EnvTestData";

export const EnvTestSsr = () => (
	<EnvTestData data={[...listEnvTestEntries()]} columnName="SSR" />
);
