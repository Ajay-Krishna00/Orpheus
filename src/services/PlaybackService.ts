import TrackPlayer, { Event } from 'react-native-track-player';
export const PlaybackService = async function () {
  // --- Basic playback controls ---
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());

  // --- Seek events (from notification slider) ---
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });

  // // --- Stop / Destroy events ---
  // TrackPlayer.addEventListener(Event.RemoteStop, async () => {
  //   await TrackPlayer.destroy();
  // });

  // --- Custom / Advanced ones ---
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async ({ track }) => {
    console.log("Playback ended for:", track);
  });
  TrackPlayer.addEventListener(Event.PlaybackError, async (error) => {
    console.error("Playback error:", error);
  });

  // Optional: Handle “ducking” (e.g., when another app plays sound)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
};