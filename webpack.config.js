const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: './src/js/theme.js',
    plugins: [
        new HtmlWebpackPlugin(),
    ],
    module: {
        rules: [
            { test: /\.ejs$/i, use: [ { loader: 'ejs-easy-loader' } ] },
            {
                test: /\.(scss)$/,
                use: [
                    {
                        // inject CSS to page
                        loader: 'style-loader'
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