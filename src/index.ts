import { BufferReader } from "./BufferReader"

export type MidiEvent =
  | { type: "meta"; subType: "sequenceNumber"; typeByte: number; subTypeByte: number; deltaTime: number; number: number }
  | { type: "meta"; subType: "text"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "copyrightNotice"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "trackName"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "instrumentName"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "lyrics"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "marker"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "cuePoint"; typeByte: number; subTypeByte: number; deltaTime: number; text: string }
  | { type: "meta"; subType: "midiChannelPrefix"; typeByte: number; subTypeByte: number; deltaTime: number; channel: number }
  | { type: "meta"; subType: "endOfTrack"; typeByte: number; subTypeByte: number; deltaTime: number }
  | { type: "meta"; subType: "setTempo"; typeByte: number; subTypeByte: number; deltaTime: number; microsecondsPerBeat: number }
  | { type: "meta"; subType: "smpteOffset"; typeByte: number; subTypeByte: number; deltaTime: number; frameRate: number; hour: number; min: number; sec: number; frame: number; subFrame: number }
  | { type: "meta"; subType: "timeSignature"; typeByte: number; subTypeByte: number; deltaTime: number; numerator: number; denominator: number; metronome: number; thirtySeconds: number }
  | { type: "meta"; subType: "keySignature"; typeByte: number; subTypeByte: number; deltaTime: number; key: number; scale: number }
  | { type: "meta"; subType: "sequencerSpecific"; typeByte: number; subTypeByte: number; deltaTime: number; data: ArrayBuffer }
  | { type: "meta"; subType: undefined; typeByte: number; subTypeByte: number; deltaTime: number; data: ArrayBuffer }
  | { type: "sysEx"; subType: undefined; typeByte: number; deltaTime: number; data: ArrayBuffer }
  | { type: "dividedSysEx"; subType: undefined; typeByte: number; deltaTime: number; data: ArrayBuffer }
  | { type: "midi"; subType: "noteOff"; typeByte: number; deltaTime: number; channel: number; note: number; velocity: number }
  | { type: "midi"; subType: "noteOff" | "noteOn"; typeByte: number; deltaTime: number; channel: number; note: number; velocity: number }
  | { type: "midi"; subType: "noteAftertouch"; typeByte: number; deltaTime: number; channel: number; note: number; amount: number }
  | { type: "midi"; subType: "controller"; typeByte: number; deltaTime: number; channel: number; controllerType: number; value: number }
  | { type: "midi"; subType: "programChange"; typeByte: number; deltaTime: number; channel: number; program: number }
  | { type: "midi"; subType: "channelAftertouch"; typeByte: number; deltaTime: number; channel: number; amount: number }
  | { type: "midi"; subType: "pitchBend"; typeByte: number; deltaTime: number; channel: number; value: number }

export function parseMidiFile(buffer: ArrayBufferLike) {
  const reader = new BufferReader(buffer)

  const header = parseHeader(reader)
  const tracks = parseTracks(reader)

  return { header, tracks }
}

function parseHeader(reader: BufferReader) {
  const headerChunk = reader.midiChunk()
  if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
    throw "Bad .mid file, header not found"
  }

  const headerReader = new BufferReader(headerChunk.data)
  const formatType = headerReader.uint16()
  const trackCount = headerReader.uint16()
  const timeDivision = headerReader.uint16()
  if (timeDivision & 0x8000) {
    throw "Expressing time division in SMTPE frames is not supported yet"
  }
  const ticksPerBeat = timeDivision

  return { formatType, trackCount, ticksPerBeat }
}

function parseTracks(reader: BufferReader) {
  let tracks: MidiEvent[][] = []
  while (!reader.eof()) {
    const trackChunk = reader.midiChunk()

    if (trackChunk.id !== "MTrk") {
      throw "Unexpected chunk, expected MTrk, got " + trackChunk.id
    }

    const trackTrack = new BufferReader(trackChunk.data)
    let track: MidiEvent[] = []
    while (!trackTrack.eof()) {
      const lastEvent = track[track.length - 1]
      const event = parseEvent(trackTrack, lastEvent ? lastEvent.typeByte : undefined)
      track = [...track, event]
    }

    tracks = [...tracks, track]
  }
  return tracks
}

