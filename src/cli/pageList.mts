import { writeFile } from 'node:fs/promises';
import { appDir, rootDir, srcDir } from '../util/node/directories.mts';
import { formatCode } from '../util/node/formatCode.mts';
import { getPageData } from '../util/node/getPageData.mts';
import { walkFiles } from '../util/node/walkFiles.mts';
import type { PageData } from '../util/type.mts';

if (process.env.CI) {
  console.info('build/pageList.mts: skipped');
  process.exit();
}

const listPageFiles = async function* (): AsyncGenerator<URL> {
  let count = 0;
  for await (const file of walkFiles(appDir)) {
    if (/\/page\.\w+$/.test(file.pathname)) {
      count += 1;
      yield file;
    }
  }
  console.info(`build/pageList: ${count} pages`);
};

const generateCode = async function* () {
  const tasks: Array<Promise<PageData>> = [];
  for await (const file of listPageFiles()) {
    tasks.push(getPageData(file));
  }
  const pageList = await Promise.all(tasks);
  pageList.sort((a, b) => {
    return (
      b.group.localeCompare(a.group) ||
      b.publishedAt.localeCompare(a.publishedAt)
    );
  });
  yield "import type { PageData } from './type.mts';\n";
  yield 'export const pageList: Array<PageData> = ';
  yield* JSON.stringify(pageList);
  yield ';';
};

let code = '';
for await (const chunk of generateCode()) {
  code += chunk;
}
const dest = new URL('util/pageList.mts', srcDir);
await writeFile(dest, await formatCode(code));
console.info(
  'build/pageList: done',
  dest.pathname.slice(rootDir.pathname.length),
);
