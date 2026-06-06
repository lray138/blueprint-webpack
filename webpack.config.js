const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getSitePages, createReadMarkdown } = require('./src/utils/filesystem');
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

const ROOT = __dirname;
const IS_FRAMEWORK = ROOT.includes(path.join('blueprint', 'webpack'));

/**
 * `blueprint` | `site` | `all` (production / legacy combined output in `dist/`).
 * Dev runs two servers: `WEBPACK_BUILD=blueprint` (:8081) and `WEBPACK_BUILD=site` (:8080).
 */
const BUILD = (() => {
  const raw = process.env.WEBPACK_BUILD;
  if (raw === 'blueprint' || raw === 'site' || raw === 'all') return raw;
  return IS_FRAMEWORK ? 'blueprint' : 'all';
})();

const BUILD_BLUEPRINT = BUILD === 'blueprint' || BUILD === 'all';
const BUILD_SITE = BUILD === 'site' || BUILD === 'all';

const SITE_ENTRY_ABS = path.resolve(__dirname, 'src/site/js/theme.js');
const BLUEPRINT_ENTRY = './src/blueprint/js/theme.js';

const HAS_SITE_ENTRY = (() => {
  try {
    return fs.statSync(SITE_ENTRY_ABS).isFile();
  } catch {
    return false;
  }
})();

const SITE_PAGES_DIR_ABS = path.resolve(__dirname, 'src/site/pages');
const HAS_SITE_PAGES = (() => {
  try {
    return fs.statSync(SITE_PAGES_DIR_ABS).isDirectory();
  } catch {
    return false;
  }
})();

const SITE_DIR_ABS = path.resolve(__dirname, 'src/site');
const SITE_THEME_SCSS = path.resolve(SITE_DIR_ABS, 'scss/_theme.scss');

if (BUILD_SITE && !fs.existsSync(SITE_THEME_SCSS)) {
  throw new Error(
    'Missing src/site/scss/_theme.scss. Add or init the site repo (theme composer must live under site/scss).'
  );
}

if (BUILD_BLUEPRINT && !fs.existsSync(SITE_THEME_SCSS)) {
  throw new Error(
    'Missing src/site/scss/_theme.scss. Blueprint theme.js imports @site/scss/_theme.scss — add the site theme layer first.'
  );
}

const sassLoadPaths = [
  path.resolve(__dirname, 'src/blueprint/scss'),
  path.resolve(__dirname, 'node_modules'),
];

/** Separate output dirs so two dev servers can run without `clean` wiping each other. */
const outputDir =
  BUILD === 'blueprint'
    ? path.resolve(__dirname, 'dist-blueprint')
    : BUILD === 'site'
      ? path.resolve(__dirname, 'dist-site')
      : path.resolve(__dirname, 'dist');

/**
 * Blueprint-only dev: HTML at `/blueprint/index.html` (publicPath + `./index.html` on disk).
 * Combined `all` build: HTML under `dist/blueprint/*.html`, assets at `/css` (site entry).
 */
const blueprintPublicPath = BUILD === 'blueprint' ? '/blueprint/' : '/';
const sitePublicPath = '/';

function blueprintHtmlFilename(pageName) {
  if (BUILD === 'blueprint' || IS_FRAMEWORK) return `./${pageName}.html`;
  return `./blueprint/${pageName}.html`;
}

const htmlChunkTags = { chunks: ['theme'], inject: 'head' };

function blueprintPagePlugins(readMarkdown) {
  const blueprintBase = path.resolve(__dirname, 'src/blueprint/pages');
  const blueprintBaseUrl = BUILD === 'blueprint' || (BUILD === 'all' && !IS_FRAMEWORK) ? '/blueprint' : '';

  return getSitePages('./src/blueprint/pages').map((page) => {
    const rel = path.relative(blueprintBase, page).replace(/\\/g, '/');
    const pageName = rel.replace(/\.ejs$/i, '');
    const current_path = blueprintBaseUrl
      ? `${blueprintBaseUrl}/${pageName}.html`
      : `/${pageName}.html`;

    return new HtmlWebpackPlugin({
      template: page,
      templateParameters: {
        escapeHtml,
        readMarkdown,
        curryRequire,
        utils: {
          getAttributes,
          fp,
        },
        globals,
        base_url: blueprintBaseUrl,
        current_path,
      },
      filename: blueprintHtmlFilename(pageName),
      ...htmlChunkTags,
    });
  });
}

function sitePagePlugins(readMarkdown) {
  if (!BUILD_SITE || !HAS_SITE_PAGES) return [];

  const appBase = SITE_PAGES_DIR_ABS;

  return getSitePages('./src/site/pages').map((page) => {
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
          fp,
        },
        globals,
        curryRequire,
        escapeHtml,
        base_url: '',
        current_path,
        dir_path: path.dirname(page),
      },
      ...htmlChunkTags,
    });
  });
}

function themeEntry() {
  if (BUILD === 'blueprint') return { theme: BLUEPRINT_ENTRY };
  if (BUILD === 'site') {
    return { theme: HAS_SITE_ENTRY ? './src/site/js/theme.js' : BLUEPRINT_ENTRY };
  }
  return { theme: HAS_SITE_ENTRY ? './src/site/js/theme.js' : BLUEPRINT_ENTRY };
}

const defaultDevPort =
  BUILD === 'blueprint' ? 8081 : BUILD === 'site' ? 8080 : Number(process.env.WEBPACK_DEV_PORT ?? 8080);

module.exports = async () => {
  const { marked } = await import('marked');
  const readMarkdown = createReadMarkdown(marked);

  return {
  output: {
    path: outputDir,
    filename: 'js/[name].js',
    assetModuleFilename: 'assets/[name][ext]',
    clean: true,
    publicPath: BUILD === 'blueprint' ? blueprintPublicPath : sitePublicPath,
  },
  entry: themeEntry(),
  plugins: [
    ...(BUILD_BLUEPRINT ? blueprintPagePlugins(readMarkdown) : []),
    ...sitePagePlugins(readMarkdown),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './src/blueprint/img',
          to: './img/blueprint',
        },
        ...(BUILD_BLUEPRINT
          ? [
              {
                from: './src/blueprint/img',
                to: './blueprint/img',
              },
            ]
          : []),
        ...(BUILD === 'all'
          ? [
              {
                from: './src/blueprint/img',
                to: './blueprint/img',
              },
            ]
          : []),
        {
          from: './src/site/img',
          to: './img/site',
          noErrorOnMissing: true,
        },
        ...(BUILD_SITE
          ? [
              {
                from: './src/site/img',
                to: './site/img',
                noErrorOnMissing: true,
              },
            ]
          : []),
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
        },
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
                },
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                loadPaths: sassLoadPaths,
                silenceDeprecations: ['color-functions', 'global-builtin', 'import'],
                quietDeps: true,
              },
            },
          },
        ],
      },
    ],
  },

  resolve: {
    alias: {
      '@blueprint': path.resolve(__dirname, 'src/blueprint'),
      '@site': SITE_DIR_ABS,
    },
    roots: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
  },

  devServer: {
    host: '127.0.0.1',
    port: Number(process.env.WEBPACK_DEV_PORT ?? defaultDevPort),
    hot: true,
    liveReload: true,
    open: false,
    watchFiles: ['src/**/*'],
    devMiddleware: {
      publicPath: BUILD === 'blueprint' ? blueprintPublicPath : sitePublicPath,
    },
  },
  };
};
