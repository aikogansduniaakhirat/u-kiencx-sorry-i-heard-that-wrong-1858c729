import { mkdirSync, writeFileSync } from "node:fs";

// The apology a smart speaker gives its owner after mishearing (cap 140).
// Engine: it did not mishear a word, it heard the sigh instead of the sentence
// and acted on the emotional reading - lights low, music sad. The apology is
// for getting the mood right, which is the one thing it was not asked to do.

const LINE =
  "Sorry - I heard the sigh, not the sentence, so the lights are low and the music is sad. Say the words and I'll undo the mood.";

const MAX_CHARS = 140;

// Criterion 3: the obvious misheard song title or misheard name is the loss.
const SATURATED =
  /\b(play some jazz|dim the lights|turn (it |the heating )?up|mother-in-law|pizza|jet ski|playlist|delete the photos)\b/i;

function compose(): string {
  const text = LINE.trim();

  if (!text) throw new Error("empty line");
  if (/[\r\n]/.test(text)) throw new Error("must be a single line");
  if ([...text].length > MAX_CHARS) {
    throw new Error(`over the cap: ${[...text].length} > ${MAX_CHARS}`);
  }
  // criterion 1: it must open as the device's own apology.
  if (!/^Sorry\b/.test(text)) {
    throw new Error("criterion 1: it must open as the apology");
  }
  // criterion 4: the device's voice - what it actually did to the room.
  for (const token of ["lights", "music"]) {
    if (!text.includes(token)) throw new Error(`criterion 4: lost "${token}"`);
  }
  // criterion 2: the undercut is the offer to undo a feeling.
  if (!text.endsWith("I'll undo the mood.")) {
    throw new Error("the undercut must be the last thing on the line");
  }
  // criterion 5: tight - well inside the cap.
  if ([...text].length > MAX_CHARS - 10) {
    throw new Error("criterion 5: too close to the cap, trim a clause");
  }
  const drift = text.match(SATURATED);
  if (drift) {
    throw new Error(`mishearing the field already used: ${JSON.stringify(drift[0])}`);
  }
  return text;
}

const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const out = compose();

// Two grader runs, byte-identical artifacts: compose() is a pure constant.
if (compose() !== out) throw new Error("non-deterministic: two composes differ");
if (out !== out.normalize("NFC")) throw new Error("not NFC-normalised");

mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/entry.txt`, out);
console.log(`chars=${[...out].length} bytes=${Buffer.byteLength(out, "utf8")}`);
