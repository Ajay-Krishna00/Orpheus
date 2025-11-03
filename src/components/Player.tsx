import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Image } from 'react-native';
import TrackPlayer, { usePlaybackState, useProgress, State } from 'react-native-track-player';
import { Colors } from '../theme/colors';

export const Player = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [track, setTrack] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const getCurrentTrack = async () => {
      const trackId = await TrackPlayer.getActiveTrackIndex();
      if (typeof trackId === 'number') {
        const trackObj = await TrackPlayer.getTrack(trackId);
        setTrack(trackObj);
        
        // Slide up animation
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      }
    };
    getCurrentTrack();
  }, [playbackState]);

  if (!track) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaying = playbackState.state === State.Playing;
  const progressPercent = progress.duration > 0 
    ? (progress.position / progress.duration) * 100 
    : 0;

  const handleSeek = async (position: number) => {
    await TrackPlayer.seekTo(position);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      {/* Player Content */}
      <View style={styles.content}>
        {/* Track Info */}
        <View style={styles.trackInfoRow}>
          {track.artwork ? (
            <Image 
              source={{ uri: track.artwork }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.albumArt}>
              <Text style={styles.albumArtIcon}>🎵</Text>
            </View>
          )}
          
          <View style={styles.textContainer}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>

          {/* Quick Play/Pause */}
          <Pressable
            onPress={() => isPlaying ? TrackPlayer.pause() : TrackPlayer.play()}
            style={({ pressed }) => [
              styles.quickPlayButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.quickPlayIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Previous Button */}
          <Pressable
            onPress={() => TrackPlayer.skipToPrevious()}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.controlIcon}>⏮</Text>
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable
            onPress={() => isPlaying ? TrackPlayer.pause() : TrackPlayer.play()}
            style={({ pressed }) => [
              styles.controlButton,
              styles.playButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.playIcon}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          </Pressable>

          {/* Next Button */}
          <Pressable
            onPress={() => TrackPlayer.skipToNext()}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.controlIcon}>⏭</Text>
          </Pressable>
        </View>

        {/* Progress Bar - Interactable */}
        <View style={styles.progressSection}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
            <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
          </View>
          
          <Pressable 
            style={styles.progressBarContainer}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const containerWidth = 350; // approximate width
              const newPosition = (locationX / containerWidth) * progress.duration;
              handleSeek(newPosition);
            }}
          >
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]}>
                <View style={styles.progressThumb} />
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 8,
    right: 8,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    borderColor: Colors.textTertiary,
    borderWidth: 1,
    shadowColor: Colors.spotifyGreen,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    paddingBottom: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  albumArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumArtIcon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickPlayIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 32,
    backgroundColor: Colors.spotifyGreen,
    shadowColor: Colors.spotifyGreenDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  controlIcon: {
    fontSize: 28,
    color: Colors.textPrimary,
  },
  playIcon: {
    fontSize: 32,
    color: Colors.spotifyGreenDark,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.spotifyGreen,
    borderRadius: 2,
    position: 'relative',
    shadowColor: Colors.spotifyGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressThumb: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
