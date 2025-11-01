import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import TrackPlayer, { usePlaybackState, useProgress, State } from 'react-native-track-player';

export const Player = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [track, setTrack] = useState<any>(null);

  useEffect(() => {
    const getCurrentTrack = async () => {
      const trackId = await TrackPlayer.getActiveTrackIndex();
      if (typeof trackId === 'number') {
        const trackObj = await TrackPlayer.getTrack(trackId);
        setTrack(trackObj);
      }
    };
    getCurrentTrack();
  }, [playbackState]);

  if (!track) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#222',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>{track.title}</Text>
      <Text style={{ color: 'gray' }}>{track.artist}</Text>

      <Pressable
        onPress={() =>
          playbackState.state === State.Playing
            ? TrackPlayer.pause()
            : TrackPlayer.play()
        }
        style={{ marginTop: 8 }}
      >
        <Text style={{ color: 'white' }}>
          {playbackState.state === State.Playing ? '⏸ Pause' : '▶️ Play'}
        </Text>
      </Pressable>

      <View style={{ height: 4, backgroundColor: '#444', marginTop: 8 }}>
        <View
          style={{
            width: `${(progress.position / progress.duration) * 100}%`,
            height: 4,
            backgroundColor: '#1DB954',
          }}
        />
      </View>
    </View>
  );
};
