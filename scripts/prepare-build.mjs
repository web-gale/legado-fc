import { rmSync } from "node:fs";

// dist only contains generated output and is safe to recreate for every build.
rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
