import { Config } from "@stencil/core";
import { reactOutputTarget } from "@stencil/react-output-target";
import { sass } from "@stencil/sass";
import nodePolyfills from "rollup-plugin-node-polyfills";

export const config: Config = {
  namespace: "gatacaqr",
  plugins: [nodePolyfills(), sass()],
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "dist-custom-elements",
    },
    {
      type: "docs-readme",
    },
    {
      type: "stats",
      file: "stats.json", // optional
    },
    {
      type: "docs-vscode",
      file: "vscode-data.json",
    },
    {
      type: "docs-json",
      file: "docs.json",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
    },
    reactOutputTarget({
      componentCorePackage: "gatacaqr",
      proxiesFile: "./gatacaqr-react/src/components.ts",
    }),
  ],
};