function parseEvent(reader: BufferReader, lastTypeByte: number | undefined): MidiEvent {
  const deltaTime = reader.midiInt()
  let typeByte = reader.uint8()

  if (typeByte === 0xff) {
    /** meta event */

    const type = "meta" as "meta"
    const subTypeByte = reader.uint8()
    const length = reader.midiInt()

    switch (subTypeByte) {
      case 0x00:
        if (length !== 2) {
          throw "Expected length for sequenceNumber event is 2, got " + length
        }
        return {
          type,
          subType: "sequenceNumber" as "sequenceNumber",
          typeByte,
          subTypeByte,
          deltaTime,
          number: reader.uint16(),
        }
      case 0x01:
        return {
          type,
          subType: "text" as "text",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x02:
        return {
          type,
          subType: "copyrightNotice" as "copyrightNotice",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x03:
        return {
          type,
          subType: "trackName" as "trackName",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x04:
        return {
          type,
          subType: "instrumentName" as "instrumentName",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x05:
        return {
          type,
          subType: "lyrics" as "lyrics",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x06:
        return {
          type,
          subType: "marker" as "marker",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x07:
        return {
          type,
          subType: "cuePoint" as "cuePoint",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x20:
        if (length !== 1) {
          throw "Expected length for midiChannelPrefix event is 1, got " + length
        }
        return {
          type,
          subType: "midiChannelPrefix" as "midiChannelPrefix",
          typeByte,
          subTypeByte,
          deltaTime,
          channel: reader.uint8(),
        }
      case 0x2f:
        if (length !== 0) {
          throw "Expected length for endOfTrack event is 0, got " + length
        }
        return {
          type,
          subType: "endOfTrack" as "endOfTrack",
          typeByte,
          subTypeByte,
          deltaTime,
        }
      case 0x51:
        if (length !== 3) {
          throw "Expected length for setTempo event is 3, got " + length
        }
        return {
          type,
          subType: "setTempo" as "setTempo",
          typeByte,
          subTypeByte,
          deltaTime,
          microsecondsPerBeat: (reader.uint8() << 16) + (reader.uint8() << 8) + reader.uint8(),
        }
      case 0x54:
        if (length != 5) {
          throw "Expected length for smpteOffset event is 5, got " + length
        }
        const hourByte = reader.uint8()
        return {
          type,
          subType: "smpteOffset" as "smpteOffset",
          typeByte,
          subTypeByte,
          deltaTime,
          frameRate: getFrameRate(hourByte),
          hour: hourByte & 0x1f,
          min: reader.uint8(),
          sec: reader.uint8(),
          frame: reader.uint8(),
          subFrame: reader.uint8(),
        }
      case 0x58:
        if (length != 4) {
          throw "Expected length for timeSignature event is 4, got " + length
        }
        return {
          type,
          subType: "timeSignature" as "timeSignature",
          typeByte,
          subTypeByte,
          deltaTime,
          numerator: reader.uint8(),
          denominator: Math.pow(2, reader.uint8()),
          metronome: reader.uint8(),
          thirtySeconds: reader.uint8(),
        }
      case 0x59:
        if (length != 2) {
          throw "Expected length for keySignature event is 2, got " + length
        }
        return {
          type,
          subType: "keySignature" as "keySignature",
          typeByte,
          subTypeByte,
          deltaTime,
          key: reader.int8(),
          scale: reader.uint8(),
        }
      case 0x7f:
        return {
          type,
          subType: "sequencerSpecific" as "sequencerSpecific",
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length),
        }
      default:
        return {
          type,
          subType: undefined,
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length),
        }
    }
  } else if (typeByte === 0xf0) {
    /** system event */

    const length = reader.midiInt()
    return {
      type: "sysEx" as "sysEx",
      subType: undefined,
      typeByte,
      deltaTime,
      data: reader.read(length),
    }
  } else if (typeByte === 0xf7) {
    /** divided system event */

    const length = reader.midiInt()
    return {
      type: "dividedSysEx" as "dividedSysEx",
      subType: undefined,
      typeByte,
      deltaTime,
      data: reader.read(length),
    }
  } else {
    /** midi event */

    const type = "midi" as "midi"

    /**
     * running status - reuse lastEventTypeByte as the event type
     * typeByte is actually the first parameter
     */
    const isRunningStatus = (typeByte & 0b10000000) === 0
    const value = isRunningStatus ? typeByte : reader.uint8()
    typeByte = isRunningStatus ? (lastTypeByte === undefined ? 0 : lastTypeByte) : typeByte

    const channel = typeByte & 0x0f

    switch (typeByte >> 4) {
      case 0x08:
        return {
          type,
          subType: "noteOff" as "noteOff",
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity: reader.uint8(),
        }
      case 0x09:
        const velocity = reader.uint8()
        return {
          type,
          subType: velocity === 0 ? ("noteOff" as "noteOff") : ("noteOn" as "noteOn"),
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity,
        }
      case 0x0a:
        return {
          type,
          subType: "noteAftertouch" as "noteAftertouch",
          typeByte,
          deltaTime,
          channel,
          note: value,
          amount: reader.uint8(),
        }
      case 0x0b:
        return {
          type,
          subType: "controller" as "controller",
          typeByte,
          deltaTime,
          channel,
          controllerType: value,
          value: reader.uint8(),
        }
      case 0x0c:
        return {
          type,
          subType: "programChange" as "programChange",
          typeByte,
          deltaTime,
          channel,
          program: value,
        }
      case 0x0d:
        return {
          type,
          subType: "channelAftertouch" as "channelAftertouch",
          typeByte,
          deltaTime,
          channel,
          amount: value,
        }
      case 0x0e:
        return {
          type,
          subType: "pitchBend" as "pitchBend",
          typeByte,
          deltaTime,
          channel,
          value: value + (reader.uint8() << 7),
        }
    }
  }
  throw "Unrecognised MIDI event type byte: " + typeByte
}

function getFrameRate(hourByte: number) {
  switch (hourByte & 0b1100000) {
    case 0x00:
      return 24
    case 0x20:
      return 25
    case 0x40:
      return 29
    case 0x60:
      return 30
    default:
      return 0
  }
}
