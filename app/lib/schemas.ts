import { z } from "zod";

export const userResponseSchema = z.object({
  country: z.string(),
  display_name: z.string(),
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
  images: z.array(
    z.object({
      url: z.string(),
      height: z.number(),
      width: z.number(),
    }),
  ),
  product: z.string(),
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
  images: z.array(
    z.object({
      url: z.string(),
      height: z.number().nullish(),
      width: z.number().nullish(),
    }),
  ),
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
