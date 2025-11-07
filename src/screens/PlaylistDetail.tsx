import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackPlayer from 'react-native-track-player';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {RootStackParamList} from '../interface/navigation';
import {Colors} from '../theme/colors';
import {Track, Album, Artist} from '../interface/types';
import {YouTubeAudioProvider} from '../services/YouTubeAudioProvider';

const audioProvider = new YouTubeAudioProvider();

const FALLBACK_ARTIST: Artist = {
  id: '__unknown_artist__',
  name: 'Unknown Artist',
  externalUri: '',
  images: [],
};

const FALLBACK_ALBUM: Album = {
  id: '__unknown_album__',
  name: 'Unknown Album',
  images: [],
  albumType: 'album',
  artists: [FALLBACK_ARTIST],
};

type Props = NativeStackScreenProps<RootStackParamList, 'PlaylistDetail'> & {
  setCurrentTrackLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTrackNotFound: React.Dispatch<React.SetStateAction<boolean>>;
};

type SimplifiedPlaylistTrack = {
  track: Track;
  addedAt?: string;
};

const transformSpotifyTrack = (rawTrack: any): Track | null => {
  if (!rawTrack || !rawTrack.id) {
    return null;
  }

  const album = rawTrack.album
    ? {
        id: rawTrack.album.id ?? FALLBACK_ALBUM.id,
        name: rawTrack.album.name ?? FALLBACK_ALBUM.name,
        images:
          rawTrack.album.images?.map((img: any) => ({uri: img.url})) ?? [],
        albumType: rawTrack.album.album_type ?? FALLBACK_ALBUM.albumType,
        artists:
          rawTrack.album.artists?.map((artist: any) => ({
            id: artist.id ?? FALLBACK_ARTIST.id,
            name: artist.name ?? FALLBACK_ARTIST.name,
            externalUri: artist.external_urls?.spotify ?? '',
            images: artist.images?.map((img: any) => ({uri: img.url})) ?? [],
          })) ?? FALLBACK_ALBUM.artists,
        releaseDate: rawTrack.album.release_date,
        totalTracks: rawTrack.album.total_tracks,
      }
    : FALLBACK_ALBUM;

  const artists = rawTrack.artists?.length
    ? rawTrack.artists.map((artist: any) => ({
        id: artist.id ?? FALLBACK_ARTIST.id,
        name: artist.name ?? FALLBACK_ARTIST.name,
        externalUri: artist.external_urls?.spotify ?? '',
        images: artist.images?.map((img: any) => ({uri: img.url})) ?? [],
      }))
    : FALLBACK_ALBUM.artists;

  return {
    id: rawTrack.id,
    name: rawTrack.name ?? 'Unknown Track',
    durationMs: rawTrack.duration_ms ?? 0,
    externalUri: rawTrack.external_urls?.spotify ?? '',
    explicit: Boolean(rawTrack.explicit),
    album,
    artists,
  };
};

