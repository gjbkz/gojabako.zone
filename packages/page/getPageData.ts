import {getPagePathName} from './getPagePathName';
import {Error, Promise} from '../es/global';
import {getFileData} from '../node/getFileData';
import {siteDomain} from '../site/constants';
import {getPageTitle} from './getPageTitle';
import {generatePageImage} from './generatePageImage';

export interface PageData {
    pathname: string,
    title: string,
    filePath: string,
    publishedAt: string,
    updatedAt: string,
    commitCount: number,
    coverImage: string,
}

export const getPageData = async (...args: Parameters<typeof findPageData>): Promise<PageData> => {
    const pageData = await findPageData(...args);
    if (!pageData) {
        throw new Error(`NoPageData: ${args[0]}`);
    }
    return pageData;
};

export const findPageData = async (pageFileAbsolutePath: string): Promise<PageData | null> => {
    const pathname = getPagePathName(pageFileAbsolutePath);
    if (pathname.startsWith('/api/')) {
        return null;
    }
    const [
        title,
        {filePath, firstCommitAt, lastCommitAt, commitCount},
    ] = await Promise.all([
        getPageTitle(pageFileAbsolutePath),
        getFileData(pageFileAbsolutePath),
    ]);
    const publishedAt = firstCommitAt;
    const updatedAt = lastCommitAt;
    const url = `https://${siteDomain}${pathname}`;
    const coverImage = await generatePageImage({url, title});
    return {pathname, title, filePath, publishedAt, updatedAt, commitCount, coverImage};
};
