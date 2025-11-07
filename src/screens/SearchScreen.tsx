import {useRef, useState} from 'react';
import {Track} from '../interface/types';
import TrackPlayer from 'react-native-track-player';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import {SpotifyProvider} from '../services/SpotifyProvider';
import {YouTubeAudioProvider} from '../services/YouTubeAudioProvider';
import {Colors} from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import {RootStackParamList} from '../interface/navigation';
import {Recommendations} from '../components/Recommendations';

const metadataProvider = new SpotifyProvider();
const audioProvider = new YouTubeAudioProvider();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
  setTrackLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNotFound: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SearchScreen = ({
  navigation,
  setTrackLoading,
  setNotFound,
}: Props) => {
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const heartBeat = useRef(new Animated.Value(0)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  heartBeat.setValue(0);
  loop.current = Animated.loop(
    Animated.sequence([
      Animated.timing(heartBeat, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
      Animated.timing(heartBeat, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]),
  );
  loop.current.start();
  const beatScale = heartBeat.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const onSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const result = await metadataProvider.search(query);
      setTrack(result.tracks);
    } catch (e) {
      console.error('search failed:', e);
    }
    setLoading(false);
  };
  const onPlayTrack = async (track: Track) => {
    try {
      setTrackLoading(true);
      setNotFound(false);
      await TrackPlayer.reset();
      const audioUrl = await audioProvider.getAudioUrl(track);
      if (audioUrl === 'NOT FOUND') {
        setTrackLoading(false);
        throw new Error('Audio Not Found');
      }

      console.log(
        '🎵 Adding track to player with URL:',
        audioUrl.substring(0, 100) + '...',
      );

      // For Invidious URLs, we need minimal headers or no custom headers
      // The URL is already a direct stream link
      await TrackPlayer.add({
        id: track.id,
        url: audioUrl, // Direct URL, no complex headers needed
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        artwork: track.album?.images?.[0]?.uri || undefined,
      });
      console.log('✅ Track added, starting playback...');
      setCurrentTrackId(track.id);
      await TrackPlayer.play();
      sleep(2500);
      setTrackLoading(false);
    } catch (e) {
      console.log('❌ Playback failed:', e);
      setNotFound(true);
      await TrackPlayer.stop();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Header */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 2,
            }}>
            <Image
              source={require('../../assets/Orpheus.png')}
              style={{width: 52, height: 52}}
            />
            <Text style={styles.headerTitle}>Orpheus</Text>
          </View>
          <Animated.View
            style={{transform: [{scale: beatScale}], paddingRight: 5}}>
            <Pressable onPress={() => navigation.navigate('Favorite')}>
              <FontAwesome name={'heart'} size={25} color={Colors.error} />
            </Pressable>
          </Animated.View>
        </View>
        <Text style={styles.headerSubtitle}>Find your favorite music</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome
          name={'search'}
          size={16}
          color={Colors.white}
          style={{marginRight: 10}}
        />
        <TextInput
          placeholder="What do you want to listen to?"
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.spotifyGreen} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={track}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({item}) => (
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 0,
                }}>
                <Text style={styles.artistName} numberOfLines={1}>
                  {item.artists.map(a => a.name).join(', ')}
                </Text>
                <View style={styles.playIconContainer}>
                  <Text style={styles.playIcon}>
                    {item.id === currentTrackId ? (
                      <Icon
                        name="music"
                        size={20}
                        color={Colors.spotifyGreen}
                      />
                    ) : (
                      <Icon
                        name="play"
                        size={14}
                        color={Colors.textSecondary}
                      />
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && query ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for something else
              </Text>
            </View>
          ) : !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎵</Text>
              <Text style={styles.emptyText}>Play what you love</Text>
              <Text style={styles.emptySubtext}>
                Search for songs, artists, and albums
              </Text>
              {/* <Recommendations /> */}
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.spotifyGreenLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundHighlight,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: Colors.spotifyGreen,
    marginTop: 12,
    fontSize: 14,
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.spotifyGreenLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
