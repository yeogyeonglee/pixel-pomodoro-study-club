/** Tiny 8-bit chime with WebAudio. Call only from the browser. */
export function playChime(kind: "focus" | "break") {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = kind === "break" ? [784, 988, 1175, 1568] : [1568, 1175, 988, 784];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio blocked */
  }
}
