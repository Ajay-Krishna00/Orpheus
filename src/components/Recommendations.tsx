import {SPOTIFY_TOKEN} from '@env';
import {useEffect} from 'react';
import {Text, View} from 'react-native';

export const Recommendations = () => {
  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = SPOTIFY_TOKEN;
      async function fetchWebApi({
        endpoint,
        method,
        body,
      }: {
        endpoint: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        body?: any;
      }) {
        const res = await fetch(`https://api.spotify.com/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method,
          body: JSON.stringify(body),
        });
        return await res.json();
      }

      async function getTopTracks() {
        return (
          await fetchWebApi({
            endpoint: 'v1/me/top/tracks?time_range=long_term&limit=20',
            method: 'GET',
          })
        ).items;
      }

      const topTracks = await getTopTracks();
      console.log(
        topTracks?.map(
          ({name, artists}: {name: string; artists: {name: string}[]}) =>
            `${name} by ${artists.map(artist => artist.name).join(', ')}`,
        ),
      );
    };
    fetchRecommendations();
  }, []);
  return (
    <View>
      <Text>Recommendations</Text>
    </View>
  );
};
