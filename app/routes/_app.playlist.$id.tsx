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
import { Pane } from "tweakpane";
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

const DEFAULT_PARAMS = {
  // camera
  cameraX: 10,
  cameraY: 10,
  cameraZ: 10,
  zoom: 10,
  // pointlight
  pointLightX: 10,
  pointLightY: 10,
  pointLightZ: 10,
  pointLightIntensity: 10,
  pointLightColor: "#FFF",
  // pointcloud
  pointCloudColor: "#22C55E",
} satisfies {};
type Params = typeof DEFAULT_PARAMS;

const usePaneSettings = () => {
  const [pane, setPane] = useState<Pane | null>(null);
  const [params, setParams] = useState<Params>(() => ({ ...DEFAULT_PARAMS }));

  useEffect(() => {
    const pane = new Pane();
    const camera = pane.addFolder({ title: "Camera" });
    camera
      .addBinding(params, "cameraX", { step: 0.01, min: -10, max: 10 })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, cameraX: value }));
      });
    camera
      .addBinding(params, "cameraY", { step: 0.01, min: -10, max: 10 })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, cameraY: value }));
      });
    camera
      .addBinding(params, "cameraZ", { step: 0.01, min: -10, max: 10 })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, cameraZ: value }));
      });
    camera
      .addBinding(params, "zoom", { step: 0.01, min: 0, max: 20 })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, zoom: value }));
      });
    const pointLight = pane.addFolder({ title: "Point Light" });
    pointLight
      .addBinding(params, "pointLightX", {
        step: 0.01,
        min: -10,
        max: 10,
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointLightX: value }));
      });
    pointLight
      .addBinding(params, "pointLightY", {
        step: 0.01,
        min: -10,
        max: 10,
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointLightY: value }));
      });
    pointLight
      .addBinding(params, "pointLightZ", {
        step: 0.01,
        min: -10,
        max: 10,
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointLightZ: value }));
      });
    pointLight
      .addBinding(params, "pointLightIntensity", {
        step: 0.01,
        min: 0,
        max: 20,
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointLightIntensity: value }));
      });
    pointLight
      .addBinding(params, "pointLightColor", {
        view: "colo",
        picker: "inline",
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointLightColor: value }));
      });
    const pointCloud = pane.addFolder({ title: "Point Cloud" });
    pointCloud
      .addBinding(params, "pointCloudColor", {
        view: "color",
        picker: "inline",
      })
      .on("change", ({ value }) => {
        setParams((prev) => ({ ...prev, pointCloudColor: value }));
      });

    setPane(pane);

    return () => {
      pane.dispose();
    };
  }, []);

  return { pane, settings: params, setSettings: setParams };
};

export default function Playlist() {
  const { playlist, tracks, features } = useLoaderData<typeof loader>();
  const { settings, setSettings } = usePaneSettings();
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
      <ThreeDimensionalCanvas
        camera={{
          position: [settings.cameraX, settings.cameraY, settings.cameraZ],
          zoom: settings.zoom,
        }}
      >
        <pointLight
          position={[
            settings.pointLightX,
            settings.pointLightY,
            settings.pointLightZ,
          ]}
          intensity={settings.pointLightIntensity}
          color={settings.pointLightColor}
        />
        {/* <ambientLight intensity={0.5} /> */}
        <ThreeDimensionalControls
          enablePan
          panSpeed={0.15}
          zoomSpeed={0.2}
          autoRotateSpeed={0.2}
        />
        <Points
          data={data}
          pointProps={{ color: settings.pointCloudColor }}
          onPointHovered={setHoveredPoint}
          material="standard"
          onPointerLeave={() => setHoveredPoint(null)}
        />
        <gridHelper />
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