export const PlaylistDetail = ({
  navigation,
  route,
  setCurrentTrackLoading,
  setCurrentTrackNotFound,
}: Props) => {
  const {playlistId, name, description, coverUrl, accessToken} = route.params;

  const [tracks, setTracks] = useState<SimplifiedPlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [playlistMeta, setPlaylistMeta] = useState<{
    description?: string;
    cover?: string;
    followerCount?: number;
    ownerName?: string;
  }>({description, cover: coverUrl});

  useEffect(() => {
    let isMounted = true;

    const fetchPlaylistDetails = async () => {
      if (!accessToken) {
        setError('Missing Spotify access token. Please sign in again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          const message =
            response.status === 401
              ? 'Spotify session expired. Please sign in again.'
              : 'Unable to load playlist right now. Please try again later.';
          throw new Error(message);
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        const resolvedTracks: SimplifiedPlaylistTrack[] =
          data.tracks?.items?.map((item: any) => {
            const track = transformSpotifyTrack(item.track);
            if (!track) {
              return null;
            }
            return {
              track,
              addedAt: item.added_at,
            };
          }) ?? [];

        setTracks(resolvedTracks.filter(Boolean) as SimplifiedPlaylistTrack[]);
        setPlaylistMeta({
          description: data.description ?? description,
          cover: data.images?.[0]?.url ?? coverUrl,
          followerCount: data.followers?.total,
          ownerName: data.owner?.display_name ?? data.owner?.id,
        });
      } catch (err: any) {
        console.log('❌ Failed to load playlist:', err);
        if (isMounted) {
          setError(err.message ?? 'Failed to load playlist.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPlaylistDetails();

    return () => {
      isMounted = false;
    };
  }, [accessToken, coverUrl, description, playlistId]);

  const handlePlayTrack = async (track: Track) => {
    try {
      setCurrentTrackLoading(true);
      setCurrentTrackNotFound(false);

      await TrackPlayer.reset();
      const audioUrl = await audioProvider.getAudioUrl(track);

      if (audioUrl === 'NOT FOUND') {
        throw new Error('Audio Not Found');
      }

      await TrackPlayer.add({
        id: track.id,
        url: audioUrl,
        title: track.name,
        artist:
          track.artists.map(artist => artist.name).join(', ') ||
          FALLBACK_ARTIST.name,
        artwork: track.album?.images?.[0]?.uri,
      });

      await TrackPlayer.play();
      setCurrentTrackId(track.id);
    } catch (err) {
      console.log('❌ Playback failed:', err);
      setCurrentTrackNotFound(true);
      await TrackPlayer.stop();
    } finally {
      setCurrentTrackLoading(false);
    }
  };

  const renderTrack = ({item}: {item: SimplifiedPlaylistTrack}) => {
    const primaryArtist = item.track.artists
      .map(artist => artist.name)
      .join(', ');

    return (
      <Pressable
        onPress={() => handlePlayTrack(item.track)}
        style={({pressed}) => [
          styles.trackItem,
          pressed && styles.trackItemPressed,
        ]}>
        {item.track.album?.images?.[0]?.uri ? (
          <Image
            source={{uri: item.track.album.images[0].uri}}
            style={styles.albumArt}
          />
        ) : (
          <View style={[styles.albumArt, styles.placeholderArt]}>
            <Text style={styles.placeholderIcon}>🎵</Text>
          </View>
        )}
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {item.track.name}
          </Text>
          <View style={styles.trackFooter}>
            <Text style={styles.artistName} numberOfLines={1}>
              {primaryArtist || FALLBACK_ARTIST.name}
            </Text>
            <View style={styles.playIconContainer}>
              <FontAwesome5
                name={item.track.id === currentTrackId ? 'music' : 'play'}
                size={item.track.id === currentTrackId ? 20 : 14}
                color={
                  item.track.id === currentTrackId
                    ? Colors.spotifyGreen
                    : Colors.textSecondary
                }
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const playlistLengthLabel = useMemo(() => {
    if (tracks.length === 0) {
      return 'No tracks available';
    }
    if (tracks.length === 1) {
      return '1 track';
    }
    return `${tracks.length} tracks`;
  }, [tracks.length]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({pressed}) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <FontAwesome5
            name="arrow-left"
            size={18}
            color={Colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.coverWrapper}>
            {playlistMeta.cover ? (
              <Image
                source={{uri: playlistMeta.cover}}
                style={styles.coverImage}
              />
            ) : (
              <View style={[styles.coverImage, styles.placeholderCover]}>
                <Text style={styles.placeholderIcon}>🎧</Text>
              </View>
            )}
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>{name}</Text>
            {playlistMeta.ownerName ? (
              <Text style={styles.ownerText}>by {playlistMeta.ownerName}</Text>
            ) : null}
            <Text style={styles.trackCount}>{playlistLengthLabel}</Text>
          </View>
        </View>
      </View>

      {playlistMeta.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {playlistMeta.description}
        </Text>
      ) : null}

      {error ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={Colors.spotifyGreen} />
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.track.id}
          renderItem={renderTrack}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.feedbackContainer}>
              <Text style={styles.emptyText}>
                We couldn’t find any songs in this playlist.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 24,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundHighlight,
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{scale: 0.95}],
  },
  coverWrapper: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  ownerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  trackCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  trackItemPressed: {
    backgroundColor: Colors.backgroundHighlight,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  placeholderArt: {
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  trackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
