import { Track } from "../interface/types";
import axios from 'axios';

/**
 * YouTubeAudioProvider - Audio source provider using Invidious API
 * 
 * Simple and reliable approach:
 * 1. Search YouTube videos using Invidious API
 * 2. Extract audio stream URLs from Invidious
 * 3. Fallback to demo audio if all instances fail
 */
export class YouTubeAudioProvider {

  private invidiousInstances = [
    'https://inv.perditum.com',
    'https://invidious.nerdvpn.de',
    'https://inv.nadeko.net',
    'https://invidious.f5.si',
  ];

  /**
   * Search YouTube using Invidious API
   */
  private async searchYouTube(query: string): Promise<string> {
    console.log('🔍 Searching YouTube for:', query);

    // Try each Invidious instance
    for (const instance of this.invidiousInstances) {
      try {
        console.log('🔄 Trying:', instance);
        const response = await axios.get(`${instance}/api/v1/search`, {
          params: {
            q: query,
            type: 'video',
          },
          timeout: 15000,
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Find first valid video with a videoId
          for (const item of response.data) {
            const videoId = item.videoId || item.id;
            const title = item.title;

            if (videoId && typeof videoId === 'string' && videoId.length > 0) {
              console.log('✅ Found video:', title || 'Unknown title');
              console.log('📹 Video ID:', videoId);
              return videoId;
            }
          }

          console.warn('⚠️ Search returned results but no valid videoId found');
        } else {
          console.warn('⚠️ Invalid or empty response from', instance);
        }
      } catch (error: any) {
        console.warn('⚠️ Instance failed:', instance, '-', error.message);
        continue;
      }
    }

    throw new Error('All YouTube search instances failed');
  }

  /**
   * Get audio stream URL for a track
   */
  async getAudioUrl(track: Track): Promise<string> {
    try {
      console.log('🎵 Getting audio URL for:', track.name, 'by', track.artists?.[0]?.name);

      // Build search query
      const artistName = track.artists?.[0]?.name || '';
      const query = `${track.name} ${artistName}`;

      // Search YouTube to get video ID
      const videoId = await this.searchYouTube(query);

      // Extract audio URL from Invidious
      console.log('🔄 Extracting audio stream from Invidious...');
      for (const instance of this.invidiousInstances) {
        try {
          const videoRes = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
            timeout: 15000,
          });

          // Try to get audio formats
          const audioFormats = videoRes.data.adaptiveFormats
            ?.filter((f: any) => f.type?.includes('audio'))
            ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

          if (audioFormats && audioFormats.length > 0) {
            const audioUrl = audioFormats[0].url;
            console.log('✅ Audio URL obtained via Invidious');
            console.log('🎧 Format:', audioFormats[0].type);
            console.log('🔗 URL length:', audioUrl.length);
            
            // Check if URL is already using the Invidious domain or is a direct Google URL
            if (audioUrl.includes('googlevideo.com') || audioUrl.includes('youtube.com')) {
              console.log('📡 Direct Google/YouTube URL detected');
              // These URLs should work directly
              return audioUrl;
            } else if (audioUrl.startsWith('/')) {
              // Relative URL - prepend instance domain
              const fullUrl = `${instance}${audioUrl}`;
              console.log('🔗 Using proxied URL:', fullUrl.substring(0, 100) + '...');
              return fullUrl;
            } else {
              // Already a full URL from Invidious
              return audioUrl;
            }
          }

          // Fallback: try formatStreams (combined audio+video but might work)
          const formatStreams = videoRes.data.formatStreams;
          if (formatStreams && formatStreams.length > 0) {
            console.log('⚠️ Using formatStreams as fallback');
            const streamUrl = formatStreams[0].url;
            
            if (streamUrl.startsWith('/')) {
              return `${instance}${streamUrl}`;
            }
            return streamUrl;
          }

        } catch (invError: any) {
          console.warn('⚠️ Invidious instance failed:', instance, '-', invError.message);
          continue;
        }
      }

      throw new Error('Could not extract audio stream from Invidious');

    } catch (error: any) {
      console.error('❌ YouTubeAudioProvider error:', error.message);

      // Fallback to demo audio
      console.warn('⚠️ All methods failed. Using demo audio for testing...');
      return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
  }
}