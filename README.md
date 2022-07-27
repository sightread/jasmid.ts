<div align="center">

# jasmid.ts

Fork of a fork of [jasmid](https://github.com/gasman/jasmid) MIDI file reader in TypeScript.

Jasmid.ts was originally created by [pravdomil](https://github.com/pravdomil), but they have since removed it from their GitHub.

</div>

## Install

```sh
npm i @sightread/jasmid.ts
```

## Example
```js
import { parseMidiFile } from "jasmid.ts"

const midi = parseMidiFile(arrayBuffer)

// midi has type:
// {
//   header: { formatType: number; trackCount: number; ticksPerBeat: number };
//   tracks: MidiEvent[][];
// }

```

## API

See [src/index.ts](src/index.ts#L1).
