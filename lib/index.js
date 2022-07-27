import { BufferReader } from "./BufferReader.js";
export function parseMidiFile(buffer) {
  const reader = new BufferReader(buffer);
  const header = parseHeader(reader);
  const tracks = parseTracks(reader);
  return { header, tracks };
}
function parseHeader(reader) {
  const headerChunk = reader.midiChunk();
  if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
    throw "Bad .mid file, header not found";
  }
  const headerReader = new BufferReader(headerChunk.data);
  const formatType = headerReader.uint16();
  const trackCount = headerReader.uint16();
  const timeDivision = headerReader.uint16();
  if (timeDivision & 32768) {
    throw "Expressing time division in SMTPE frames is not supported yet";
  }
  const ticksPerBeat = timeDivision;
  return { formatType, trackCount, ticksPerBeat };
}
function parseTracks(reader) {
  let tracks = [];
  while (!reader.eof()) {
    const trackChunk = reader.midiChunk();
    if (trackChunk.id !== "MTrk") {
      throw "Unexpected chunk, expected MTrk, got " + trackChunk.id;
    }
    const trackTrack = new BufferReader(trackChunk.data);
    let track = [];
    while (!trackTrack.eof()) {
      const lastEvent = track[track.length - 1];
      const event = parseEvent(trackTrack, lastEvent ? lastEvent.typeByte : void 0);
      track = [...track, event];
    }
    tracks = [...tracks, track];
  }
  return tracks;
}
function parseEvent(reader, lastTypeByte) {
  const deltaTime = reader.midiInt();
  let typeByte = reader.uint8();
  if (typeByte === 255) {
    const type = "meta";
    const subTypeByte = reader.uint8();
    const length = reader.midiInt();
    switch (subTypeByte) {
      case 0:
        if (length !== 2) {
          throw "Expected length for sequenceNumber event is 2, got " + length;
        }
        return {
          type,
          subType: "sequenceNumber",
          typeByte,
          subTypeByte,
          deltaTime,
          number: reader.uint16()
        };
      case 1:
        return {
          type,
          subType: "text",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 2:
        return {
          type,
          subType: "copyrightNotice",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 3:
        return {
          type,
          subType: "trackName",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 4:
        return {
          type,
          subType: "instrumentName",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 5:
        return {
          type,
          subType: "lyrics",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 6:
        return {
          type,
          subType: "marker",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 7:
        return {
          type,
          subType: "cuePoint",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length)
        };
      case 32:
        if (length !== 1) {
          throw "Expected length for midiChannelPrefix event is 1, got " + length;
        }
        return {
          type,
          subType: "midiChannelPrefix",
          typeByte,
          subTypeByte,
          deltaTime,
          channel: reader.uint8()
        };
      case 47:
        if (length !== 0) {
          throw "Expected length for endOfTrack event is 0, got " + length;
        }
        return {
          type,
          subType: "endOfTrack",
          typeByte,
          subTypeByte,
          deltaTime
        };
      case 81:
        if (length !== 3) {
          throw "Expected length for setTempo event is 3, got " + length;
        }
        return {
          type,
          subType: "setTempo",
          typeByte,
          subTypeByte,
          deltaTime,
          microsecondsPerBeat: (reader.uint8() << 16) + (reader.uint8() << 8) + reader.uint8()
        };
      case 84:
        if (length != 5) {
          throw "Expected length for smpteOffset event is 5, got " + length;
        }
        const hourByte = reader.uint8();
        return {
          type,
          subType: "smpteOffset",
          typeByte,
          subTypeByte,
          deltaTime,
          frameRate: getFrameRate(hourByte),
          hour: hourByte & 31,
          min: reader.uint8(),
          sec: reader.uint8(),
          frame: reader.uint8(),
          subFrame: reader.uint8()
        };
      case 88:
        if (length != 4) {
          throw "Expected length for timeSignature event is 4, got " + length;
        }
        return {
          type,
          subType: "timeSignature",
          typeByte,
          subTypeByte,
          deltaTime,
          numerator: reader.uint8(),
          denominator: Math.pow(2, reader.uint8()),
          metronome: reader.uint8(),
          thirtySeconds: reader.uint8()
        };
      case 89:
        if (length != 2) {
          throw "Expected length for keySignature event is 2, got " + length;
        }
        return {
          type,
          subType: "keySignature",
          typeByte,
          subTypeByte,
          deltaTime,
          key: reader.int8(),
          scale: reader.uint8()
        };
      case 127:
        return {
          type,
          subType: "sequencerSpecific",
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length)
        };
      default:
        return {
          type,
          subType: void 0,
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length)
        };
    }
  } else if (typeByte === 240) {
    const length = reader.midiInt();
    return {
      type: "sysEx",
      subType: void 0,
      typeByte,
      deltaTime,
      data: reader.read(length)
    };
  } else if (typeByte === 247) {
    const length = reader.midiInt();
    return {
      type: "dividedSysEx",
      subType: void 0,
      typeByte,
      deltaTime,
      data: reader.read(length)
    };
  } else {
    const type = "midi";
    const isRunningStatus = (typeByte & 128) === 0;
    const value = isRunningStatus ? typeByte : reader.uint8();
    typeByte = isRunningStatus ? lastTypeByte === void 0 ? 0 : lastTypeByte : typeByte;
    const channel = typeByte & 15;
    switch (typeByte >> 4) {
      case 8:
        return {
          type,
          subType: "noteOff",
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity: reader.uint8()
        };
      case 9:
        const velocity = reader.uint8();
        return {
          type,
          subType: velocity === 0 ? "noteOff" : "noteOn",
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity
        };
      case 10:
        return {
          type,
          subType: "noteAftertouch",
          typeByte,
          deltaTime,
          channel,
          note: value,
          amount: reader.uint8()
        };
      case 11:
        return {
          type,
          subType: "controller",
          typeByte,
          deltaTime,
          channel,
          controllerType: value,
          value: reader.uint8()
        };
      case 12:
        return {
          type,
          subType: "programChange",
          typeByte,
          deltaTime,
          channel,
          program: value
        };
      case 13:
        return {
          type,
          subType: "channelAftertouch",
          typeByte,
          deltaTime,
          channel,
          amount: value
        };
      case 14:
        return {
          type,
          subType: "pitchBend",
          typeByte,
          deltaTime,
          channel,
          value: value + (reader.uint8() << 7)
        };
    }
  }
  throw "Unrecognised MIDI event type byte: " + typeByte;
}
function getFrameRate(hourByte) {
  switch (hourByte & 96) {
    case 0:
      return 24;
    case 32:
      return 25;
    case 64:
      return 29;
    case 96:
      return 30;
    default:
      return 0;
  }
}
