import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import {removeExtension} from '../es/removeExtension';
import {markDependenciesAsExternal} from '../esbuild/markDependenciesAsExternal';
import {rootDirectoryPath} from '../fs/constants';
import {runScript} from '../node/runScript';

runScript(async () => {
    const buildDirectoryPath = path.join(rootDirectoryPath, 'packages/build');
    for (const name of await fs.promises.readdir(buildDirectoryPath)) {
        if (name !== 'cli.ts' && name.endsWith('.ts')) {
            await esbuild.build({
                entryPoints: [path.join(buildDirectoryPath, name)],
                outfile: path.join(rootDirectoryPath, `.output/build/${removeExtension(name)}.mjs`),
                plugins: [markDependenciesAsExternal({includeDev: true})],
                bundle: true,
                target: 'esnext',
                format: 'esm',
            });
        }
    }
});
