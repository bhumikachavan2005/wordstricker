import fs from "node:fs";
import fsp from "node:fs/promises";

// Prevent "Code generation from strings disallowed for this context" in Cloudflare Workers
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as {
    __zod_globalConfig?: { jitless?: boolean };
    navigator?: { userAgent?: string };
  };
  g.__zod_globalConfig = {
    ...(g.__zod_globalConfig || {}),
    jitless: true,
  };
  if (typeof g.navigator === "undefined") {
    g.navigator = { userAgent: "Cloudflare" };
  } else if (!g.navigator.userAgent) {
    g.navigator.userAgent = "Cloudflare";
  }
}

// Polyfill for Cloudflare Workers / unenv where fs.readdir / fs.promises.readdir throws
try {
  if (fsp) {
    const origReaddir = fsp.readdir;
    (fsp as Record<string, unknown>).readdir = async (...args: unknown[]) => {
      try {
        if (typeof origReaddir === "function") {
          return await (origReaddir as (...a: unknown[]) => Promise<unknown>).apply(fsp, args);
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
      (fs.promises as Record<string, unknown>).readdir = async (...args: unknown[]) => {
        try {
          if (typeof origPromisesReaddir === "function") {
            return await (origPromisesReaddir as (...a: unknown[]) => Promise<unknown>).apply(fs.promises, args);
          }
        } catch {
          return [];
        }
        return [];
      };
    }

    const origReaddirSync = fs.readdirSync;
    (fs as Record<string, unknown>).readdirSync = (...args: unknown[]) => {
      try {
        if (typeof origReaddirSync === "function") {
          return (origReaddirSync as (...a: unknown[]) => unknown).apply(fs, args);
        }
      } catch {
        return [];
      }
      return [];
    };

    const origReaddir = fs.readdir;
    (fs as Record<string, unknown>).readdir = (...args: unknown[]) => {
      const cb = args[args.length - 1];
      try {
        if (typeof origReaddir === "function") {
          return (origReaddir as (...a: unknown[]) => unknown).apply(fs, args);
        }
      } catch {
        if (typeof cb === "function") (cb as (err: null, res: unknown[]) => void)(null, []);
        return;
      }
      if (typeof cb === "function") (cb as (err: null, res: unknown[]) => void)(null, []);
    };
  }
} catch {
  // Ignore in case fs objects are immutable
}
