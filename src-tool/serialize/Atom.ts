import {getPageList} from '../util/getPageList';
import {loadPackageJson} from '../util/loadPackageJson';
import {toSafeString} from './StringToJsxSafeString';

export const serializeAtom = async function* () {
    yield '<?xml version="1.0" encoding="utf-8"?>';
    yield '<feed xmlns="http://www.w3.org/2005/Atom">';
    const {siteName, homepage} = await loadPackageJson();
    const pageList = await getPageList();
    yield `  <title>${siteName}</title>`;
    yield `  <link href="${homepage}"/>`;
    const now = new Date().toISOString();
    yield `  <updated>${pageList[0].lastCommitAt || now}</updated>`;
    yield `  <id>${homepage}</id>`;
    let index = 0;
    for await (const page of pageList) {
        yield '  <entry>';
        yield `    <id>${page.url}</id>`;
        yield `    <title>${toSafeString(page.title)}</title>`;
        yield `    <link href="${page.url}"/>`;
        yield `    <updated>${page.lastCommitAt || now}</updated>`;
        yield `    <published>${page.firstCommitAt || now}</published>`;
        yield '  </entry>';
        if (20 < ++index) {
            break;
        }
    }
    yield '</feed>';
};
