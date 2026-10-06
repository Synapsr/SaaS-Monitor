/**
 * The shared audio graph: every sound connects to `input` (dry) and `reverb` (a send to a small
 * synthetic room), then goes through one compressor so that chords and quick sequences stay
 * clean on TV speakers at high volume.
 */
export interface AudioGraph {
  context: AudioContext;
  input: AudioNode;
  reverb: AudioNode;
}

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

// `undefined` until first needed: creating a context has a cost, and browsers complain when it
// happens before a user gesture on pages that never play anything.
let graph: AudioGraph | null | undefined;

/** The shared graph, created on first use. `null` on the server or without Web Audio. */
export function getAudioGraph(): AudioGraph | null {
  if (graph !== undefined) return graph;
  if (typeof window === "undefined") return null;

  const Context: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  try {
    graph = Context ? createAudioGraph(new Context({ latencyHint: "interactive" })) : null;
  } catch {
    graph = null;
  }
  return graph;
}

function createAudioGraph(context: AudioContext): AudioGraph {
  return { context, ...createMasterChain(context) };
}

/**
 * The master chain: the dry input and the reverb send, into one compressor, then the context's
 * destination. Offline contexts render through it too (`scripts/generate-sounds.ts`).
 */
export function createMasterChain(context: BaseAudioContext): Omit<AudioGraph, "context"> {
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 10;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.25;

  const master = context.createGain();
  master.gain.value = 0.9;
  compressor.connect(master).connect(context.destination);

  const input = context.createGain();
  input.connect(compressor);

  const reverb = context.createConvolver();
  reverb.buffer = roomImpulse(context);
  const wet = context.createGain();
  wet.gain.value = 0.5;
  reverb.connect(wet).connect(compressor);

  return { input, reverb };
}

/** A soft, short room (decaying stereo noise): enough air for bells, no audio file needed. */
function roomImpulse(context: BaseAudioContext, seconds = 1.8, decay = 3.2): AudioBuffer {
  const length = Math.round(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const samples = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length) ** decay;
    }
  }
  return impulse;
}
