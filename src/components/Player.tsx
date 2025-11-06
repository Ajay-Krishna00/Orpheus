import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Animated, Image} from 'react-native';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  RepeatMode,
} from 'react-native-track-player';
import {Colors} from '../theme/colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {database} from '../db';
import {Q} from '@nozbe/watermelondb';
import {SpotifyProvider} from '../services/SpotifyProvider';
import type {
  Album as AlbumMetadata,
  Artist as ArtistMetadata,
  Track as TrackMetadata,
} from '../interface/types';

const FAVORITES_PLAYLIST_NAME = 'Favorites';
const LOCAL_USER_IDENTIFIER = 'local_user';
const FALLBACK_ALBUM_ID = '__favorites__';

const spotifyProvider = new SpotifyProvider();

const ensureAlbumRecord = async (
  albumData?: AlbumMetadata,
): Promise<string> => {
  if (!albumData || !albumData.id) {
    return FALLBACK_ALBUM_ID;
  }

  const albumsCollection = database.collections.get('albums');

  try {
    const existingAlbum = await albumsCollection.find(albumData.id);

    await database.write(async () => {
      await existingAlbum.update((albumModel: any) => {
        const album: any = albumModel;
        album.name = albumData.name ?? album.name;
        album.albumType = albumData.albumType ?? album.albumType;
        album.images = albumData.images ?? album.images ?? [];
        album.releaseDate = albumData.releaseDate ?? album.releaseDate ?? null;
        if (typeof albumData.totalTracks === 'number') {
          album.totalTracks = albumData.totalTracks;
        }
      });
    });

    return existingAlbum.id;
  } catch (error) {
    let createdAlbum: any;
    await database.write(async () => {
      createdAlbum = await albumsCollection.create(newAlbum => {
        (newAlbum as any)._raw.id = albumData.id;
        (newAlbum as any).name = albumData.name ?? 'Unknown Album';
        (newAlbum as any).albumType = albumData.albumType ?? 'album';
        (newAlbum as any).images = albumData.images ?? [];
        (newAlbum as any).releaseDate = albumData.releaseDate ?? null;
        (newAlbum as any).totalTracks =
          typeof albumData.totalTracks === 'number'
            ? albumData.totalTracks
            : null;
      });
    });

    return createdAlbum.id;
  }
};

const upsertArtistRelations = async (
  artistsData: ArtistMetadata[] | undefined,
  trackId: string,
  albumId: string,
) => {
  if (!artistsData || artistsData.length === 0) {
    return;
  }

  const artistsCollection = database.collections.get('artists');
  const artistTracksCollection = database.collections.get('artist_tracks');
  const albumArtistsCollection = database.collections.get('album_artists');

  for (const artist of artistsData) {
    if (!artist?.id) {
      continue;
    }

    let artistRecord: any;

    try {
      artistRecord = await artistsCollection.find(artist.id);
      await database.write(async () => {
        await artistRecord.update((existingModel: any) => {
          const existing: any = existingModel;
          existing.name = artist.name ?? existing.name;
          existing.externalUri = artist.externalUri ?? existing.externalUri;
          existing.images = artist.images ?? existing.images ?? [];
        });
      });
    } catch (error) {
      await database.write(async () => {
        artistRecord = await artistsCollection.create(newArtist => {
          (newArtist as any)._raw.id = artist.id;
          (newArtist as any).name = artist.name ?? 'Unknown Artist';
          (newArtist as any).externalUri = artist.externalUri ?? '';
          (newArtist as any).images = artist.images ?? [];
        });
      });
    }

    const artistId = artistRecord.id;

    if (albumId && albumId !== FALLBACK_ALBUM_ID) {
      const existingAlbumArtist = await albumArtistsCollection
        .query(Q.where('album_id', albumId), Q.where('artist_id', artistId))
        .fetch();

      if (existingAlbumArtist.length === 0) {
        await database.write(async () => {
          await albumArtistsCollection.create(newLink => {
            (newLink as any)._raw.album_id = albumId;
            (newLink as any)._raw.artist_id = artistId;
          });
        });
      }
    }

    const existingArtistTrack = await artistTracksCollection
      .query(Q.where('track_id', trackId), Q.where('artist_id', artistId))
      .fetch();

    if (existingArtistTrack.length === 0) {
      await database.write(async () => {
        await artistTracksCollection.create(newLink => {
          (newLink as any)._raw.track_id = trackId;
          (newLink as any)._raw.artist_id = artistId;
        });
      });
    }
  }
};

