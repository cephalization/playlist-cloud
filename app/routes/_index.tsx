import { type MetaFunction, json, redirect } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Playlist Cloud" },
    { name: "description", content: "Visualize your Spotify playlists in 3D" },
  ];
};

export const loader = async () => {
  const authenticated = false;

  if (!authenticated) {
    throw redirect("/login");
  }

  return json({});
};

export default function Index() {
  return <div>Hello World</div>;
}
