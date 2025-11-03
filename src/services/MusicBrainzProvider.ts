import { Album, Artist, Playlist, Track } from "../interface/types";
import { MetadataProvider } from "./MetadataProvider";
import axios from "axios";

export class MusicBrainzProvider extends MetadataProvider {
  private baseUrl = "https://musicbrainz.org/ws/2";

  // Create axios instance with required headers
  private api = axios.create({
    baseURL: this.baseUrl,
    headers: {
      'User-Agent': 'Orpheus/1.0.0 (https://github.com/Ajay-Krishna00/Orpheus; enthusiastajay00@gmail.com)',
      'Accept': 'application/json'
    },
    timeout: 30000, // 30 second timeout
  });

  // Helper to transform MusicBrainz artist data into your model
  private transformArtist(mbArtist: any): Artist {
    return {
      id: mbArtist.id,
      name: mbArtist.name,
      externalUri: `https://musicbrainz.org/artist/${mbArtist.id}`,
      images: [], // MusicBrainz does not provide images directly
    };
  }
  private transformTrack(mbTrack: any): Track {
    const artists = (mbTrack['artist-credit'] || []).map((a: any) => this.transformArtist(a.artist));
    return {
      id: mbTrack.id,
      name: mbTrack.title,
      durationMs: mbTrack.duration || 0,
      album: {
        id: mbTrack.releases?.[0]?.id || "",
        name: mbTrack.releases?.[0]?.title || "",
        albumType: "album",
        artists: artists,
        images: [],
      },
      artists: artists,
      externalUri: `https://musicbrainz.org/recording/${mbTrack.id}`,
      explicit: false,
    }
  }
  // === Implement the Contract Methods ===
  async getTrack(id: string): Promise<Track> {
    try {
      // Add delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await this.api.get(`/recording/${id}`, {
        params: {
          fmt: 'json',
          inc: 'artists+releases'
        }
      });
      return this.transformTrack(res.data);
    } catch (error: any) {
      console.error('MusicBrainz getTrack error:', error.message);
      throw error;
    }
  }

  async getAlbum(id: string): Promise<Album> {
    try {
      // Add delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await this.api.get(`/release/${id}`, {
        params: {
          fmt: 'json',
          inc: 'artists+recordings'
        }
      });
      const mbAlbum = res.data;
      const artists = (mbAlbum['artist-credit'] || []).map((a: any) => this.transformArtist(a.artist));
      return {
        id: mbAlbum.id,
        name: mbAlbum.title,
        albumType: "album",
        artists: artists,
        images: [],
        releaseDate: mbAlbum.date,
        totalTracks: mbAlbum["track-count"],
      }
    } catch (error: any) {
      console.error('MusicBrainz getAlbum error:', error.message);
      throw error;
    }
  }

  async search(query: string): Promise<{ tracks: Track[]; albums?: Album[]; artists?: Artist[]; playlists?: Playlist[]; }> {
    try {
      console.log('🔍 MusicBrainz search started for:', query);

      // Add delay to respect rate limiting (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('📡 Making API request to:', `${this.baseUrl}/recording`);

      const res = await this.api.get(`/recording`, {
        params: {
          query: query,
          fmt: 'json',
          limit: 50, // Get more results so we can filter
        }
      });

      console.log('✅ API response received, recordings count:', res.data.recordings?.length || 0);

      // Filter and prioritize original recordings
      const allTracks = (res.data.recordings || [])
        .map((mbTrack: any) => this.transformTrack(mbTrack))
        .filter((track: Track) => {
          const trackName = track.name.toLowerCase();
          const artistName = track.artists?.[0]?.name?.toLowerCase() || '';

          // Filter out obvious covers, remixes, mashups, and problematic entries
          return !trackName.includes('cover') &&
            !trackName.includes('karaoke') &&
            !trackName.includes('mashup') &&
            !trackName.includes('vs.') &&
            !trackName.includes('tribute') &&
            !trackName.includes('not featuring') &&
            !trackName.includes('instrumental') &&
            !artistName.includes('various') &&
            !artistName.includes('tribute');
        })
        .slice(0, 25); // Take top 25 after filtering

      console.log('✅ Search successful, returning', allTracks.length, 'tracks after filtering');

      return {
        tracks: allTracks,
        albums: [],
        artists: [],
        playlists: [],
      };
    } catch (error: any) {
      console.error('❌ MusicBrainz search error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error config:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        params: error.config?.params,
        headers: error.config?.headers,
      });

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Request was made but no response.');
        console.error('Request:', error.request);
      }

      // Return empty results on error instead of crashing
      return {
        tracks: [],
        albums: [],
        artists: [],
        playlists: [],
      };
    }
  }
}