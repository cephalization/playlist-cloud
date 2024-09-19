import {
  Axes,
  PointBaseProps,
  Points,
  ThreeDimensionalCanvas,
  ThreeDimensionalControls,
} from "@arizeai/point-cloud";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import throttle from "just-throttle";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { ZodError } from "zod";
import { buttonVariants } from "~/components/ui/button";
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
import { cn } from "~/lib/utils";

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
      { tracks, features },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (e) {
    if (e instanceof ZodError) {
      throw redirect("/");
    }
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

const dimensions: [
  keyof TracksFeaturesResponse["audio_features"][number],
  string,
][] = [
  [
    "acousticness",
    "A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.",
  ],
  [
    "danceability",
    "Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.",
  ],
  [
    "energy",
    "Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. For example, death metal has high energy, while a Bach prelude scores low on the scale.",
  ],
  [
    "valence",
    `A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).`,
  ],
  [
    "instrumentalness",
    `Predicts whether a track contains no vocals. "Ooh" and "aah" sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly "vocal". The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.`,
  ],
  [
    "liveness",
    `Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.`,
  ],
  [
    "speechiness",
    `Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value.`,
  ],
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
        <SelectTrigger
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "flex items-center justify-between gap-4",
          )}
        >
          <SelectValue placeholder="Select a dimension">{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {dimensions.map(([dimension, description]) => (
            <SelectItem
              key={dimension}
              value={dimension}
              className="flex flex-col gap-2 items-start max-w-80"
            >
              {dimension}
              <p className="text-muted-foreground text-xs">{description}</p>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
};

export default function Playlist() {
  const { tracks, features } = useLoaderData<typeof loader>();
  const [hoveredPoint, setHoveredPoint] = useState<PointBaseProps | null>(null);
  const [x, setX] =
    useState<keyof TracksFeaturesResponse["audio_features"][number]>("valence");
  const [y, setY] =
    useState<keyof TracksFeaturesResponse["audio_features"][number]>(
      "instrumentalness",
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
      position: [feature[x], feature[y], feature[z]].map(
        (n) => Number(n) * 1.5,
      ) as [number, number, number],
      metaData: {
        uuid: feature.id,
        actualLabel: `${featuresAndTracksByTrackId.get(feature.id)?.track.name ?? feature.id}\n${featuresAndTracksByTrackId
          .get(feature.id)
          ?.track?.artists.map(({ name }) => name)
          .join(", ")}\n\n${[
          [x, feature[x]],
          [y, feature[y]],
          [z, feature[z]],
        ]
          .map(([a, b]) => `${a}: ${Math.ceil(Number(b) * 100)}%`)
          .join("\n")}`,
      },
    })) satisfies PointBaseProps[];
  }, [features, featuresAndTracksByTrackId, x, y, z]);

  return (
    <div className="h-full w-full relative">
      <ThreeDimensionalCanvas camera={{ position: [5, 5, 5], zoom: 10 }}>
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
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
          material="meshMatcap"
        />
        <gridHelper />
        <axesHelper position={[-0.1, -0.1, -0.1]} />
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
