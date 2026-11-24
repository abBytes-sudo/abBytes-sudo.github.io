#!/bin/sh
# Builds the two Studio OS bundles from js/. Run from this folder after editing anything in js/.
#   studio-os.min.js       core, seed, home, shell (loaded by loader.js after the static shell paints)
#   studio-os.rest.min.js  every other view (loaded on first use, prefetched when idle)
# Bump V in loader.js when you rebuild so browsers fetch the new files.
cd "$(dirname "$0")"
ESB="../../../site-src/lab/node_modules/.bin/esbuild"
cat js/core.js js/seed.js js/seed-crm.js js/v-home.js js/app.js > .core.tmp.js
cat js/v-sales.js js/v-portal.js js/v-delivery.js js/v-site.js js/v-finance.js js/v-work.js js/v-crm.js js/v-design.js js/v-ops.js > .rest.tmp.js
"$ESB" .core.tmp.js --minify --target=es2018 --legal-comments=none --outfile=studio-os.min.js --log-level=warning
"$ESB" .rest.tmp.js --minify --target=es2018 --legal-comments=none --outfile=studio-os.rest.min.js --log-level=warning
"$ESB" erp.css --minify --loader:.css=css --outfile=erp.min.css --log-level=warning
rm -f .core.tmp.js .rest.tmp.js
