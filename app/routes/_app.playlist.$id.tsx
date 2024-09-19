import {
  Axes,
  PointBaseProps,
  Points,
  ThreeDimensionalCanvas,
  ThreeDimensionalControls,
} from "@arizeai/point-cloud";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import throttle from "just-throttle";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { Card, CardDescription } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getAuth } from "~/lib/auth.server";
import { PlaylistTrackResponse, TracksFeaturesResponse } from "~/lib/schemas";

export const loader = async (args: LoaderFunctionArgs) => {
  try {
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
  } catch (e) {
    if (e instanceof Promise) {
      const r = await e;
      throw r;
    }
    throw e;
  }
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

const dimensions: (keyof TracksFeaturesResponse["audio_features"][number])[] = [
  "acousticness",
  "danceability",
  "energy",
  "valence",
  "instrumentalness",
  "liveness",
  "speechiness",
];

const DimensionSelector = ({
  value,
  onChange,
  label,
}: {
  value: keyof TracksFeaturesResponse["audio_features"][number];
  onChange: (
    value: keyof TracksFeaturesResponse["audio_features"][number],
  ) => void;
  label: string;
}) => {
  return (
    <Label>
      {label}
      <Select
        value={value}
        onValueChange={(e) =>
          onChange(e as keyof TracksFeaturesResponse["audio_features"][number])
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a dimension" />
        </SelectTrigger>
        <SelectContent>
          {dimensions.map((dimension) => (
            <SelectItem key={dimension} value={dimension}>
              {dimension}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
};

export default function Playlist() {
  const { playlist, tracks, features } = useLoaderData<typeof loader>();
  const [hoveredPoint, setHoveredPoint] = useState<PointBaseProps | null>(null);
  const [x, setX] =
    useState<keyof TracksFeaturesResponse["audio_features"][number]>(
      "acousticness",
    );
  const [y, setY] =
    useState<keyof TracksFeaturesResponse["audio_features"][number]>(
      "danceability",
    );
  const [z, setZ] =
    useState<keyof TracksFeaturesResponse["audio_features"][number]>("energy");
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
      position: [feature[x], feature[y], feature[z]] as [
        number,
        number,
        number,
      ],
      metaData: {
        uuid: feature.id,
        actualLabel: `${featuresAndTracksByTrackId.get(feature.id)?.track.name ?? feature.id}\n${featuresAndTracksByTrackId
          .get(feature.id)
          ?.track?.artists.map(({ name }) => name)
          .join(", ")}`,
      },
    })) satisfies PointBaseProps[];
  }, [features, featuresAndTracksByTrackId, x, y, z]);

  return (
    <div className="h-full w-full relative">
      <ThreeDimensionalCanvas camera={{ position: [5, 5, 5], zoom: 10 }}>
        <pointLight position={[10, 10, 10]} />
        <ThreeDimensionalControls
          enablePan
          panSpeed={0.15}
          zoomSpeed={0.2}
          autoRotateSpeed={0.2}
        />
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
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        <DimensionSelector
          value={x}
          onChange={(value) => setX(value)}
          label="X"
        />
        <DimensionSelector
          value={y}
          onChange={(value) => setY(value)}
          label="Y"
        />
        <DimensionSelector
          value={z}
          onChange={(value) => setZ(value)}
          label="Z"
        />
      </div>
    </div>
  );
}
