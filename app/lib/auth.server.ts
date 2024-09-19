import {
  createCookieSessionStorage,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { z, ZodError } from "zod";
import { ENV } from "~/lib/env.server";

export const authSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  expires_in: z.number(),
  expires_at: z.number().optional(),
  refresh_token: z.string(),
});

export type Auth = z.infer<typeof authSchema>;

export const authSession = createCookieSessionStorage({
  cookie: {
    name: "auth",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    secrets: [ENV.SESSION_SECRET],
  },
});

export const getAuth = async (
  { request }: LoaderFunctionArgs,
  { redirectTo }: { redirectTo?: string } = {},
) => {
  try {
    const session = await authSession.getSession(request.headers.get("Cookie"));
    const auth = authSchema.parse(session.get("auth"));
    return auth;
  } catch (e) {
    if (e instanceof ZodError) {
      console.error("Auth error:\n", e.message);
    } else {
      console.error("Auth error:\n", e);
    }
    if (redirectTo) {
      throw redirect(redirectTo);
    }
    return null;
  }
};

export const setAuth = async (
  request: Request,
  auth: Auth,
  { redirectTo }: { redirectTo?: string } = {},
) => {
  const session = await authSession.getSession(request.headers.get("Cookie"));
  session.set("auth", {
    ...auth,
    expires_at: Date.now() + auth.expires_in * 1000,
  });
  throw redirect(redirectTo ?? "/", {
    headers: { "Set-Cookie": await authSession.commitSession(session) },
  });
};

export const refreshAuth = async (refreshToken: string) => {
  const response = await fetch(`https://accounts.spotify.com/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ENV.SPOTIFY_CLIENT_ID,
    }),
  });

  const data = await response.json();
  return authSchema.parse(data);
};
