const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  outputDir: 'dist',
  chainWebpack: (config) => {
    config.resolve.alias
        .set('@$', resolve('src'))
        .set('assets', resolve('src/assets'))
        .set('components', resolve('src/components'))
        .set('less', resolve('src/less'))
        .set('api', resolve('src/api'))
  },
  devServer: {
    port: 8123,
    proxy: {
      '/api': {
        target: 'http://192.168.11.127:9999',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
};
