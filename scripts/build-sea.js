'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function seaBuild() {
  const src = path.join(ROOT, 'bin', 'jrs.js');
  const bundleDir = path.join(ROOT, 'dist');
  const bundle = path.join(bundleDir, 'bundle.js');
  const seaConfig = path.join(ROOT, 'sea-config.json');
  const blob = path.join(bundleDir, 'sea-prep.blob');
  const base = path.join(bundleDir, 'json-rest-server');
  const ext = process.platform === 'win32' ? '.exe' : '';

  fs.mkdirSync(bundleDir, { recursive: true });

  console.log('Bundling with esbuild...');
  run(
    `npx esbuild ${JSON.stringify(src)} --bundle --platform=node ` +
      `--format=cjs --outfile=${JSON.stringify(bundle)}`
  );

  fs.writeFileSync(
    seaConfig,
    JSON.stringify(
      {
        main: bundle,
        output: blob,
        disableExperimentalSEAWarning: true,
        useSnapshot: false,
        useCodeCache: true,
      },
      null,
      2
    )
  );

  console.log('Generating SEA blob...');
  run(`node --experimental-sea-config ${JSON.stringify(seaConfig)}`);

  const copyTarget = `${base}${ext}`;
  console.log('Copying node binary...');
  const nodeExe = process.execPath;
  fs.copyFileSync(nodeExe, copyTarget);

  console.log('Injecting blob into binary...');
  if (process.platform === 'win32') {
    run(
      `npx postject ${JSON.stringify(copyTarget)} NODE_SEA_BLOB ${JSON.stringify(
        blob
      )} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`
    );
  } else {
    run(
      `npx postject ${JSON.stringify(copyTarget)} NODE_SEA_BLOB ${JSON.stringify(
        blob
      )} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 ` +
        `--macho-segment-name NODE_SEA`
    );
  }

  console.log(`SEA binary created at ${copyTarget}`);
}

seaBuild();