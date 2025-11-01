import { useState } from "react";
import { AudioSourceProvider } from "../services/AudioSourceProvider";
import { MusicBrainzProvider } from "../services/MusicBrainzProvider";
import { Track } from "../interface/types";
import TrackPlayer from "react-native-track-player";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Player } from "../components/Player";

const metadataProvider = new MusicBrainzProvider();
const audioProvider = new AudioSourceProvider();

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
      await TrackPlayer.add({
        id: track.id,
        url: audioUrl,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        artwork: track.album.images?.[0]?.uri,
      });
      await TrackPlayer.play();
    }
    catch (e) {
      console.error('playback failed:', e);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Search for a track..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={onSearch}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 8,
          marginBottom: 12,
        }}
      />
      {loading && <Text>Loading...</Text>}

      <FlatList
        data={track}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPlayTrack(item)}>
            <Text style={{ fontSize: 16, marginVertical: 8 }}>
              {item.name} - {item.artists.map(a => a.name).join(', ')}
            </Text>
          </Pressable>
        )}
      />
      <Player/>
    </View>
  )
}
