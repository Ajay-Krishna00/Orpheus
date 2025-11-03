import { useState } from "react";
import { Track } from "../interface/types";
import TrackPlayer from "react-native-track-player";
import { 
  FlatList, 
  Pressable, 
  Text, 
  TextInput, 
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image
} from "react-native";
import { Player } from "../components/Player";
import { SpotifyProvider } from "../services/SpotifyProvider";
import { YouTubeAudioProvider } from "../services/YouTubeAudioProvider";
import { Colors } from "../theme/colors";

const metadataProvider = new SpotifyProvider();
const audioProvider = new YouTubeAudioProvider();

export const SearchScreen = ()=>{
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    if(!query) return;
    setLoading(true);
    try {
      const result = await metadataProvider.search(query);
      setTrack(result.tracks)
    }
    catch (e) {
      console.error('search failed:', e);
    }
    setLoading(false);
  }
  const onPlayTrack = async (track: Track) => {
    try {
      const audioUrl = await audioProvider.getAudioUrl(track);
      await TrackPlayer.reset();
      
      console.log('🎵 Adding track to player with URL:', audioUrl.substring(0, 100) + '...');
      
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
      await TrackPlayer.play();
    }
    catch (e) {
      console.error('❌ Playback failed:', e);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <Text style={styles.headerSubtitle}>Find your favorite music</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => onPlayTrack(item)}
            style={({ pressed }) => [
              styles.trackItem,
              pressed && styles.trackItemPressed
            ]}
          >
            {item.album?.images?.[0]?.uri ? (
              <Image 
                source={{ uri: item.album.images[0].uri }}
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
              <Text style={styles.artistName} numberOfLines={1}>
                {item.artists.map(a => a.name).join(', ')}
              </Text>
            </View>

            <View style={styles.playIconContainer}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && query ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try searching for something else</Text>
            </View>
          ) : !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎵</Text>
              <Text style={styles.emptyText}>Play what you love</Text>
              <Text style={styles.emptySubtext}>Search for songs, artists, and albums</Text>
            </View>
          ) : null
        }
      />
      
      {/* Player at bottom */}
      <Player/>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <Text style={[styles.navIcon, styles.navIconActive]}>🔍</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Search</Text>
        </Pressable>
        
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>📚</Text>
          <Text style={styles.navLabel}>Library</Text>
        </Pressable>
      </View>
    </View>
  )
}

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
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: Colors.black,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundHighlight,
    paddingBottom: 10,
    padding:5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.spotifyGreen,
    fontWeight: '600',
  },
});