import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/scripts/lambda.ts',
  output: {
    file: 'lambda.bundle.js',
    format: 'cjs'
  },
  plugins: [commonjs(), nodeResolve({preferBuiltins: true}), typescript(), json()],
  external: [
    'url',
    'http',
    'stream',
    'https',
    'zlib',
  ],
};
