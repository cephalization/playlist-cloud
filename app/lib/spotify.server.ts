import {
  playlistResponseSchema,
  playlistTracksResponseSchema,
  playlistsResponseSchema,
  tracksFeaturesResponseSchema,
  userResponseSchema,
} from "~/lib/schemas";

export class SpotifyClient {
  private accessToken: string;
  private onRefresh?: () => Promise<string | null>;

  constructor({
    accessToken,
    onRefresh,
  }: { accessToken: string; onRefresh?: () => Promise<string | null> }) {
    this.accessToken = accessToken;
    this.onRefresh = onRefresh;
  }

  private makeRequestOptions() {
    return {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const response = await fetch(url, {
      ...this.makeRequestOptions(),
      ...options,
    });
    if (response.status === 401 && retry && this.onRefresh) {
      console.log("refreshing token in client");
      // this should throw a redirect
      this.onRefresh();
    } else if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    return response.json();
  }

  async getUser() {
    return userResponseSchema.parse(
      await this.request("https://api.spotify.com/v1/me"),
    );
  }

  async getPlaylists() {
    return playlistsResponseSchema.parse(
      await this.request("https://api.spotify.com/v1/me/playlists"),
    );
  }

  async getPlaylist(id: string) {
    return playlistResponseSchema.parse(
      await this.request(`https://api.spotify.com/v1/playlists/${id}`),
    );
  }

  async getPlaylistTracks(id: string) {
    return playlistTracksResponseSchema.parse(
      await this.request(`https://api.spotify.com/v1/playlists/${id}/tracks`),
    );
  }

  async getTracksFeatures(ids: string[]) {
    return tracksFeaturesResponseSchema.parse(
      await this.request(
        `https://api.spotify.com/v1/audio-features?ids=${ids.join(",")}`,
      ),
    );
  }
}
