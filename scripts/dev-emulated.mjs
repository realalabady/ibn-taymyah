// Starts `next dev` on port 3001 wired to the local Firebase emulators (see src/lib/firebase/client.ts).
// The emulators start empty each time, so this also (re)creates the test admin from emulator-seed.mjs.
import { spawn } from "node:child_process";

function seedWhenReady(attempt = 1) {
  const seed = spawn(process.execPath, ["scripts/emulator-seed.mjs"], { stdio: "inherit" });
  seed.on("exit", (code) => {
    if (code === 0) return;
    if (attempt >= 30) return console.error("Emulators not reachable. Run `npm run emulators` first, then `npm run emulators:seed`.");
    setTimeout(() => seedWhenReady(attempt + 1), 2000);
  });
}
seedWhenReady();

const child = spawn("npx", ["next", "dev", "-p", "3001"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_FIREBASE_EMULATORS: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
