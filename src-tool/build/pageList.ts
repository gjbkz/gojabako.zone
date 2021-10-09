import * as fs from 'fs';
import {srcUrl} from '../util/url';
import {getPageList} from '../util/getPageList';

let code = JSON.stringify(JSON.stringify(await getPageList()));
code = code.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, '\\\'');
code = `
// This file was generated by \`npm run build:pageList\`
import {JSON} from '../global';
interface PageData {
    url: string,
    pathname: string,
    title: string,
    firstCommitAt: string | null,
    lastCommitAt: string | null,
    filePath: string,
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const pageList: Array<PageData> = JSON.parse('${code}');
`.trimStart();
const dest = new URL('util/pageList.generated.ts', srcUrl);
await fs.promises.writeFile(dest, code);
