const webpack = require('webpack');
// const path = require('path'); // Đảm bảo import 'path' nếu bạn dùng path.resolve

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. Cấu hình fallback cho các module Node.js trong môi trường TRÌNH DUYỆT.
      //    Chúng ta KHÔNG SỬ DỤNG require.resolve() cho các Node.js core modules
      //    như 'util', 'assert', 'timers', 'tty', 'vm', 'console', 'constants', 'domain', 'events', 'http', 'https', 'os', 'punycode', 'querystring', 'string_decoder', 'sys', 'url', 'zlib'.
      //    Thay vào đó, chúng ta có thể đặt chúng là `false` để Webpack bỏ qua chúng
      //    hoặc nếu chúng cần polyfill, chúng ta sẽ cài đặt gói polyfill tương ứng.
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false, // Bỏ qua module 'fs'
        path: require.resolve('path-browserify'), // Gói npm polyfill
        crypto: require.resolve('crypto-browserify'), // Gói npm polyfill
        stream: require.resolve('stream-browserify'), // Gói npm polyfill
        buffer: require.resolve('buffer/'), // Gói npm polyfill
        process: require.resolve('process/browser'), // Gói npm polyfill
        // CÁC DÒNG SAU PHẢI ĐƯỢC BỎ HOẶC ĐẶT LÀ `false` NẾU CHÚNG GÂY LỖI:
        // util: require.resolve('util/'), // <-- Xóa dòng này hoặc đổi thành `util: false`
        // assert: require.resolve('assert/'), // <-- Xóa dòng này hoặc đổi thành `assert: false`

        // Cách tiếp cận an toàn hơn cho các module core không cần polyfill NPM:
        util: false,
        assert: false,
        // Có thể thêm các module core khác nếu gặp lỗi tương tự:
        // timers: false,
        // tty: false,
        // vm: false,
        // console: false,
        // constants: false,
        // domain: false,
        // events: false,
        // http: require.resolve('stream-http'), // Ví dụ nếu cần polyfill
        // https: require.resolve('https-browserify'), // Ví dụ nếu cần polyfill
        // os: require.resolve('os-browserify/browser'), // Ví dụ nếu cần polyfill
        // punycode: require.resolve('punycode/'),
        // querystring: require.resolve('querystring-es3'),
        // string_decoder: require.resolve('string_decoder/'),
        // sys: require.resolve('util/'), // sys đã deprecated và thay bằng util
        // url: require.resolve('url/'),
        // zlib: require.resolve('browserify-zlib'),
      };

      // 2. Sử dụng ProvidePlugin để "tiêm" các biến toàn cục như `process` và `Buffer`.
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        // Nếu bạn đã thêm các NormalModuleReplacementPlugin để mock 'fs', hãy giữ chúng ở đây
        // new webpack.NormalModuleReplacementPlugin(
        //   /node:fs/,
        //   path.resolve(__dirname, 'src/mocks/fs.js')
        // ),
        // new webpack.NormalModuleReplacementPlugin(
        //   /^fs$/,
        //   path.resolve(__dirname, 'src/mocks/fs.js')
        // )
      ]);

      // 3. Xử lý lỗi `fullySpecified` cho các ES Modules.
      webpackConfig.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      });

      webpackConfig.performance = {
        hints: false,
      };

      return webpackConfig;
    },
  },
};