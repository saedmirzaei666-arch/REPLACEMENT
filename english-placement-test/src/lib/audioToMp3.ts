export async function convertAudioToMp3(blob: Blob): Promise<Blob> {
  const { Mp3Encoder } = await import("lamejs");
  const AudioContextClass = window.AudioContext;
  const audioContext = new AudioContextClass();

  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const channel = decoded.getChannelData(0);
    const samples = new Int16Array(channel.length);

    for (let i = 0; i < channel.length; i += 1) {
      const value = Math.max(-1, Math.min(1, channel[i]));
      samples[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
    }

    const encoder = new Mp3Encoder(1, decoded.sampleRate, 128);
    const mp3Chunks: BlobPart[] = [];
    const frameSize = 1152;

    for (let offset = 0; offset < samples.length; offset += frameSize) {
      const encoded = encoder.encodeBuffer(samples.subarray(offset, offset + frameSize));
      if (encoded.length > 0) mp3Chunks.push(new Uint8Array(encoded));
    }

    const finalChunk = encoder.flush();
    if (finalChunk.length > 0) mp3Chunks.push(new Uint8Array(finalChunk));

    return new Blob(mp3Chunks, { type: "audio/mpeg" });
  } finally {
    await audioContext.close();
  }
}
