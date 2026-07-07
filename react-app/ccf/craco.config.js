module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        // Find and disable CSS minimizer
        const minimizerIndex = webpackConfig.optimization.minimizer.findIndex(
          minimizer => minimizer.constructor.name === 'CssMinimizerPlugin'
        );
        if (minimizerIndex > -1) {
          webpackConfig.optimization.minimizer.splice(minimizerIndex, 1);
        }
      }
      return webpackConfig;
    },
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.transformIgnorePatterns = [
        'node_modules/(?!(firebase|@firebase)/)',
        '^.+\\.module\\.(css|sass|scss)$',
      ];
      return jestConfig;
    },
  },
};




