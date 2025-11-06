import {Track} from '../interface/types';
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
    'https://inv.nadeko.net',
    'https://invidious.f5.si',
    'https://invidious.nerdvpn.de',
    'https://yt.artemislena.eu',
    'https://inv.tux.pizza',
    'https://iv.nboeck.de',
    'https://invidious.privacydev.net',
    'https://invidious.slipfox.xyz',
    'https://inv.zzls.xyz',
    'https://invidious.protokolla.fi',
  ];

  private preferredItagOrder = ['251', '250', '249', '140', '141'];

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

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
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

          console.log('⚠️ Search returned results but no valid videoId found');
        } else {
          console.log('⚠️ Invalid or empty response from', instance);
        }
      } catch (error: any) {
        console.log('⚠️ Instance failed:', instance, '-', error.message);
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
      console.log(
        '🎵 Getting audio URL for:',
        track.name,
        'by',
        track.artists?.[0]?.name,
      );

      // Build search query
      const artistName = track.artists?.[0]?.name || '';
      const query = `${track.name} ${artistName}`;

      // Search YouTube to get video ID
      const videoId = await this.searchYouTube(query);

      // Extract audio URL from Invidious
      console.log('🔄 Extracting audio stream from Invidious...');
      for (const instance of this.invidiousInstances) {
        try {
          const videoRes = await axios.get(
            `${instance}/api/v1/videos/${videoId}`,
            {
              timeout: 15000,
            },
          );

          // Try to get audio formats
          const audioFormats = videoRes.data.adaptiveFormats
            ?.filter((f: any) => f.type?.includes('audio'))
            ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

          if (audioFormats && audioFormats.length > 0) {
            const preferredFormat = this.selectPreferredFormat(audioFormats);

            if (preferredFormat) {
              const proxiedUrl = this.buildLocalStreamUrl(
                instance,
                videoId,
                preferredFormat.itag,
              );

              if (proxiedUrl) {
                console.log(
                  '🔗 Local Invidious stream:',
                  this.truncateUrl(proxiedUrl),
                );
                return proxiedUrl;
              }

              const fallbackUrl = this.normalizeUrl(
                instance,
                preferredFormat.url,
              );
              if (fallbackUrl) {
                console.log(
                  '🔗 Fallback audio URL:',
                  this.truncateUrl(fallbackUrl),
                );
                return fallbackUrl;
              }
            }
          }

          // Fallback: try formatStreams (combined audio+video but might work)
          const formatStreams = videoRes.data.formatStreams;
          if (formatStreams && formatStreams.length > 0) {
            console.log('⚠️ Using formatStreams as fallback');
            const preferredStream = this.selectPreferredFormat(formatStreams);
            const streamUrl = this.normalizeUrl(
              instance,
              preferredStream?.url || formatStreams[0].url,
            );
            if (streamUrl) {
              console.log('🔗 Format stream URL:', this.truncateUrl(streamUrl));
              return streamUrl;
            }
          }
        } catch (invError: any) {
          console.log(
            '⚠️ Invidious instance failed:',
            instance,
            '-',
            invError.message,
          );
          continue;
        }
      }

      throw new Error('Could not extract audio stream from Invidious');
    } catch (error: any) {
      console.log('❌ YouTubeAudioProvider error:', error.message);

      // Fallback to demo audio
      console.log('⚠️ All methods failed.');
      return 'NOT FOUND';
    }
  }

  private selectPreferredFormat(formats: any[]): any | null {
    if (!formats || formats.length === 0) {
      return null;
    }

    const withItag = formats.filter(
      (format: any) => format?.itag !== undefined,
    );
    const preferred = this.preferredItagOrder
      .map(itag => withItag.find((format: any) => String(format.itag) === itag))
      .find(Boolean);

    return preferred || withItag[0] || formats[0];
  }

  private buildLocalStreamUrl(
    instance: string,
    videoId: string,
    itag?: string,
  ): string | null {
    if (!itag) {
      return null;
    }

    const numericItag = String(itag);
    const url = `${instance}/latest_version?id=${videoId}&itag=${numericItag}&local=true&backend=ytapi`;
    return url;
  }

  private normalizeUrl(instance: string, url?: string): string | null {
    if (!url) {
      return null;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${instance}${url}`;
    }

    return `https://${url}`;
  }

  private truncateUrl(url: string, maxLength = 120): string {
    if (url.length <= maxLength) {
      return url;
    }

    return `${url.substring(0, maxLength)}...`;
  }
}
