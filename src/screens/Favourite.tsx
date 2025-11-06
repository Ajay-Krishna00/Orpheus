import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {FlatList} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useEffect, useState} from 'react';
import TrackPlayer from 'react-native-track-player';
import {Track, Artist, Album} from '../interface/types';
import {database} from '../db';
import {Q} from '@nozbe/watermelondb';
import {Colors} from '../theme/colors';
import {YouTubeAudioProvider} from '../services/YouTubeAudioProvider';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import {RootStackParamList} from '../interface/navigation';

const FAVORITES_PLAYLIST_NAME = 'Favorites';
const FALLBACK_ALBUM: Album = {
  id: '__favorites__',
  name: 'Favorites',
  images: [],
  albumType: 'album',
  artists: [] as Artist[],
};
const FALLBACK_ARTIST: Artist = {
  id: '__unknown_artist__',
  name: 'Unknown Artist',
  externalUri: '',
  images: [],
};

const audioProvider = new YouTubeAudioProvider();

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Favorite'>;
  setCurrentTrackLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentTrackNotFound: React.Dispatch<React.SetStateAction<boolean>>;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const Favorite = ({
  navigation,
  setCurrentTrackLoading,
  setCurrentTrackNotFound,
}: Props) => {
  const [favSongs, setFavSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [length, setLength] = useState<number>(0);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFavSongs = async () => {
      if (!isMounted) {
        return;
      }

      setLoading(true);

      try {
        const playlistsCollection = database.collections.get('playlists');
        const favorites = await playlistsCollection
          .query(Q.where('name', FAVORITES_PLAYLIST_NAME))
          .fetch();

        if (!isMounted) {
          return;
        }

        if (favorites.length === 0) {
          setFavSongs([]);
          return;
        }

        const favoritesPlaylist = favorites[0];

        const playlistTracksCollection =
          database.collections.get('playlist_tracks');
        const artistTrackCollection = database.collections.get('artist_tracks');
        const playlistEntries = await playlistTracksCollection
          .query(
            Q.where('playlist_id', favoritesPlaylist.id),
            Q.sortBy('created_at', Q.desc),
          )
          .fetch();

        const resolvedTracks = await Promise.all(
          playlistEntries.map(async rawEntry => {
            const entry: any = rawEntry;
            try {
              const trackModel = await entry.track?.fetch();
              if (!trackModel) {
                return null;
              }

              let albumData: Album = {...FALLBACK_ALBUM};

              try {
                const albumModel = await trackModel.album.fetch();
                if (albumModel) {
                  albumData = {
                    id: albumModel.id,
                    name: albumModel.name,
                    images: albumModel.images ?? [],
                    releaseDate: albumModel.releaseDate ?? undefined,
                    totalTracks: albumModel.totalTracks ?? undefined,
                    albumType: albumModel.albumType,
                    artists: [],
                  };
                }
              } catch (albumError) {
                console.log(
                  '⚠️ Failed to fetch album for favorite track:',
                  albumError,
                );
              }

              let artists: Artist[] = [FALLBACK_ARTIST];
              try {
                const artistLinks = await artistTrackCollection
                  .query(Q.where('track_id', trackModel.id))
                  .fetch();

                const artistModels = await Promise.all(
                  artistLinks.map(async rawLink => {
                    const link: any = rawLink;
                    return link.artist?.fetch();
                  }),
                );

                const normalizedArtists = artistModels
                  .filter(Boolean)
                  .map(artistModel => {
                    const artist = artistModel as any;
                    return {
                      id: artist.id,
                      name: artist.name,
                      externalUri: artist.externalUri ?? '',
                      images: artist.images ?? [],
                    } as Artist;
                  });

                if (normalizedArtists.length > 0) {
                  artists = normalizedArtists;
                }
              } catch (artistError) {
                console.log(
                  '⚠️ Failed to fetch artists for favorite track:',
                  artistError,
                );
              }

              const normalizedTrack: Track = {
                id: trackModel.id,
                name: trackModel.name,
                durationMs: trackModel.durationMs,
                album: albumData,
                artists,
                externalUri: trackModel.externalUri,
                explicit: trackModel.explicit,
              };

              return normalizedTrack;
            } catch (error) {
              console.log('⚠️ Failed to resolve favorite track entry:', error);
              return null;
            }
          }),
        );

        if (!isMounted) {
          return;
        }
        setLength(resolvedTracks.length);
        setFavSongs(resolvedTracks.filter(Boolean) as Track[]);
      } catch (error) {
        console.log('❌ Failed to load favorites:', error);
        if (isMounted) {
          setFavSongs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFavSongs();

    return () => {
      isMounted = false;
    };
  }, []);

  const onPlayTrack = async (item: Track) => {
    try {
      setCurrentTrackLoading(true);
      setCurrentTrackNotFound(false);

      await TrackPlayer.reset();

      const audioUrl = await audioProvider.getAudioUrl(item);
      if (audioUrl === 'NOT FOUND') {
        throw new Error('Audio Not Found');
      }

      await TrackPlayer.add({
        id: item.id,
        url: audioUrl,
        title: item.name,
        artist:
          item.artists.map(artist => artist.name).join(', ') ||
          'Unknown Artist',
        artwork: item.album?.images?.[0]?.uri,
      });

      await TrackPlayer.play();
      setCurrentTrackId(item.id);
    } catch (error) {
      console.log('❌ Playback failed:', error);
      setCurrentTrackNotFound(true);
      await TrackPlayer.stop();
    } finally {
      sleep(2000);
      setCurrentTrackLoading(false);
    }
  };

  const renderFavoriteItem = ({item}: {item: Track}) => {
    const primaryArtist =
      item.artists.length > 0
        ? item.artists.map(artist => artist.name).join(', ')
        : FALLBACK_ARTIST.name;

    return (
      <Pressable
        onPress={() => onPlayTrack(item)}
        style={({pressed}) => [
          styles.trackItem,
          pressed && styles.trackItemPressed,
        ]}>
        {item.album?.images?.[0]?.uri ? (
          <Image
            source={{uri: item.album.images[0].uri}}
            style={styles.albumArt}
          />
        ) : (
          <View style={[styles.albumArt, styles.placeholderArt]}>
            <Text style={styles.placeholderIcon}>🎵</Text>
          </View>
        )}
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.trackFooter}>
            <Text style={styles.artistName} numberOfLines={1}>
              {primaryArtist}
            </Text>
            <View style={styles.playIconContainer}>
              <FontAwesome5
                name={item.id === currentTrackId ? 'music' : 'play'}
                size={item.id === currentTrackId ? 20 : 14}
                color={
                  item.id === currentTrackId
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

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            navigation.goBack();
          }}
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
          <Text style={styles.headerTitle}>Your Favorite Songs</Text>
        </View>
      </View>
      {length !== 0 ? (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            paddingHorizontal: 16,
            marginBottom: 8,
          }}>
          Total Favorites: {length}
        </Text>
      ) : null}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.spotifyGreen} />
        </View>
      ) : (
        <FlatList
          data={favSongs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderFavoriteItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorites yet.</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart button on any track to save it here.
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
    gap: 12,
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
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 200,
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
  placeholderIcon: {
    fontSize: 24,
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 0,
    marginTop: 4,
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
  },
  playIconContainer: {
    paddingHorizontal: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  emptySubtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
});
