export default {
  platform: 'browser',
  esm: {
    output: 'es',
  },
  extraBabelPlugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-syntax-import-attributes', { deprecatedAssertSyntax: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['babel-plugin-parameter-decorator'],
  ],
  extraBabelPresets: [['@babel/preset-typescript', { onlyRemoveTypeImports: true }]],
};
