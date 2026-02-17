const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getSitePages, readMarkdown } = require('./src/utils/filesystem');
const escapeHtml = require('./src/blueprint/utils/escape-html');
const curryRequire = require('./src/utils/require-curried');
const getAttributes = require('./src/utils/html');
const CopyPlugin = require('copy-webpack-plugin');
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

module.exports = {
  // ✅ In framework mode, build only blueprint.
  // ✅ Otherwise build site if present, fallback to blueprint.
  entry: IS_FRAMEWORK
    ? BLUEPRINT_ENTRY
    : (HAS_SITE_ENTRY ? './src/site/js/theme.js' : BLUEPRINT_ENTRY),

  plugins: [
    // ✅ Always generate Blueprint pages
    ...(() => {
      const blueprintBase = path.resolve(__dirname, 'src/blueprint/pages');

      return getSitePages('./src/blueprint/pages').map(page => {
        const rel = path.relative(blueprintBase, page).replace(/\\/g, '/');
        const pageName = rel.replace(/\.ejs$/i, '');

        return new HtmlWebpackPlugin({
          template: page,
          templateParameters: {
            escapeHtml,
            readMarkdown,
            curryRequire,
            utils: {
                getAttributes
            },
            base_url: IS_FRAMEWORK ? '' : '/blueprint'
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

        return new HtmlWebpackPlugin({
          template: page,
          filename: `./${pageName}.html`,
          templateParameters: {
            readMarkdown,
            curryRequire,
            escapeHtml,
            base_url: '',
            dir_path: path.dirname(page)
          }
        });
      });
    })() : []),

    new MiniCssExtractPlugin({
      filename: 'theme.css'
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

      // ✅ Hide @site if framework mode OR site folder/entry doesn't exist
      '@site': (!IS_FRAMEWORK && (HAS_SITE_ENTRY || HAS_SITE_PAGES))
        ? path.resolve(__dirname, 'src/site')
        : false,
    },
    roots: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules')
    ]
  },

  devServer: {
    // ✅ Watch only what's actually present
    watchFiles: IS_FRAMEWORK
      ? 'src/blueprint/**/*'
      : ((HAS_SITE_ENTRY || HAS_SITE_PAGES) ? 'src/**/*' : 'src/blueprint/**/*'),
    // hot: true
  },
};
