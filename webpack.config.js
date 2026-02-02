const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getSitePages } = require('./src/utils/filesystem');
const CopyPlugin = require('copy-webpack-plugin');
//const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

// ✅ Detect “framework mode” when this config is running from /blueprint/webpack
const ROOT = __dirname;
const IS_FRAMEWORK = ROOT.includes(path.join('blueprint', 'webpack'));

module.exports = {
  // ✅ In framework mode, build only blueprint. Otherwise build site (as before).
  entry: IS_FRAMEWORK ? './src/blueprint/js/theme.js' : './src/js/theme.js',

  plugins: [
    // ✅ Always generate Blueprint pages
    ...(() => {
        const blueprintBase = path.resolve(__dirname, 'src/blueprint/pages');
      
        return getSitePages('./src/blueprint/pages').map(page => {
          const rel = path.relative(blueprintBase, page).replace(/\\/g, '/');
          const pageName = rel.replace(/\.ejs$/i, '');
      
          return new HtmlWebpackPlugin({
            template: page,
            filename: IS_FRAMEWORK
              ? `./${pageName}.html`            // ✅ framework: treat blueprint as root
              : `./blueprint/${pageName}.html`  // ✅ normal: blueprint is namespaced
          });
        });
      })(),      
    // ✅ Only generate Site pages when NOT in framework mode
    ...(!IS_FRAMEWORK ? (() => {
      const appBase = path.resolve(__dirname, 'src/site/pages');
      return getSitePages('./src/site/pages').map(page => {
        const rel = path.relative(appBase, page).replace(/\\/g, '/');
        const pageName = rel.replace(/\.ejs$/i, '');
        return new HtmlWebpackPlugin({
          template: page,
          filename: `./${pageName}.html`
        });
      });
    })() : []),

    new MiniCssExtractPlugin({
      filename: 'theme.css'
    }),

    // ✅ If you want to ignore site assets in framework mode, keep only blueprint copy.
    // If your images are shared (and you still want them), keep this as-is.
    new CopyPlugin({
      patterns: [
        {
          from: './src/blueprint/img',
          to: './blueprint/img',
        }
      ],
    }),
  ],

  module: {
    rules: [
      { test: /\.ejs$/i, use: [{ loader: 'ejs-easy-loader' }] },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          emit: false,
        }
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: function () {
                  return [
                    require('autoprefixer')
                  ];
                }
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: [
                  'color-functions',
                  'global-builtin',
                  'import'
                ],
                quietDeps: true,
              }
            }
          }
        ]
      },
    ]
  },

  resolve: {
    // ✅ Helpful aliases. In framework mode, importing @site will fail fast.
    alias: {
      '@blueprint': path.resolve(__dirname, 'src/blueprint'),
      '@site': IS_FRAMEWORK ? false : path.resolve(__dirname, 'src/site'),
    },
    roots: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules')
    ]
  },

  devServer: {
    // ✅ Watch only blueprint in framework mode; otherwise watch everything (as before)
    watchFiles: IS_FRAMEWORK ? 'src/blueprint/**/*' : 'src/**/*',
    //hot: true
  },
};
