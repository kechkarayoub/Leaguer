module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the source-map-loader rule and modify it to ignore react-datepicker warnings
      const sourceMapLoaderRule = webpackConfig.module.rules.find(
        rule => rule.loader && rule.loader.includes('source-map-loader')
      );

      if (sourceMapLoaderRule) {
        sourceMapLoaderRule.options = {
          ...sourceMapLoaderRule.options,
          filterSourceMappingUrl: (url, resourcePath) => {
            // Ignore source map warnings from react-datepicker
            if (resourcePath.includes('react-datepicker')) {
              return false;
            }
            return true;
          }
        };
      }

      return webpackConfig;
    },
  },
};
