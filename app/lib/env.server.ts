import { z } from "zod";
import { parseEnv } from "znv";

export const ENV = parseEnv(process.env, {
  SPOTIFY_CLIENT_ID: z.string(),
  SPOTIFY_CLIENT_SECRET: z.string(),
  SPOTIFY_REDIRECT_URI: z.string(),
  SESSION_SECRET: z.string(),
});
