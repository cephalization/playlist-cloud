import {
  Axes,
  PointBaseProps,
  Points,
  ThreeDimensionalCanvas,
  ThreeDimensionalControls,
} from "@arizeai/point-cloud";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import throttle from "just-throttle";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { Card, CardDescription } from "~/components/ui/card";
import { Tooltip, TooltipContent } from "~/components/ui/tooltip";
import { getAuth } from "~/lib/auth.server";
import { PlaylistTrackResponse, TracksFeaturesResponse } from "~/lib/schemas";

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  const { spotifyClient } = authenticated;
  const { id } = args.params;
  invariant(id, "No playlist id");
  const playlist = await spotifyClient.getPlaylist(id);
  const tracks = await spotifyClient.getPlaylistTracks(id);
  const features = await spotifyClient.getTracksFeatures(
    tracks.items.map(({ track }) => track.id),
  );
  return json(
    { playlist, tracks, features },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
};

const getStyleFromCoordinates = (x: number, y: number) => {
  // if x is greater than half of the window width, then the tooltip should be on the left side of the coordinates, and vice versa
  const isOnRightSide = x > window.innerWidth / 2;
  const isOnBottomSide = y > window.innerHeight / 2;
  return {
    left: isOnRightSide ? undefined : x,
    top: isOnBottomSide ? undefined : y,
    right: isOnRightSide ? window.innerWidth - x : undefined,
    bottom: isOnBottomSide ? window.innerHeight - y : undefined,
  };
};

export default function Playlist() {
  const { playlist, tracks, features } = useLoaderData<typeof loader>();
  const [hoveredPoint, setHoveredPoint] = useState<PointBaseProps | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    const f = throttle(
      (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY }),
      16,
      {
        leading: true,
        trailing: true,
      },
    );
    const handleMouseMove = (e: MouseEvent) => {
      f(e);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  const featuresAndTracksByTrackId = useMemo(() => {
    const map = new Map<
      string,
      {
        feature?: TracksFeaturesResponse["audio_features"][number];
        track: PlaylistTrackResponse["track"];
      }
    >();
    tracks.items.forEach((track) => {
      map.set(track.track.id, {
        feature: features.audio_features.find(
          (feature) => feature.id === track.track.id,
        ),
        track: track.track,
      });
    });
    return map;
  }, [features, tracks]);
  const data = useMemo(() => {
    return features.audio_features.map((feature) => ({
      position: [feature.acousticness, feature.danceability, feature.energy],
      metaData: {
        uuid: feature.id,
        actualLabel: `${featuresAndTracksByTrackId.get(feature.id)?.track.name ?? feature.id}\n${featuresAndTracksByTrackId
          .get(feature.id)
          ?.track?.artists.map(({ name }) => name)
          .join(", ")}`,
      },
    })) satisfies PointBaseProps[];
  }, [features, featuresAndTracksByTrackId]);

  return (
    <>
      <ThreeDimensionalCanvas camera={{ position: [5, 5, 5], zoom: 10 }}>
        <pointLight position={[10, 10, 10]} />
        <ThreeDimensionalControls enablePan />
        <Points
          data={data}
          pointProps={{ color: "#22C55E" }}
          onPointHovered={setHoveredPoint}
          onPointerLeave={() => setHoveredPoint(null)}
        />
        <axesHelper />
      </ThreeDimensionalCanvas>
      {mousePosition && hoveredPoint && (
        <Card
          className="fixed z-50 p-4 shadow-2xl bg-secondary"
          style={getStyleFromCoordinates(mousePosition.x, mousePosition.y)}
        >
          <CardDescription className="flex gap-2">
            <img
              src={
                featuresAndTracksByTrackId
                  .get(hoveredPoint.metaData.uuid)
                  ?.track.album.images.at(-1)?.url
              }
              alt={hoveredPoint.metaData.actualLabel}
              className="w-14 h-14"
            />
            <span className="text-lg whitespace-pre-wrap">
              {hoveredPoint?.metaData.actualLabel}
            </span>
          </CardDescription>
        </Card>
      )}
    </>
  );
}
