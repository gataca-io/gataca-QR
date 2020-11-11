import { Config } from '@stencil/core';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { reactOutputTarget } from '@stencil/react-output-target';
import {sass} from "@stencil/sass";

export const config: Config = {
  namespace: 'gatacaqr',
  plugins: [
    nodePolyfills(),
    sass()
  ],
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'www',
      serviceWorker: null // disable service workers
    }, reactOutputTarget({
      componentCorePackage: 'gatacaqr',
      proxiesFile: './gatacaqr-react/src/components.ts',
    }),
  ]
};
