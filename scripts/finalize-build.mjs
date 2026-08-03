import { renameSync } from "node:fs";

renameSync(
  new URL("../dist/app.html", import.meta.url),
  new URL("../dist/index.html", import.meta.url),
);
