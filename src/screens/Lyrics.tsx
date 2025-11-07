import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useEffect, useState} from 'react';
import {database} from '../db';
import {Q} from '@nozbe/watermelondb';
import {Colors} from '../theme/colors';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../interface/navigation';
import TrackModel from '../db/models/Track';

type Props = NativeStackScreenProps<RootStackParamList, 'Lyrics'>;

// A component to fetch and display lyrics
export const LyricsView = ({navigation, route}: Props) => {
  const {artist, title, trackId} = route.params;
  const [lyric, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch the lyrics
    const fetchLyrics = async () => {
      // Reset state for new search
      setIsLoading(true);
      setLyrics('');
      setError('');

      // Helper to resolve the track in local database
      const resolveTrack = async (): Promise<TrackModel | null> => {
        const tracksCollection = database.collections.get<TrackModel>('tracks');

        if (trackId) {
          try {
            const trackRecord = await tracksCollection.find(trackId);
            return trackRecord as TrackModel;
          } catch (lookupError) {
            console.log('⚠️ Track lookup by ID failed:', lookupError);
          }
        }

        if (title) {
          const matches = await tracksCollection
            .query(Q.where('name', title))
            .fetch();

          if (matches.length > 0) {
            return matches[0] as TrackModel;
          }
        }

        return null;
      };

      const trackRecord = await resolveTrack();

      if (trackRecord?.lyrics) {
        setLyrics(trackRecord.lyrics);
        setIsLoading(false);
        return;
      }

      // The API URL is case-sensitive and needs to be encoded
      const artistEncoded = encodeURIComponent(artist);
      const titleEncoded = encodeURIComponent(title);
      const url = `https://api.lyrics.ovh/v1/${artistEncoded}/${titleEncoded}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.lyrics) {
          setLyrics(data.lyrics);

          if (trackRecord) {
            await database.write(async () => {
              await trackRecord.update(record => {
                record.lyrics = data.lyrics;
              });
            });
            console.log('Lyrics saved to database ✅');
          }
        } else {
          setError('Lyrics not found for this song.');
        }
      } catch (e) {
        setError('Failed to fetch lyrics. Please check your connection.');
        console.error('Error fetching lyrics:', e);
      }
      setIsLoading(false);
    };

    // Only fetch if artist and title are provided
    if (artist && title) {
      fetchLyrics();
    } else {
      setIsLoading(false);
    }
  }, [artist, title, trackId]); // Re-run this effect if artist or title changes

  // 1. Show a loading spinner
  if (isLoading) {
    return (
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>
              Lyrics of "{title}" by {artist}
            </Text>
          </View>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  // 2. Show an error message
  if (error !== '') {
    return (
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>
              Lyrics of "{title}" by {artist}
            </Text>
          </View>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // 3. Show the lyrics
  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.headerTitle}>
            Lyrics of "{title}" by {artist}
          </Text>
        </View>
      </View>
      <View style={styles.screen}>
        <Text style={styles.lyricsText}>{lyric}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundElevated,
    flex: 1,
    padding: 10,
  },
  screen: {
    flex: 1,
    padding: 10,
    paddingBottom: 50,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
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
});
