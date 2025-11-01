import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TrackPlayer, { 
  AppKilledPlaybackBehavior,
  Capability
} from 'react-native-track-player';
import { SafeAreaView, StatusBar } from 'react-native';
import { SearchScreen } from './src/screens/SearchScreen';

const Stack = createStackNavigator();

export default function App() {
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
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
          ],
        });

        console.log('TrackPlayer setup complete ✅');
      } catch (err) {
        console.error('TrackPlayer setup failed:', err);
      }
    };

    setupPlayer();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
          }}
        >
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Music Search' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}
