import axios from "axios"
import { Track } from "../interface/types";
import { database } from "../db";

export class AudioSourceProvider{
  async getAudioUrl(track: Track): Promise<string>{
    //checking if there is a downloaded version
    // const download = await database.get('downloads').find(track.id).catch(() => null);
    // if (download) {
    //   return download.local_file_path;
    // }
    // If no download, search Piped API
    const artistName = track.artists?.[0]?.name || "unknown";
    const query = `${track.name} ${artistName} official audio`;
    const res = await axios.get(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music`);

    // Apply heuristics to find best match
    // (logic to check duration, title, channel name)
    if (!res.data.items || res.data.items.length === 0) {
      throw new Error("No video found for track");
    }
    const bestVideo = res.data.items.find(
      (v:any) => v.duration < track.durationMs + 10 && v.duration > track.durationMs - 10
    ) || res.data.items[0];

    //get stream url
    const streamResponse = await axios.get(`https://pipedapi.kavin.rocks/streams/${bestVideo.id}?`)

    const audioStream = streamResponse.data.audioStreams.find((s:any) => s.format === 'm4a');
    return audioStream.url;
  }
}