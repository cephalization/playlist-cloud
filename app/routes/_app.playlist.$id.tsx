import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getAuth } from "~/lib/auth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  const { spotifyClient } = authenticated;
  const { id } = args.params;
  invariant(id, "No playlist id");
  const playlist = await spotifyClient.getPlaylist(id);
  return json(
    { playlist },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
};

export default function Playlist() {
  const { playlist } = useLoaderData<typeof loader>();
  return <pre>{JSON.stringify(playlist, null, 2)}</pre>;
}
