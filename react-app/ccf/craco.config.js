const path = require('path');

// The form engine is shared with the cloud function, so it lives under
// `functions/` (that whole directory is uploaded on deploy) rather than in
// src/. Both the app build and Jest reach it through this alias, so there is
// exactly one implementation of "is this answer valid" in the codebase.
const FORM_ENGINE = path.resolve(__dirname, '../../functions/shared/form-engine.js');

module.exports = {
  webpack: {
    alias: {
      '@ccf/form-engine': FORM_ENGINE,
    },
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

      // Create React App refuses imports from outside src/ by default. The
      // shared engine is the one deliberate exception.
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        plugin => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      return webpackConfig;
    },
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.transformIgnorePatterns = [
        'node_modules[/\\\\](?!(firebase|@firebase)[/\\\\])',
        '^.+\\.module\\.(css|sass|scss)$',
      ];
      jestConfig.moduleNameMapper = {
        ...(jestConfig.moduleNameMapper || {}),
        '^@ccf/form-engine$': FORM_ENGINE,
      };
      return jestConfig;
    },
  },
};