export const Player = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [repeatMode, setRepeatMode] = useState<number>(0); // 0: off, 1: one, 2: all
  const [track, setTrack] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isFavorite, setIsFavorite] = useState(false);

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
  }, [playbackState, slideAnim]);

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        if (!track) {
          setIsFavorite(false);
          return;
        }

        const identifierCandidates = [
          typeof track.id === 'string' && track.id.length > 0 ? track.id : null,
          typeof track.url === 'string' && track.url.length > 0
            ? track.url
            : null,
          typeof track.externalUri === 'string' && track.externalUri.length > 0
            ? track.externalUri
            : null,
        ].filter(Boolean) as string[];

        if (identifierCandidates.length === 0) {
          setIsFavorite(false);
          return;
        }

        const playlistsCollection = database.collections.get('playlists');
        const favorites = await playlistsCollection
          .query(Q.where('name', FAVORITES_PLAYLIST_NAME))
          .fetch();

        if (favorites.length === 0) {
          setIsFavorite(false);
          return;
        }

        const tracksCollection = database.collections.get('tracks');
        let storedTrack: any = null;

        for (const candidate of identifierCandidates) {
          const matches = await tracksCollection
            .query(Q.where('external_uri', candidate))
            .fetch();

          if (matches.length > 0) {
            storedTrack = matches[0];
            break;
          }

          try {
            const byId = await tracksCollection.find(candidate);
            storedTrack = byId;
            break;
          } catch (lookupError) {
            // Track not found by primary key; continue searching other identifiers.
          }
        }

        if (!storedTrack) {
          setIsFavorite(false);
          return;
        }

        const playlistTracksCollection =
          database.collections.get('playlist_tracks');
        const links = await playlistTracksCollection
          .query(
            Q.where('playlist_id', favorites[0].id),
            Q.where('track_id', storedTrack.id),
          )
          .fetch();

        setIsFavorite(links.length > 0);
      } catch (error) {
        console.log('⚠️ Favorite status lookup failed:', error);
        setIsFavorite(false);
      }
    };

    loadFavoriteStatus();
  }, [track]);

  useEffect(() => {
    if (repeatMode === 0) {
      TrackPlayer.setRepeatMode(RepeatMode.Off);
    } else if (repeatMode === 1) {
      TrackPlayer.setRepeatMode(RepeatMode.Track);
    } else if (repeatMode === 2) {
      TrackPlayer.setRepeatMode(RepeatMode.Queue);
    }
  }, [repeatMode]);

  if (!track) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaying = playbackState.state === State.Playing;
  const progressPercent =
    progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;

  const handleSeek = async (position: number) => {
    await TrackPlayer.seekTo(position);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const ensureLocalUser = async () => {
    const usersCollection = database.collections.get('users');
    const existingUsers = await usersCollection
      .query(Q.where('username', LOCAL_USER_IDENTIFIER))
      .fetch();

    if (existingUsers.length > 0) {
      return existingUsers[0];
    }

    let createdUser: any;
    await database.write(async () => {
      createdUser = await usersCollection.create(newUser => {
        (newUser as any).username = LOCAL_USER_IDENTIFIER;
        (newUser as any).displayName = 'Local User';
        (newUser as any).email = null;
        (newUser as any).avatarUrl = null;
        (newUser as any).followersCount = 0;
        (newUser as any).followingCount = 0;
        (newUser as any).country = 'IND';
      });
    });

    return createdUser;
  };

  const ensureFavoritesPlaylist = async () => {
    const playlistsCollection = database.collections.get('playlists');
    const existingFavorites = await playlistsCollection
      .query(Q.where('name', FAVORITES_PLAYLIST_NAME))
      .fetch();

    if (existingFavorites.length > 0) {
      return existingFavorites[0];
    }

    const owner = await ensureLocalUser();
    let createdPlaylist: any;
    await database.write(async () => {
      createdPlaylist = await playlistsCollection.create(newPlaylist => {
        (newPlaylist as any).name = FAVORITES_PLAYLIST_NAME;
        (newPlaylist as any).description = 'Your Favorite Songs';
        (newPlaylist as any).public = false;
        (newPlaylist as any).collaborative = false;
        (newPlaylist as any)._raw.owner_id = owner.id;
        (newPlaylist as any).images = [];
      });
    });

    return createdPlaylist;
  };

  const handleFav = async () => {
    if (!track) {
      return;
    }

    const identifier = track.id ?? track.url;

    if (!identifier) {
      console.log('⚠️ Unable to toggle favorite without track identifier');
      return;
    }

    try {
      const favoritesPlaylist = await ensureFavoritesPlaylist();
      const tracksCollection = database.collections.get('tracks');
      const playlistTracksCollection =
        database.collections.get('playlist_tracks');

      let storedTrack = await tracksCollection
        .query(Q.where('external_uri', identifier))
        .fetch();

      let trackRecord: any = storedTrack[0];

      if (!trackRecord) {
        let metadataTrack: TrackMetadata | null = null;

        if (typeof track.id === 'string' && track.id.length > 0) {
          try {
            metadataTrack = await spotifyProvider.getTrack(track.id);
          } catch (metadataError) {
            console.log('⚠️ Spotify metadata fetch failed:', metadataError);
          }
        }

        const durationSeconds =
          typeof track.duration === 'number'
            ? track.duration
            : typeof track.durationMs === 'number'
            ? track.durationMs / 1000
            : progress.duration;

        const fallbackDurationMs = Number.isFinite(durationSeconds)
          ? Math.max(0, Math.round(durationSeconds * 1000))
          : 0;

        const durationMs =
          typeof metadataTrack?.durationMs === 'number'
            ? metadataTrack.durationMs
            : fallbackDurationMs;

        const defaultAlbumId =
          typeof track.albumId === 'string' && track.albumId.length > 0
            ? track.albumId
            : FALLBACK_ALBUM_ID;

        let albumId = defaultAlbumId;

        if (metadataTrack?.album) {
          albumId = await ensureAlbumRecord(metadataTrack.album);
        } else if (albumId === FALLBACK_ALBUM_ID && track.artwork) {
          await ensureAlbumRecord({
            id: FALLBACK_ALBUM_ID,
            name: 'Favorites',
            albumType: 'album',
            images: [{uri: track.artwork}],
            artists: [],
          } as AlbumMetadata);
        }

        const externalUriValue =
          metadataTrack?.externalUri ??
          (typeof track.externalUri === 'string' && track.externalUri.length > 0
            ? track.externalUri
            : typeof identifier === 'string'
            ? identifier
            : String(identifier));

        const trackIdValue =
          metadataTrack?.id ??
          (typeof identifier === 'string' && identifier.length > 0
            ? identifier
            : `track_${Date.now()}`);

        const albumTypeValue = metadataTrack?.album?.albumType ?? 'album';

        const albumImagesValue =
          metadataTrack?.album?.images ??
          (track.artwork ? [{uri: track.artwork}] : []);

        const albumReleaseDateValue = metadataTrack?.album?.releaseDate ?? null;

        const albumTotalTracksValue =
          typeof metadataTrack?.album?.totalTracks === 'number'
            ? metadataTrack.album.totalTracks
            : null;

        const trackArtistsValue: ArtistMetadata[] =
          metadataTrack?.artists && metadataTrack.artists.length > 0
            ? metadataTrack.artists
            : track.artist
            ? [
                {
                  id:
                    typeof identifier === 'string' && identifier.length > 0
                      ? `${identifier}_artist`
                      : `artist_${Date.now()}`,
                  name: track.artist,
                  externalUri: '',
                  images: track.artwork ? [{uri: track.artwork}] : [],
                },
              ]
            : [];

        if (trackIdValue) {
          try {
            const existingById = await tracksCollection.find(trackIdValue);
            if (existingById) {
              trackRecord = existingById as any;
            }
          } catch (lookupError) {
            // Not found by ID; we'll create a fresh record.
          }
        }

        if (trackRecord) {
          await database.write(async () => {
            await trackRecord!.update((existingModel: any) => {
              existingModel.name =
                metadataTrack?.name ?? track.title ?? 'Unknown Title';
              existingModel.durationMs = durationMs;
              existingModel.explicit =
                metadataTrack?.explicit ?? Boolean(track.explicit);
              existingModel.externalUri = externalUriValue;
              existingModel._raw.album_id = albumId;
              existingModel._raw.name =
                metadataTrack?.name ?? track.title ?? 'Unknown Title';
              existingModel._raw.albumType = albumTypeValue;
              existingModel._raw.images = albumImagesValue;
              existingModel._raw.releaseDate = albumReleaseDateValue;
              existingModel._raw.totalTracks = albumTotalTracksValue;
              existingModel.artists = trackArtistsValue;
            });
          });
        } else {
          await database.write(async () => {
            trackRecord = await tracksCollection.create(newTrack => {
              (newTrack as any)._raw.id = trackIdValue;
              (newTrack as any).name =
                metadataTrack?.name ?? track.title ?? 'Unknown Title';
              (newTrack as any).durationMs = durationMs;
              (newTrack as any).explicit =
                metadataTrack?.explicit ?? Boolean(track.explicit);
              (newTrack as any).externalUri = externalUriValue;
              (newTrack as any)._raw.album_id = albumId;
              (newTrack as any)._raw.name =
                metadataTrack?.name ?? track.title ?? 'Unknown Title';
              (newTrack as any)._raw.albumType = albumTypeValue;
              (newTrack as any)._raw.images = albumImagesValue;
              (newTrack as any)._raw.releaseDate = albumReleaseDateValue;
              (newTrack as any)._raw.totalTracks = albumTotalTracksValue;
              (newTrack as any).artists = trackArtistsValue;
            });
          });
        }

        await upsertArtistRelations(
          trackArtistsValue,
          trackRecord!.id,
          albumId,
        );
      }

      if (!trackRecord) {
        console.log('⚠️ Unable to resolve track record for favorites');
        return;
      }

      const existingLink = await playlistTracksCollection
        .query(
          Q.where('playlist_id', favoritesPlaylist.id),
          Q.where('track_id', trackRecord.id),
        )
        .fetch();

      if (existingLink.length > 0) {
        await database.write(async () => {
          for (const record of existingLink) {
            await record.destroyPermanently();
          }
        });
        setIsFavorite(false);
        return;
      }

      await database.write(async () => {
        await playlistTracksCollection.create(newEntry => {
          (newEntry as any)._raw.playlist_id = favoritesPlaylist.id;
          (newEntry as any)._raw.track_id = trackRecord!.id;
          (newEntry as any)._raw.created_at = Date.now();
        });
      });

      setIsFavorite(true);
    } catch (error) {
      console.log('❌ Favorite toggle failed:', error);
    }
  };

  return (
    <Animated.View style={[styles.container, {transform: [{translateY}]}]}>
      {/* Player Content */}
      <View style={styles.content}>
        {/* Track Info */}
        <View style={styles.trackInfoRow}>
          {track.artwork ? (
            <Image
              source={{uri: track.artwork}}
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
            onPress={() =>
              isPlaying ? TrackPlayer.pause() : TrackPlayer.play()
            }
            style={({pressed}) => [
              styles.quickPlayButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.quickPlayIcon}>
              {isPlaying ? (
                <MaterialIcons
                  name="pause-circle-outline"
                  size={34}
                  color={Colors.textPrimary}
                />
              ) : (
                <MaterialIcons
                  name="play-circle-outline"
                  size={34}
                  color={Colors.textPrimary}
                />
              )}
            </Text>
          </Pressable>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => {
              setRepeatMode(prevMode => (prevMode + 1) % 3);
            }}
            style={({pressed}) => {
              return [styles.controlButton, pressed && styles.buttonPressed];
            }}>
            {repeatMode === 2 ? (
              <MaterialCommunityIcons
                name="repeat"
                size={26}
                color={Colors.spotifyGreenDark}
              />
            ) : repeatMode === 1 ? (
              <MaterialIcons
                name="repeat-one"
                size={26}
                color={Colors.spotifyGreenDark}
              />
            ) : (
              <MaterialCommunityIcons
                name="repeat-off"
                size={26}
                color={Colors.textSecondary}
              />
            )}
          </Pressable>
          {/* Previous Button */}
          <Pressable
            onPress={() => TrackPlayer.skipToPrevious()}
            style={({pressed}) => [
              styles.controlButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.controlIcon}>⏮</Text>
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable
            onPress={() =>
              isPlaying ? TrackPlayer.pause() : TrackPlayer.play()
            }
            style={({pressed}) => [
              styles.controlButton,
              styles.playButton,
              pressed && styles.buttonPressed,
            ]}>
            {isPlaying ? (
              <MaterialIcons
                name="pause-circle-outline"
                size={40}
                color={Colors.textPrimary}
              />
            ) : (
              <MaterialIcons
                name="play-circle-outline"
                size={40}
                color={Colors.textPrimary}
              />
            )}
          </Pressable>

          {/* Next Button */}
          <Pressable
            onPress={() => TrackPlayer.skipToNext()}
            style={({pressed}) => [
              styles.controlButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.controlIcon}>⏭</Text>
          </Pressable>

          {/* Like Button */}
          <Pressable
            onPress={handleFav}
            style={({pressed}) => {
              return [styles.controlButton, pressed && styles.buttonPressed];
            }}>
            <FontAwesome
              name={isFavorite ? 'heart' : 'heart-o'}
              size={22}
              color={isFavorite ? Colors.spotifyGreen : Colors.textSecondary}
            />
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
            onPress={e => {
              const {locationX} = e.nativeEvent;
              const containerWidth = 350; // approximate width
              const newPosition =
                (locationX / containerWidth) * progress.duration;
              handleSeek(newPosition);
            }}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, {width: `${progressPercent}%`}]}>
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
    zIndex: 1000,
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
    justifyContent: 'space-around',
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
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{scale: 0.95}],
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
    shadowOffset: {width: 0, height: 0},
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
