import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { ZodError } from "zod";
import { Auth, authSchema, setAuth } from "~/lib/auth.server";
import { ENV } from "~/lib/env.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    throw new Error("No code or state provided");
  }

  const form = new URLSearchParams();
  form.append("code", code);
  form.append("redirect_uri", ENV.SPOTIFY_REDIRECT_URI);
  form.append("grant_type", "authorization_code");

  const response = await fetch(`https://accounts.spotify.com/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: form,
  });

  const data = await response.json();
  let authResponse: Auth;
  try {
    authResponse = authSchema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      console.error("Auth error:\n", e.message);
    } else {
      console.error("Auth error:\n", e);
    }
    throw new Error("Failed to authenticate");
  }

  return await setAuth(request, authResponse);
};
