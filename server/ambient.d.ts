declare module "express";
declare module "cors";
declare module "openai";
declare module "zod";

declare const process: {
  env: Record<string, string | undefined>;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};
