import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [trackLoading, setTrackLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    const setupPlayer = async () => {
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
      } catch (err) {
        console.error('TrackPlayer setup failed:', err);
      }
    };

    setupPlayer();
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Colors.black}}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <NavigationContainer>
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
        </Stack.Navigator>
      </NavigationContainer>
      <Player />

      {notFound && (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Sorry</Text>
          <Text style={styles.notFoundText}>Audio Not Found</Text>
        </View>
      )}
      {trackLoading && (
        <View style={styles.notFoundContainer}>
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
    height: 220,
    zIndex: 10001,
  },
  notFoundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.spotifyGreenLight,
  },
});
