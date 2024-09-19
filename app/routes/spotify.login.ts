import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { nanoid } from "nanoid";
import { ENV } from "~/lib/env.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const state = nanoid(16);
  const scope =
    "playlist-read-private user-library-read user-read-email user-read-private";

  throw redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${ENV.SPOTIFY_CLIENT_ID}&scope=${scope}&redirect_uri=${ENV.SPOTIFY_REDIRECT_URI}&state=${state}`,
  );
};
