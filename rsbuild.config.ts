import {defineConfig, RsbuildPlugin} from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from "path"
import fs from "fs"

function ChunksManifestPlugin(): RsbuildPlugin {
  return {
    name: 'chunks-manifest-plugin',
    setup(api) {
      api.onAfterBuild(async ({ stats }) => {
        const outputPath = api.context.distPath;
        const publicPath = '/';

        const json = stats?.toJson({ all: true, chunks: true, async: true });

        if (!json?.chunks) {
          console.warn('[ChunksManifestPlugin] No chunks found in stats.');
          return;
        }

        const manifest: Record<string, string> = {};

        for (const chunk of json.chunks) {
          if (!chunk?.files || !chunk.names?.length) continue;

          const name = chunk.names[0];
          const jsFile = chunk.files.find((f) => f.endsWith('.js'));
          if (jsFile) {
            manifest[name] = publicPath + jsFile;
          }
        }

        const manifestPath = path.join(outputPath, 'chunks-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        console.log('[ChunksManifestPlugin] ✅ chunks-manifest.json generated');
      });
    },
  };
}

export default defineConfig({
  plugins: [pluginReact(),ChunksManifestPlugin()],
  output: {
    filename: {
      js: `[name]_script.${crypto.randomUUID()}.js`,
    },
  },
  html: {
    template: "./public/index.html",
  },
});
