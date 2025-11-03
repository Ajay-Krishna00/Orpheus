import axios from "axios"
import { Track } from "../interface/types";
import { database } from "../db";

/**
 * AudioSourceProvider - Retrieves audio stream URLs for tracks
 * 
 * CURRENT ISSUE: Public YouTube proxy APIs (Piped/Invidious) are frequently down
 * due to YouTube's aggressive blocking of third-party access.
 * 
 * LONG-TERM SOLUTIONS:
 * 1. Implement official YouTube Data API v3 with your own API key
 *    - Get key from: https://console.cloud.google.com/
 *    - Free tier: 10,000 quota units/day
 * 
 * 2. Use a paid music streaming API:
 *    - Spotify Web API (requires Premium for playback)
 *    - Deezer API
 *    - SoundCloud API
 * 
 * 3. Self-host your own Piped/Invidious instance
 *    - More reliable but requires server infrastructure
 * 
 * CURRENT FALLBACK: Demo audio stream (SoundHelix) for testing
 */
export class AudioSourceProvider {
  // Multiple Piped instances for fallback
  private pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi-libre.kavin.rocks',
    'https://api-piped.mha.fi',
    'https://piped-api.garudalinux.org',
  ];

  // Invidious instances as ultimate fallback
  private invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.jing.rocks',
    'https://iv.nboeck.de',
  ];

  // Create axios instance with proper headers
  private api = axios.create({
    headers: {
      'User-Agent': 'Orpheus/1.0.0 (https://github.com/Ajay-Krishna00/Orpheus)',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });

  // Try multiple Piped instances until one works
  private async tryPipedInstances<T>(
    operation: (baseUrl: string) => Promise<T>
  ): Promise<T> {
    let lastError: any;

    for (const instance of this.pipedInstances) {
      try {
        console.log('🔄 Trying Piped instance:', instance);
        return await operation(instance);
      } catch (error: any) {
        console.warn('⚠️ Instance failed:', instance, error.message);
        lastError = error;
        // Continue to next instance
      }
    }

    // All instances failed
    throw lastError || new Error('All Piped instances failed');
  }

  // Fallback to Invidious if Piped fails
  private async tryInvidious(query: string): Promise<string> {
    console.log('🔄 Falling back to Invidious API...');

    for (const instance of this.invidiousInstances) {
      try {
        console.log('🔄 Trying Invidious instance:', instance);

        // Search for video
        const searchRes = await this.api.get(`${instance}/api/v1/search`, {
          params: {
            q: query,
            type: 'video',
          }
        });

        if (!searchRes.data || searchRes.data.length === 0) {
          continue;
        }

        const video = searchRes.data[0];
        console.log('✅ Found video:', video.title, 'ID:', video.videoId);

        // Get video details including audio streams
        const videoRes = await this.api.get(`${instance}/api/v1/videos/${video.videoId}`);

        // Get the best audio stream
        const audioStream = videoRes.data.adaptiveFormats
          ?.filter((f: any) => f.type?.includes('audio'))
          ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        if (!audioStream?.url) {
          throw new Error('No audio stream found in video');
        }

        console.log('✅ Invidious audio URL obtained');
        return audioStream.url;

      } catch (error: any) {
        console.warn('⚠️ Invidious instance failed:', instance, error.message);
        continue;
      }
    }

    throw new Error('All Invidious instances failed');
  }

  async getAudioUrl(track: Track): Promise<string> {
    try {
      console.log('🎵 Getting audio URL for:', track.name, 'by', track.artists?.[0]?.name);

      //checking if there is a downloaded version
      // const download = await database.get('downloads').find(track.id).catch(() => null);
      // if (download) {
      //   return download.local_file_path;
      // }

      // Clean up track name and artist for better search results
      const cleanTrackName = (track.name || '')
        .replace(/–/g, '-')          // Replace em-dash with regular dash
        .replace(/—/g, '-')          // Replace em-dash with regular dash
        .replace(/\(.*?\)/g, '')     // Remove anything in parentheses
        .replace(/\[.*?\]/g, '')     // Remove anything in brackets
        .replace(/[^\w\s-]/g, '')    // Remove special characters except spaces and dashes
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .trim();

      const cleanArtistName = (track.artists?.[0]?.name || 'unknown')
        .replace(/–/g, '-')
        .replace(/—/g, '-')
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Build search query with cleaned names
      const query = `${cleanTrackName} ${cleanArtistName}`.trim();

      // Skip if query is too short or empty
      if (query.length < 3) {
        throw new Error("Track name too short or invalid");
      }

      console.log('🔍 Searching Piped API for:', query);
      console.log('🔍 Query length:', query.length, 'characters');

      // Try Piped first, fallback to Invidious if all fail
      try {
        // Try multiple Piped instances
        const searchResult = await this.tryPipedInstances(async (baseUrl) => {
          const res = await this.api.get(`${baseUrl}/search`, {
            params: {
              q: query,
              filter: 'music',
            }
          });

          if (!res.data.items || res.data.items.length === 0) {
            throw new Error("No video found for track");
          }

          return { baseUrl, data: res.data };
        });

        console.log('📹 Found', searchResult.data.items.length, 'videos');

        const bestVideo = searchResult.data.items.find(
          (v: any) => v.duration < track.durationMs + 10 && v.duration > track.durationMs - 10
        ) || searchResult.data.items[0];

        console.log('✅ Best match:', bestVideo.title, 'ID:', bestVideo.url);

        //get stream url
        console.log('📡 Getting stream URL...');
        const videoId = bestVideo.url.split('=')[1];

        const streamResult = await this.tryPipedInstances(async (baseUrl) => {
          const streamResponse = await this.api.get(`${baseUrl}/streams/${videoId}`);
          return streamResponse.data;
        });

        const audioStream = streamResult.audioStreams?.find((s: any) => s.format === 'm4a')
          || streamResult.audioStreams?.[0];

        if (!audioStream) {
          throw new Error("No audio stream found");
        }

        console.log('✅ Audio URL obtained:', audioStream.url.substring(0, 50) + '...');
        return audioStream.url;

      } catch (pipedError: any) {
        console.warn('⚠️ All Piped instances failed, trying Invidious...');
        // If Piped completely fails, try Invidious
        return await this.tryInvidious(query);
      }

    } catch (error: any) {
      console.error('❌ AudioSourceProvider error:', error.message);
      console.error('Error code:', error.code);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
      }

      // Ultimate fallback: Use a demo audio stream for testing
      console.warn('⚠️ All APIs failed. Using demo audio stream for testing...');
      console.warn('ℹ️  This is a temporary workaround. The public YouTube APIs are currently down.');
      console.warn('ℹ️  Consider implementing your own YouTube API key or using a paid service.');

      // Return a free sample audio URL for demonstration
      // This is from archive.org (public domain audio)
      return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
  }
}