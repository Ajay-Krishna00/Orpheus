export type RootStackParamList = {
  Search: undefined;
  Favorite: undefined;
  Lyrics: {artist: string; title: string; trackId?: string};
  PlaylistDetail: {
    playlistId: string;
    name: string;
    description?: string;
    coverUrl?: string;
    accessToken: string;
  };
};
