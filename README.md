<div align="center">

# jasmid.ts

Fork of a fork of [jasmid](https://github.com/gasman/jasmid) MIDI file reader in TypeScript.

Jasmid.ts was originally created by [pravdomil](https://github.com/pravdomil), but they have since removed it from GitHub.

</div>

## Install

```sh
npm i jasmid.ts
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

## Donate

[By buying a beer](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=BCL2X3AFQBAP2&item_name=jasmid.ts%20Beer).
