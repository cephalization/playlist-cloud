import { LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAuth } from "~/lib/auth.server";
import invariant from "tiny-invariant";
export const meta: MetaFunction = () => {
  return [
    { title: "Playlist Cloud" },
    { name: "description", content: "Visualize your Spotify playlists in 3D" },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  const { auth, spotifyClient } = authenticated;
  const playlists = await spotifyClient.getPlaylists();
  return json({
    authenticated: auth,
    playlists,
  });
};

export default function Index() {
  const { authenticated, playlists } = useLoaderData<typeof loader>();
  const date = new Date(authenticated.expires_at);
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-4 bg-card rounded-md">
        <h1 className="text-2xl font-bold">Playlist Cloud</h1>
        Hi, {authenticated.user_id}
        {date && (
          <pre>
            Session Expires at: {date.toLocaleTimeString()}{" "}
            {date.toLocaleDateString()}
          </pre>
        )}
      </div>
      <ul className="flex flex-col gap-2 rounded-md bg-card p-4 min-h-[200px]">
        {playlists.items.map((playlist) => (
          <li key={playlist.id}>{playlist.name}</li>
        ))}
      </ul>
    </div>
  );
}
