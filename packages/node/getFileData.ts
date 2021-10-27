import * as path from 'path';
import {Date} from '../es/global';
import {rootDirectoryPath} from '../fs/constants';
import type {Commit} from '../git/listCommits';
import {getAllCommits} from '../git/listCommits';

export interface FileData {
    firstCommitAt: string,
    lastCommitAt: string,
    commitCount: number,
    /** Use to create a link to history on GitHub */
    filePath: string,
}

export const getFileData = async (
    fileAbsolutePath: string,
): Promise<FileData> => {
    const filePath = path.relative(rootDirectoryPath, fileAbsolutePath);
    const commitList = await getAllCommits(filePath);
    const now = new Date().toISOString();
    const firstCommit = commitList[commitList.length - 1] as Commit | null;
    const lastCommit = commitList[0] as Commit | null;
    return {
        firstCommitAt: firstCommit ? firstCommit.authorDate : now,
        lastCommitAt: lastCommit ? lastCommit.authorDate : now,
        commitCount: commitList.length,
        filePath,
    };
};
