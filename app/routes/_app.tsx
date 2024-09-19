import { LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { getAuth } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  const { auth, spotifyClient } = authenticated;
  const playlists = await spotifyClient.getPlaylists();
  return json(
    { authenticated: auth, playlists },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
};

export default function Index() {
  const { state } = useNavigation();
  const { authenticated, playlists } = useLoaderData<typeof loader>();
  const [date, setDate] = useState<Date | null>(null);
  useEffect(() => {
    const date = new Date(authenticated.expires_at);
    setDate(date);
  }, [authenticated]);
  const loading = state !== "idle";
  return (
    <div className="p-4 flex flex-col gap-4 max-h-full">
      <div className="relative flex flex-col gap-2 p-4 bg-card rounded-md">
        <h1 className="text-2xl font-bold text-primary">Playlist Cloud</h1>
        Hi, {authenticated.user_id}
        {date ? (
          <pre>
            Session Expires at: {date.toLocaleTimeString()}{" "}
            {date.toLocaleDateString()}
          </pre>
        ) : (
          <p>Loading...</p>
        )}
        {loading && (
          <div className="h-1 w-[99%] rounded-md bg-primary/10 overflow-hidden absolute -bottom-2.5 left-[0.5%] animate-in">
            <div className="h-full bg-primary animate-indeterminate-progress"></div>
          </div>
        )}
      </div>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20}>
          <ul className="flex flex-col gap-2 rounded-md bg-card p-4 h-full overflow-auto min-w-32">
            {playlists.items.map((playlist) => (
              <li key={playlist.id}>
                <NavLink
                  to={`/playlist/${playlist.id}`}
                  className={({ isActive }) =>
                    cn(
                      "p-2 rounded-md group flex items-center gap-2 hover:bg-accent hover:text-primary hover:underline truncate",
                      isActive && "bg-accent text-primary hover:no-underline",
                    )
                  }
                  title={playlist.name}
                >
                  {playlist.images?.at(-1)?.url && (
                    <img
                      src={playlist.images.at(-1)!.url}
                      alt={playlist.name}
                      height={Math.min(
                        playlist.images.at(-1)?.height ?? 32,
                        32,
                      )}
                      width={Math.min(playlist.images.at(-1)?.width ?? 32, 32)}
                      className="rounded-md"
                    />
                  )}
                  <span className="truncate">{playlist.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={80}>
          <div className="h-full overflow-auto p-4 bg-card rounded-md">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
