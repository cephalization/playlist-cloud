import { z } from "zod";

export const userResponseSchema = z.object({
  country: z.string(),
  display_name: z.string().nullish(),
  email: z.string(),
  explicit_content: z.object({
    filter_enabled: z.boolean(),
    filter_locked: z.boolean(),
  }),
  external_urls: z.object({
    spotify: z.string(),
  }),
  followers: z
    .object({
      href: z.string().nullish(),
      total: z.number().nullish(),
    })
    .nullish(),
  href: z.string(),
  id: z.string(),
  images: z
    .array(
      z.object({
        url: z.string(),
        height: z.number(),
        width: z.number(),
      }),
    )
    .nullish(),
  product: z.string().nullish(),
  type: z.string(),
  uri: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const playlistResponseSchema = z.object({
  collaborative: z.boolean(),
  description: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  id: z.string(),
  images: z
    .array(
      z.object({
        url: z.string(),
        height: z.number().nullish(),
        width: z.number().nullish(),
      }),
    )
    .nullish(),
  name: z.string(),
  owner: userResponseSchema.partial(),
  public: z.boolean(),
  snapshot_id: z.string(),
  tracks: z.object({
    href: z.string(),
    total: z.number(),
  }),
  type: z.string(),
  uri: z.string(),
});

export type PlaylistResponse = z.infer<typeof playlistResponseSchema>;

export const playlistsResponseSchema = z.object({
  href: z.string(),
  items: z.array(playlistResponseSchema),
  limit: z.number(),
  next: z.string().nullish(),
  offset: z.number(),
  previous: z.string().nullish(),
  total: z.number(),
});

export type PlaylistsResponse = z.infer<typeof playlistsResponseSchema>;

export const playlistTrackResponseSchema = z.object({
  added_at: z.string(),
  added_by: z.object({
    external_urls: z.object({
      spotify: z.string(),
    }),
    followers: z
      .object({
        href: z.string().nullish(),
        total: z.number(),
      })
      .nullish(),
    href: z.string(),
    id: z.string(),
    type: z.string(),
    uri: z.string(),
  }),
  is_local: z.boolean(),
  track: z.object({
    album: z.object({
      album_type: z.string(),
      total_tracks: z.number(),
      available_markets: z.array(z.string()),
      external_urls: z.object({
        spotify: z.string(),
      }),
      href: z.string(),
      id: z.string(),
      images: z.array(
        z.object({
          url: z.string(),
          height: z.number(),
          width: z.number(),
        }),
      ),
      name: z.string(),
      release_date: z.string(),
      release_date_precision: z.string(),
      restrictions: z
        .object({
          reason: z.string(),
        })
        .nullish(),
      type: z.string(),
      uri: z.string(),
      artists: z.array(
        z.object({
          external_urls: z.object({
            spotify: z.string(),
          }),
          href: z.string(),
          id: z.string(),
          name: z.string(),
          type: z.string(),
          uri: z.string(),
        }),
      ),
    }),
    artists: z.array(
      z.object({
        external_urls: z.object({
          spotify: z.string(),
        }),
        href: z.string(),
        id: z.string(),
        name: z.string(),
        type: z.string(),
        uri: z.string(),
      }),
    ),
    available_markets: z.array(z.string()),
    disc_number: z.number(),
    duration_ms: z.number(),
    explicit: z.boolean(),
    external_ids: z
      .object({
        isrc: z.string(),
        ean: z.string().nullish(),
        upc: z.string().nullish(),
      })
      .nullish(),
    external_urls: z.object({
      spotify: z.string(),
    }),
    href: z.string(),
    id: z.string(),
    is_playable: z.boolean().nullish(),
    linked_from: z.object({}).nullish(),
    restrictions: z
      .object({
        reason: z.string(),
      })
      .nullish(),
    name: z.string(),
    popularity: z.number(),
    preview_url: z.string().nullish(),
    track_number: z.number(),
    type: z.string(),
    uri: z.string(),
    is_local: z.boolean(),
  }),
});

export type PlaylistTrackResponse = z.infer<typeof playlistTrackResponseSchema>;

export const playlistTracksResponseSchema = z.object({
  href: z.string(),
  items: z.array(playlistTrackResponseSchema),
  limit: z.number(),
  next: z.string().nullish(),
  offset: z.number(),
  previous: z.string().nullish(),
  total: z.number(),
});

export const trackFeaturesResponseSchema = z.object({
  acousticness: z.number(),
  analysis_url: z.string(),
  danceability: z.number(),
  duration_ms: z.number(),
  energy: z.number(),
  id: z.string(),
  instrumentalness: z.number(),
  key: z.number(),
  liveness: z.number(),
  loudness: z.number(),
  mode: z.number(),
  speechiness: z.number(),
  tempo: z.number(),
  time_signature: z.number(),
  track_href: z.string(),
  type: z.string(),
  uri: z.string(),
  valence: z.number(),
});

export type TrackFeaturesResponse = z.infer<typeof trackFeaturesResponseSchema>;

export const tracksFeaturesResponseSchema = z.object({
  audio_features: z.array(trackFeaturesResponseSchema),
});

export type TracksFeaturesResponse = z.infer<
  typeof tracksFeaturesResponseSchema
>;
