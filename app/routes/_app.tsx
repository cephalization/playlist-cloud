import { LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { ImperativePanelGroupHandle } from "react-resizable-panels";
import invariant from "tiny-invariant";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useBreakpoint } from "~/hooks/use-breakpoint";
import { getAuth } from "~/lib/auth.server";
import { cn } from "~/lib/utils";

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  const { auth, spotifyClient } = authenticated;
  const playlists = await spotifyClient.getPlaylists();
  return json({
    expiresAt: auth.expires_at,
    userId: auth.user_id,
    playlists,
  });
};

export default function Index() {
  const panelRef = useRef<ImperativePanelGroupHandle>(null);
  const { state } = useNavigation();
  const { expiresAt, userId, playlists } = useLoaderData<typeof loader>();
  const isDesktop = useBreakpoint("sm");
  const [date, setDate] = useState<Date | null>(null);
  const togglePanel = () => {
    if (isDesktop) return;
    const layout = panelRef.current?.getLayout();
    panelRef.current?.setLayout(layout?.[0] === 100 ? [0, 100] : [100, 0]);
  };
  const openPlaylists = () => {
    if (isDesktop) return;
    panelRef.current?.setLayout([100, 0]);
  };
  const openDetails = () => {
    if (isDesktop) return;
    panelRef.current?.setLayout([0, 100]);
  };
  const setDesktopLayout = () => {
    if (isDesktop) {
      panelRef.current?.setLayout([20, 80]);
    }
  };
  useEffect(() => {
    const date = new Date(expiresAt);
    setDate(date);
  }, [expiresAt]);
  useEffect(() => {
    if (!isDesktop) {
      openPlaylists();
    } else {
      setDesktopLayout();
    }
  }, [isDesktop]);
  const loading = state !== "idle";
  return (
    <div className="p-4 flex flex-col gap-4 max-h-full">
      <div className="relative flex flex-col gap-2 p-4 bg-card rounded-md">
        <Link
          to="/"
          className="text-2xl font-bold text-primary hover:underline underline-offset-2"
        >
          Playlist Cloud
        </Link>
        Hi, {userId}
        {date ? (
          <pre className="max-w-full overflow-auto">
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
      <Button variant="secondary" className="sm:hidden" onClick={togglePanel}>
        Toggle Playlist Menu
      </Button>
      <ResizablePanelGroup ref={panelRef} direction="horizontal">
        <ResizablePanel defaultSize={isDesktop ? 20 : 100}>
          <ul className="flex flex-col gap-2 rounded-md bg-card p-4 h-full overflow-auto min-w-32">
            {playlists.items.map((playlist) => (
              <li key={playlist.id}>
                <NavLink
                  to={`/playlist/${playlist.id}`}
                  onClick={openDetails}
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
                      src={playlist.images.at(-1)?.url}
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
        <ResizablePanel defaultSize={isDesktop ? 80 : 0}>
          <div className="h-full overflow-auto p-4 bg-card rounded-md">
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
