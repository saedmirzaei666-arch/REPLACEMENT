type EncoderLibrary = typeof import("lamejs");
let encoderLoading: Promise<EncoderLibrary> | undefined;

function loadEncoder(): Promise<EncoderLibrary> {
  const browser = window as Window & { lamejs?: EncoderLibrary };
  if (browser.lamejs) return Promise.resolve(browser.lamejs);
  if (!encoderLoading) {
    encoderLoading = new Promise<EncoderLibrary>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/lame.min.js";
      script.async = true;
      const fail = () => {
        script.remove();
        reject(new Error("Audio conversion could not load. Please try again."));
      };
      script.onload = () => browser.lamejs ? resolve(browser.lamejs) : fail();
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch((error) => {
      encoderLoading = undefined;
      throw error;
    });
  }
  return encoderLoading;
}

export async function convertAudioToMp3(blob: Blob): Promise<Blob> {
  // Use the complete browser bundle: the npm source entry has unresolved globals.
  const { Mp3Encoder } = await loadEncoder();
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
