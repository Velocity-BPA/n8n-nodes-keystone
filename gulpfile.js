const { src, dest } = require('gulp');

function buildIcons() {
  return src('nodes/**/*.svg').pipe(dest('dist/nodes'));
}

function copyAssets() {
  return src(['nodes/**/*.png', 'nodes/**/*.jpg']).pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
exports['build:assets'] = copyAssets;
exports.default = buildIcons;
