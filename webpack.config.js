const path = require("path");
const fs = require("fs");

const ENV = process.env.NODE_ENV || "development";

// plugins
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// recursive readdir(for .html resources)
function recursiveFindHTML(dirname) {
  return fs.readdirSync(dirname, { withFileTypes: true })
    .flatMap(sub => {
      const currentPath = `${dirname}/${sub.name}`;
      return sub.isFile() ? [currentPath] : recursiveFindHTML(currentPath);
    })
    .filter(pathname => /\.html$/.test(pathname))
    .map(pathname => pathname.replace(path.join(__dirname, "src/html/"), ""));
};

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: ENV,
  entry: {
    sw: [
      path.join(__dirname, "src/ts/sw.ts"),
      path.join(__dirname, "src/scss/app.scss"),
    ],
  },
  output: {
    clean: false,
    path: path.resolve(__dirname, "public"),
    filename: "scripts/[name].js",
    library: {
      type: "umd"
    },
    globalObject: "this"
  },
  resolve: {
    extensions: [".ts", ".js", ".scss"]
  },
  module: {
    rules: [
      // typescript
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
            }
          }
        ]
      },
      // scss
      {
        test: /\.scss$/,
        use: [
          ENV === "production" ? MiniCssExtractPlugin.loader : "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false,
            }
          },
          {
            loader: "sass-loader",
            options: {
              // dart-sass
              implementation: require("sass"),
            }
          },
        ],
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "views/css/app.[hash].css",
    }),
    new CopyPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'src/images/'),
        to: path.resolve(__dirname, 'public/images/'),
      }]
    }),
    ...recursiveFindHTML(path.join(__dirname, "src/html")).map(filename => new HtmlPlugin({ filename: `views/${filename}`, template: `src/html/${filename}` }))
  ]
};
