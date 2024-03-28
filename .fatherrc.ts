export default {
  // 以下为 umd 配置项启用时的默认值，有自定义需求时才需配置
  umd: {
    name: "clshanyansdk",
    chainWebpack: (memo) => {
      memo.output.libraryExport("default");
      return memo;
    },
    extractCSS: false, //提取 CSS 为单独的文件    
    output:"js/umd"
  },
  platform: "browser",
};
