import React, {useEffect, useState} from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SearchScreen} from './src/screens/SearchScreen';
import {Colors} from './src/theme/colors';
import {Favorite} from './src/screens/Favourite';
import {Player} from './src/components/Player';
import {LyricsView} from './src/screens/Lyrics';
import {RootStackParamList} from './src/interface/navigation';
import {PlaylistDetail} from './src/screens/PlaylistDetail';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [trackLoading, setTrackLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [closePlayer, setClosePlayer] = useState(false);

  useEffect(() => {
    const setupPlay = async () => {
      try {
        // Setup the player
        await TrackPlayer.setupPlayer({
          waitForBuffer: true,
        });

        // Update player options
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
        });

        console.log('TrackPlayer setup complete ✅');
        setIsPlayerReady(true);
      } catch (err) {
        console.error('TrackPlayer setup failed:', err);
        setIsPlayerReady(false);
      }
    };

    setupPlay();
    return () => {
      TrackPlayer.reset().catch((error: unknown) => {
        console.error('TrackPlayer reset on unmount failed:', error);
      });
    };
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Colors.black}}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="Search">
          <Stack.Screen name="Search">
            {props => (
              <SearchScreen
                {...props}
                setTrackLoading={setTrackLoading}
                setNotFound={setNotFound}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Favorite"
            options={{presentation: 'modal', animation: 'slide_from_right'}}>
            {props => (
              <Favorite
                {...props}
                setCurrentTrackLoading={setTrackLoading}
                setCurrentTrackNotFound={setNotFound}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Lyrics"
            options={{presentation: 'modal', animation: 'slide_from_bottom'}}>
            {props => <LyricsView {...props} />}
          </Stack.Screen>
          <Stack.Screen
            name="PlaylistDetail"
            options={{presentation: 'modal', animation: 'slide_from_right'}}>
            {props => (
              <PlaylistDetail
                {...props}
                setCurrentTrackLoading={setTrackLoading}
                setCurrentTrackNotFound={setNotFound}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      {isPlayerReady && (
        <Player
          setClosePlayer={setClosePlayer}
          onOpenLyrics={(
            artistName: string,
            trackTitle: string,
            trackId?: string,
          ) => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Lyrics', {
                artist: artistName,
                title: trackTitle,
                trackId,
              });
            }
          }}
        />
      )}

      {notFound && (
        <View
          style={[styles.notFoundContainer, {height: !closePlayer ? 240 : 85}]}>
          <Text style={styles.notFoundText}>Sorry</Text>
          <Text style={styles.notFoundText}>Audio Not Found</Text>
        </View>
      )}
      {trackLoading && (
        <View
          style={[styles.notFoundContainer, {height: !closePlayer ? 240 : 85}]}>
          <ActivityIndicator size="large" color={Colors.spotifyGreen} />
          <Text style={styles.notFoundText}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  notFoundContainer: {
    position: 'absolute',
    bottom: 50,
    left: 8,
    right: 8,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    borderColor: Colors.textTertiary,
    borderWidth: 1,
    shadowColor: Colors.spotifyGreen,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    paddingBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  notFoundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.spotifyGreenLight,
  },
});
