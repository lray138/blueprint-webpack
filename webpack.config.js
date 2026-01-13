const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getSitePages } = require('./src/utils/filesystem');
const CopyPlugin = require('copy-webpack-plugin');
//const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    entry: './src/js/theme.js',
    plugins: [
        ...getSitePages('./src/pages').map(page => {
            const pageName = page.replace('.ejs', '').replace('src/pages/', '');
            return new HtmlWebpackPlugin({
                template: page,
                filename: `./${pageName}.html`
            });
        }),
        new MiniCssExtractPlugin({
            filename: 'theme.css'
        }),
        new CopyPlugin({
            patterns: [
              {
                from: './src/img',
                to: './img',
              }
            ],
          }),
    ],  
    module: {
        rules: [
            { test: /\.ejs$/i, use: [ { loader: 'ejs-easy-loader' } ] },
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
                        // Extract CSS to separate file (replaces style-loader)
                        loader: MiniCssExtractPlugin.loader
                    }, {
                        // translates CSS into CommonJS modules
                        loader: 'css-loader'
                    }, {
                        // Run postcss actions
                        loader: 'postcss-loader',
                        options: {
                            // `postcssOptions` is needed for postcss 8.x;
                            // if you use postcss 7.x skip the key
                            postcssOptions: {
                                // postcss plugins, can be exported to postcss.config.js
                                plugins: function () {
                                    return [
                                        require('autoprefixer')
                                    ];
                                }
                            }
                        }
                    }, {
                        // compiles Sass to CSS
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                            // Optional: Silence Sass deprecation warnings. See note below.
                            silenceDeprecations: [
                                //'mixed-decls',
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
            {
                test: /\.(woff2?|ttf|eot|svg)$/,
                type: 'asset/resource',
                generator: {
                   filename: "../fonts/[name][ext]"
                }
              }
        ]
    },
    resolve: {
      roots: [
         path.resolve(__dirname, 'src'),
         path.resolve(__dirname, 'node_modules')
      ]
   },
   devServer: {
        watchFiles: 'src/**/*',
        //hot: true
    },
};
