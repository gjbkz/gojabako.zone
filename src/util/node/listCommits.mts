import type { Commit } from '../type.mjs';
import { spawn } from './spawn.mjs';

/**
 * https://git-scm.com/docs/pretty-formats
 */
const NewLine = '%x0A';
const CommitHash = '%H';
const AbbreviatedCommitHash = '%h';
const AuthorDate = '%aI';
const delimiter = '--------';

export const listCommits = async function* (
  relativePath: string,
  startCommitish = 'HEAD',
): AsyncGenerator<Commit> {
  const history = new Set<string>();
  const format = [
    delimiter,
    CommitHash,
    AbbreviatedCommitHash,
    AuthorDate,
  ].join(NewLine);
  let before = startCommitish;
  while (true) {
    const { stdout, stderr } = await spawn(
      `git log --follow --format="${format}" --before=${before} -- ${relativePath}`,
    );
    if (!stdout || stderr) {
      break;
    }
    for (const entry of stdout.split(delimiter)) {
      const trimmed = entry.trim();
      if (trimmed) {
        const commit = parseCommitOutput(trimmed);
        if (history.has(commit.commit)) {
          return;
        }
        yield commit;
        history.add(commit.commit);
        before = commit.commit;
      }
    }
  }
};

const parseCommitOutput = (entry: string): Commit => {
  const [commit, abbr, aDate] = [...entry.split(/[\r\n]+/)];
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`InvalidCommitHash: ${commit}`);
  }
  if (!/^[0-9a-f]+$/.test(abbr) || !commit.startsWith(abbr)) {
    throw new Error(`InvalidAbbreviatedCommitHash: ${abbr}`);
  }
  const dateRegExp = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/;
  if (!dateRegExp.test(aDate)) {
    throw new Error(`InvalidAuthorDate: ${aDate}`);
  }
  return { commit, abbr, aDate };
};