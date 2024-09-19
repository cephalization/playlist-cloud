import {
  LoaderFunctionArgs,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/node";
import { ZodError, z } from "zod";
import { ENV } from "~/lib/env.server";
import { SpotifyClient } from "~/lib/spotify.server";

// from spotify callback
export const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// stored in session
export const authSchema = z.object({
  user_id: z.string(),
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  expires_in: z.number(),
  expires_at: z.number(),
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
    const refresh = async () => {
      const r = await refreshAuth(auth.refresh_token);
      session.set("auth", r);
      throw redirect(request.url, {
        headers: {
          "Set-Cookie": await authSession.commitSession(session),
        },
      });
    };
    return {
      auth,
      spotifyClient: new SpotifyClient({
        accessToken: auth.access_token,
        onRefresh: refresh,
      }),
    };
  } catch (e) {
    if (e instanceof Response && e.status === 302) {
      throw e;
    }
    if (e instanceof ZodError) {
    } else {
      console.error("Auth error:\n", e);
    }
    if (redirectTo) {
      throw redirect(redirectTo);
    }
    return null;
  }
};

const makeAuthFromResponse = (response: AuthResponse, user_id: string) => {
  return {
    ...response,
    expires_at: Date.now() + response.expires_in * 1000,
    user_id,
  };
};

export const setAuth = async (
  request: Request,
  auth: AuthResponse,
  user_id: string,
  { redirectTo }: { redirectTo?: string } = {},
) => {
  const session = await authSession.getSession(request.headers.get("Cookie"));
  session.set("auth", makeAuthFromResponse(auth, user_id));
  throw redirect(redirectTo ?? "/", {
    headers: { "Set-Cookie": await authSession.commitSession(session) },
  });
};

export const refreshAuth = async (refreshToken: string): Promise<Auth> => {
  console.log("refreshingAuth");
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
  data.refresh_token = refreshToken;
  const auth = authResponseSchema.parse(data);
  const spotifyClient = new SpotifyClient({ accessToken: auth.access_token });
  const userData = await spotifyClient.getUser();
  return makeAuthFromResponse(auth, userData.id);
};
