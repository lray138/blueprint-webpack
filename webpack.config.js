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
const ROOT = __dirname;
const IS_FRAMEWORK = ROOT.includes(path.join('blueprint', 'webpack'));
const SITE_DIR = (() => {
  const value = String(process.env.SITE_DIR || 'site').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(value) || value.toLowerCase() === 'blueprint') {
    throw new Error(`Invalid SITE_DIR: ${value}`);
  }
  return value;
})();
const SITE_DIR_ABS = path.resolve(__dirname, 'src', SITE_DIR);
const globals = {
  src_root: srcRoot,
  getBpEditPath: (relPath) => {
    const rel = String(relPath || '').replace(/^\//, '');
    const abs = rel.startsWith('site/')
      ? path.resolve(SITE_DIR_ABS, rel.slice('site/'.length))
      : path.resolve(srcRoot, rel);
    return `cursor://file${abs}`;
  },
};

const fp = require("./src/blueprint/js/lray138fp.min.js");

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

const SITE_ENTRY_ABS = path.join(SITE_DIR_ABS, 'js/theme.js');
const BLUEPRINT_ENTRY = './src/blueprint/js/theme.js';

const HAS_SITE_ENTRY = (() => {
  try {
    return fs.statSync(SITE_ENTRY_ABS).isFile();
  } catch {
    return false;
  }
})();

const SITE_PAGES_DIR_ABS = path.join(SITE_DIR_ABS, 'pages');
const HAS_SITE_PAGES = (() => {
  try {
    return fs.statSync(SITE_PAGES_DIR_ABS).isDirectory();
  } catch {
    return false;
  }
})();

const SITE_THEME_SCSS = path.resolve(SITE_DIR_ABS, 'scss/_theme.scss');

if (BUILD_SITE && !fs.existsSync(SITE_THEME_SCSS)) {
  throw new Error(
    `Missing src/${SITE_DIR}/scss/_theme.scss. Add or select the site theme layer first.`
  );
}

if (BUILD_BLUEPRINT && !fs.existsSync(SITE_THEME_SCSS)) {
  throw new Error(
    `Missing src/${SITE_DIR}/scss/_theme.scss. Blueprint theme.js imports @site/scss/_theme.scss.`
  );
}

const sassLoadPaths = [
  path.resolve(__dirname, 'src/blueprint/scss'),
  path.resolve(__dirname, 'node_modules'),
];

const siteOutputDirName = SITE_DIR === 'site' ? 'dist-site' : `dist-${SITE_DIR}`;

/** Separate output dirs so two dev servers can run without `clean` wiping each other. */
const outputDir =
  BUILD === 'blueprint'
    ? path.resolve(__dirname, 'dist-blueprint')
    : BUILD === 'site'
      ? path.resolve(__dirname, siteOutputDirName)
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

  return getSitePages(SITE_PAGES_DIR_ABS).map((page) => {
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
    return { theme: HAS_SITE_ENTRY ? SITE_ENTRY_ABS : BLUEPRINT_ENTRY };
  }
  return { theme: HAS_SITE_ENTRY ? SITE_ENTRY_ABS : BLUEPRINT_ENTRY };
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
          from: path.join(SITE_DIR_ABS, 'img'),
          to: './img/site',
          noErrorOnMissing: true,
        },
        ...(BUILD_SITE
          ? [
              {
                from: path.join(SITE_DIR_ABS, 'img'),
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
      '/site': SITE_DIR_ABS,
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
