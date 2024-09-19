import { playlistsResponseSchema, userResponseSchema } from "~/lib/schemas";

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
      const newToken = await this.onRefresh();
      if (newToken) {
        this.accessToken = newToken;
        return this.request(url, options, false);
      } else {
        throw new Error("Failed to refresh access token");
      }
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
}
