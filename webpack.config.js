const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getSitePages, readMarkdown } = require('./src/utils/filesystem');
const escapeHtml = require('./src/blueprint/utils/escape-html');
const curryRequire = require('./src/utils/require-curried');
const getAttributes = require('./src/utils/html');
const CopyPlugin = require('copy-webpack-plugin');

const __dir__ = __dirname;
const srcRoot = path.resolve(__dir__, 'src');
const globals = {
  src_root: srcRoot,
  getBpEditPath: (relPath) =>
    `cursor://file${path.resolve(srcRoot, relPath.replace(/^\//, ''))}`,
};

const fp = require("./src/blueprint/js/lray138fp.min.js");

// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

// ✅ Detect “framework mode” when this config is running from /blueprint/webpack
const ROOT = __dirname;
const IS_FRAMEWORK = ROOT.includes(path.join('blueprint', 'webpack'));

const SITE_ENTRY_ABS = path.resolve(__dirname, 'src/site/js/theme.js');
const BLUEPRINT_ENTRY = './src/blueprint/js/theme.js';

// ✅ Does src/site/js/theme.js exist?
const HAS_SITE_ENTRY = (() => {
  try {
    return fs.statSync(SITE_ENTRY_ABS).isFile();
  } catch (err) {
    return false;
  }
})();

// ✅ Does src/site/pages exist?
const SITE_PAGES_DIR_ABS = path.resolve(__dirname, 'src/site/pages');
const HAS_SITE_PAGES = (() => {
  try {
    return fs.statSync(SITE_PAGES_DIR_ABS).isDirectory();
  } catch (err) {
    return false;
  }
})();

const SITE_DIR_ABS = path.resolve(__dirname, 'src/site');
const SITE_THEME_SCSS = path.resolve(SITE_DIR_ABS, 'scss/_theme.scss');

/** CSS entry always lives in the site package; blueprint `scss/theme.scss` is reference / docs only. */
if (!fs.existsSync(SITE_THEME_SCSS)) {
  throw new Error(
    'Missing src/site/scss/_theme.scss. Add or init the site repo (theme composer must live under site/scss).'
  );
}

const sassLoadPaths = [
  path.resolve(__dirname, 'src/blueprint/scss'),
  path.resolve(__dirname, 'node_modules'),
];

module.exports = {
    output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'js/[name].js',
  assetModuleFilename: 'assets/[name][ext]',
  clean: true
},
  // ✅ In framework mode, build only blueprint.
  // ✅ Otherwise build site if present, fallback to blueprint.
  entry: IS_FRAMEWORK
  ? { theme: BLUEPRINT_ENTRY }
  : { theme: (HAS_SITE_ENTRY ? './src/site/js/theme.js' : BLUEPRINT_ENTRY) },
  plugins: [
    // ✅ Always generate Blueprint pages
    ...(() => {
      const blueprintBase = path.resolve(__dirname, 'src/blueprint/pages');

      return getSitePages('./src/blueprint/pages').map(page => {
        const rel = path.relative(blueprintBase, page).replace(/\\/g, '/');
        const pageName = rel.replace(/\.ejs$/i, '');
        const blueprintBaseUrl = IS_FRAMEWORK ? '' : '/blueprint';
        const current_path = IS_FRAMEWORK ? `/${pageName}.html` : `${blueprintBaseUrl}/${pageName}.html`;

        return new HtmlWebpackPlugin({
          template: page,
          templateParameters: {
            escapeHtml,
            readMarkdown,
            curryRequire,
            utils: {
                getAttributes,
                fp
            },
            globals,
            base_url: IS_FRAMEWORK ? '' : '/blueprint'
            ,
            current_path
          },
          filename: IS_FRAMEWORK
            ? `./${pageName}.html`            // ✅ framework: blueprint is root
            : `./blueprint/${pageName}.html`  // ✅ normal: blueprint is namespaced
        });
      });
    })(),

    // ✅ Only generate Site pages when NOT in framework mode AND the folder exists
    ...((!IS_FRAMEWORK && HAS_SITE_PAGES) ? (() => {
      const appBase = SITE_PAGES_DIR_ABS;

      return getSitePages('./src/site/pages').map(page => {
        const rel = path.relative(appBase, page).replace(/\\/g, '/');
        const pageName = rel.replace(/\.ejs$/i, '');
        const current_path = `/${pageName}.html`;

        return new HtmlWebpackPlugin({
          template: page,
          filename: `./${pageName}.html`,
          templateParameters: {
            readMarkdown,
            utils: {
                getAttributes,
                fp
            },
            globals,
            curryRequire,
            escapeHtml,
            base_url: '',
            current_path,
            dir_path: path.dirname(page)
          }
        });
      });
    })() : []),

    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),

    new CopyPlugin({
      patterns: [
        {
          from: './src/blueprint/img',
          to: './img/blueprint',
        },
        {
          from: './src/blueprint/img',
          to: './blueprint/img',
        },
        {
          from: './src/site/img',
          to: './img/site',
          noErrorOnMissing: true,
        },
        {
          from: './src/site/img',
          to: './site/img',
          noErrorOnMissing: true,
        }
      ],
    }),
  ],

  module: {
    rules: [
      { test: /\.ejs$/i, use: [{ loader: 'ejs-easy-loader' }] },
      {
      test: /\.(woff2?|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: { filename: 'fonts/[name][ext]' },
    },
      {
        test: /\.(png|svg|jpg|jpeg|gif|JPG)$/i,
        type: 'asset/resource',
        generator: {
          emit: false,
        }
      },
      {
        test: /\.(scss)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: function () {
                  return [require('autoprefixer')];
                }
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                loadPaths: sassLoadPaths,
                silenceDeprecations: ['color-functions', 'global-builtin', 'import'],
                quietDeps: true,
              }
            }
          }
        ]
      },
    ]
  },

  resolve: {
    alias: {
      '@blueprint': path.resolve(__dirname, 'src/blueprint'),

      // ✅ Site package (required); `theme.js` imports `@site/scss/_theme.scss`
      '@site': SITE_DIR_ABS,
    },
    roots: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules')
    ]
  },

  devServer: {
    host: '127.0.0.1',
    port: Number(process.env.WEBPACK_DEV_PORT ?? 8080),
    hot: true,
    liveReload: true,
    open: false,
    watchFiles: ['src/**/*'],
    devMiddleware: {
      publicPath: '/',
    },
  },
};
