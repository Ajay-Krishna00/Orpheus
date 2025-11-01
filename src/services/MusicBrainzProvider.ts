import { Album, Artist, Playlist, Track } from "../interface/types";
import { MetadataProvider } from "./MetadataProvider";
import axios from "axios";

export class MusicBrainzProvider extends MetadataProvider{
  private baseUrl = "https://musicbrainz.org/ws/2";
  // Helper to transform MusicBrainz artist data into your model
  private transformArtist(mbArtist: any): Artist {
    return {
      id: mbArtist.id,
      name: mbArtist.name,
      externalUri: `https://musicbrainz.org/artist/${mbArtist.id}`,
      images: [], // MusicBrainz does not provide images directly
    };
  }
  private transformTrack(mbTrack: any): Track{
    const artists = (mbTrack['artist-credit']||[]).map((a:any)=>this.transformArtist(a.artist));
    return {
        id: mbTrack.id,
        name: mbTrack.title,
        durationMs: mbTrack.duration||0,
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
    const res = await axios.get(`${this.baseUrl}/recording/${id}fmt=json&inc=artists+releases`);
    return this.transformTrack(res.data);
  }

  async getAlbum(id: string): Promise<Album>{
    const res = await axios.get(`${this.baseUrl}/release/${id}?fmt=json&inc=artists+recordings`);
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
  }

  async search(query: string): Promise<{ tracks: Track[]; albums?: Album[]; artists?: Artist[]; playlists?: Playlist[]; }> {
    const res = await axios.get(`${this.baseUrl}/recording/?query=${encodeURIComponent(query)}&fmt=json&inc=artists+releases`);
    const tracks = (res.data.recordings || []).map((mbTrack: any) => this.transformTrack(mbTrack));
    return {
      tracks,
      albums: [],
      artists: [],
      playlists: [],
    };
  }
}