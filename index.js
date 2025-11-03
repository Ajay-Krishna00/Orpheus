/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/PlaybackService';

AppRegistry.registerComponent(appName, () => App);
// Register the background service - pass the function, don't call it
TrackPlayer.registerPlaybackService(() => PlaybackService);