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
};


