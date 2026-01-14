import { LibraryOptions, PluginOption, defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const debug = (process.env['DEBUG'] ?? '').trim().toLowerCase() === 'true'
const dirname =
  typeof __dirname === "undefined"
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname;
export const __projectDirname = path.join(dirname, "..");

console.log(`ProjectDirname: ${__projectDirname}`);
export function createViteUserscriptDefineConfigFunction(
  libObject: LibraryOptions,
  excludesArray: string[],
  userscriptHeaderFilenames: string[],
) {
  const bundlePlugin: PluginOption = {
    name: "bundle-plugin",
    apply: "build",
    enforce: "post",
    generateBundle(options, bundle) {
      // Gather all the CSS together to be injected later
      let css = "";
      for (const fileName in bundle) {
        const chunk = bundle[fileName]!;
        if (chunk.type === "asset" && chunk.fileName.endsWith(".css")) {
          console.log(
            "\nFound CSS chunk",
            chunk.fileName,
            "Inlining and removing from bundle.",
          );
          css += chunk.source;
          delete bundle[fileName];
        }
      }
      for (const fileName in bundle) {
        const chunk = bundle[fileName]!;
        if (chunk.type === "chunk") {
          // This may mess the source map :-(
          chunk.code = addHeader(chunk.code);

          // Inject the CSS into the bundle
          chunk.code += `;\n(function(){
                        const el = document.createElement("style");
                        el.innerText = ${JSON.stringify(css)};
                        el.type = "text/css";
                        document.head.appendChild(el);
                    })();`;
        }
      }
      function addHeader(code: string) {
        const header = userscriptHeaderFilenames
          .reduce(
            (header: string[], filename: string) => [
              ...header,
              fs.readFileSync(filename, "utf-8"),
            ],
            [],
          )
          .join("\n");
        console.log("\nAdding header to userscript:\n", header);
        return `${header}\n${code}`;
      }
    },
  };
  return defineConfig(({ mode }) => {
    console.log("Building in", mode);
    return {
      plugins: [bundlePlugin],
      base: __projectDirname,
      root: __projectDirname,
      build: {
        cssCodeSplit: false,
        cssMinify: !debug,
        emptyOutDir: false,
        outDir: "dist",
        minify: !debug,
        sourcemap: false,
        lib: {
          ...libObject,
          formats: ["iife"],
        },
        rollupOptions: {
          external: excludesArray,
          output: {
            banner: `// ==UserScript==`,
            inlineDynamicImports: true,
          },
        },
      },
      preview: {
        port: 8124,
        strictPort: true,
      },
      define: {
        // Don't pick up weird variables from `NODE_ENV`
        // https://github.com/vitejs/vite/discussions/13587
        "process.env.NODE_ENV": JSON.stringify(mode),
      },
      json: {
        stringify: true,
      },
    };
  });
}
