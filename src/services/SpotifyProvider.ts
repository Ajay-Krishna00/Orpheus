import {Album, Artist, Playlist, Track} from '../interface/types';
import {MetadataProvider} from './MetadataProvider';
import axios from 'axios';
import {SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET} from '@env';

/**
 * SpotifyProvider - Metadata source (like Spotube)
 *
 * This provides high-quality metadata from Spotify's official API.
 * For audio playback, we use YouTube (similar to Spotube's approach).
 *
 * Setup:
 * 1. Go to https://developer.spotify.com/dashboard
 * 2. Create an app
 * 3. Get Client ID and Client Secret
 * 4. Add them to .env file (see .env.example)
 */
export class SpotifyProvider extends MetadataProvider {
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;

  // Credentials loaded from .env file
  private clientId = SPOTIFY_CLIENT_ID;
  private clientSecret = SPOTIFY_CLIENT_SECRET;

  private api = axios.create({
    baseURL: 'https://api.spotify.com/v1',
    timeout: 30000,
  });

  // Get access token using client credentials flow
  private async ensureToken() {
    if (Date.now() < this.tokenExpiresAt) {
      return; // Token still valid
    }

    try {
      console.log('🔐 Getting Spotify access token...');

      // Encode credentials in base64 (React Native compatible)
      const credentials = `${this.clientId}:${this.clientSecret}`;
      const base64Credentials = btoa(credentials); // Use built-in btoa for React Native

      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${base64Credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt =
        Date.now() + response.data.expires_in * 1000 - 60000;

      // Set token for API requests
      this.api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${this.accessToken}`;

      console.log(
        '✅ Spotify token obtained, expires in:',
        response.data.expires_in,
        'seconds',
      );
    } catch (error: any) {
      console.error('❌ Failed to get Spotify token:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  } // Transform Spotify track to our model
  private transformTrack(spotifyTrack: any): Track {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      durationMs: spotifyTrack.duration_ms,
      album: {
        id: spotifyTrack.album.id,
        name: spotifyTrack.album.name,
        albumType: spotifyTrack.album.album_type,
        artists: spotifyTrack.album.artists.map((a: any) =>
          this.transformArtist(a),
        ),
        images: spotifyTrack.album.images.map((img: any) => ({
          uri: img.url,
          height: img.height,
          width: img.width,
        })),
        releaseDate: spotifyTrack.album.release_date,
        totalTracks: spotifyTrack.album.total_tracks,
      },
      artists: spotifyTrack.artists.map((a: any) => this.transformArtist(a)),
      externalUri: spotifyTrack.external_urls.spotify,
      explicit: spotifyTrack.explicit,
    };
  }

  private transformArtist(spotifyArtist: any): Artist {
    return {
      id: spotifyArtist.id,
      name: spotifyArtist.name,
      externalUri: spotifyArtist.external_urls?.spotify || '',
      images:
        spotifyArtist.images?.map((img: any) => ({
          uri: img.url,
          height: img.height,
          width: img.width,
        })) || [],
    };
  }

  // Implement the contract methods
  async getTrack(id: string): Promise<Track> {
    await this.ensureToken();
    const response = await this.api.get(`/tracks/${id}`);
    return this.transformTrack(response.data);
  }

  async getAlbum(id: string): Promise<Album> {
    await this.ensureToken();
    const response = await this.api.get(`/albums/${id}`);
    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      albumType: data.album_type,
      artists: data.artists.map((a: any) => this.transformArtist(a)),
      images: data.images.map((img: any) => ({
        uri: img.url,
        height: img.height,
        width: img.width,
      })),
      releaseDate: data.release_date,
      totalTracks: data.total_tracks,
    };
  }

  async search(query: string): Promise<{
    tracks: Track[];
    albums?: Album[];
    artists?: Artist[];
    playlists?: Playlist[];
  }> {
    await this.ensureToken();

    console.log('🔍 Searching Spotify for:', query);

    const response = await this.api.get('/search', {
      params: {
        q: query,
        type: 'track,album,artist',
        limit: 20,
      },
    });

    const data = response.data;

    return {
      tracks: (data.tracks?.items || []).map((track: any) =>
        this.transformTrack(track),
      ),
      albums: (data.albums?.items || []).map((album: any) => ({
        id: album.id,
        name: album.name,
        albumType: album.album_type,
        artists: album.artists.map((a: any) => this.transformArtist(a)),
        images: album.images.map((img: any) => ({
          uri: img.url,
          height: img.height,
          width: img.width,
        })),
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
      })),
      artists: (data.artists?.items || []).map((artist: any) =>
        this.transformArtist(artist),
      ),
      playlists: [],
    };
  }
}
