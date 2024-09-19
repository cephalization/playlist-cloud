import { LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAuth } from "~/lib/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Playlist Cloud" },
    { name: "description", content: "Visualize your Spotify playlists in 3D" },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });

  return json({ authenticated });
};

export default function Index() {
  const { authenticated } = useLoaderData<typeof loader>();
  const date = authenticated?.expires_at
    ? new Date(authenticated.expires_at)
    : null;
  return (
    <div>
      <h1>Playlist Cloud</h1>
      {date && (
        <pre>
          Expires at: {date.toLocaleTimeString()} {date.toLocaleDateString()}
        </pre>
      )}
    </div>
  );
}
