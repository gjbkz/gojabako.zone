import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { rootDir, srcDir } from "../util/node/directories.ts";
import { formatCode } from "../util/node/formatCode.ts";

const cliName = import.meta.url.slice(rootDir.href.length);

const getCommitInfo = () => {
	const command = 'git log -1 --pretty=format:"%ad-%H" --date=short';
	return execSync(command).toString().trim();
};

const generateCode = async function* () {
	yield `export const appVersion = '${getCommitInfo()}';`;
};

let code = "";
for await (const chunk of generateCode()) {
	code += chunk;
}
const dest = new URL("util/version.ts", srcDir);
await writeFile(
	dest,
	await formatCode(code, { filePath: fileURLToPath(dest) }),
);
console.info(`${cliName}: done`);
