import fs from "node:fs";
import fsp from "node:fs/promises";

// Polyfill for Cloudflare Workers / unenv where fs.readdir / fs.promises.readdir throws
try {
  if (fsp) {
    const origReaddir = fsp.readdir;
    (fsp as any).readdir = async (...args: unknown[]) => {
      try {
        if (typeof origReaddir === "function") {
          return await (origReaddir as Function).apply(fsp, args);
        }
      } catch {
        return [];
      }
      return [];
    };
  }

  if (fs) {
    if (fs.promises) {
      const origPromisesReaddir = fs.promises.readdir;
      (fs.promises as any).readdir = async (...args: unknown[]) => {
        try {
          if (typeof origPromisesReaddir === "function") {
            return await (origPromisesReaddir as Function).apply(fs.promises, args);
          }
        } catch {
          return [];
        }
        return [];
      };
    }

    const origReaddirSync = fs.readdirSync;
    (fs as any).readdirSync = (...args: unknown[]) => {
      try {
        if (typeof origReaddirSync === "function") {
          return (origReaddirSync as Function).apply(fs, args);
        }
      } catch {
        return [];
      }
      return [];
    };

    const origReaddir = fs.readdir;
    (fs as any).readdir = (...args: unknown[]) => {
      const cb = args[args.length - 1];
      try {
        if (typeof origReaddir === "function") {
          return (origReaddir as Function).apply(fs, args);
        }
      } catch {
        if (typeof cb === "function") (cb as Function)(null, []);
        return;
      }
      if (typeof cb === "function") (cb as Function)(null, []);
    };
  }
} catch {
  // Ignore in case fs objects are immutable
}
