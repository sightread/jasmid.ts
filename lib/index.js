"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseMidiFile = parseMidiFile;

var _BufferReader = require("./BufferReader");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function parseMidiFile(buffer) {
  var reader = new _BufferReader.BufferReader(buffer);
  var header = parseHeader(reader);
  var tracks = parseTracks(reader);
  return {
    header: header,
    tracks: tracks
  };
}

function parseHeader(reader) {
  var headerChunk = reader.midiChunk();

  if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
    throw "Bad .mid file, header not found";
  }

  var headerReader = new _BufferReader.BufferReader(headerChunk.data);
  var formatType = headerReader.uint16();
  var trackCount = headerReader.uint16();
  var timeDivision = headerReader.uint16();

  if (timeDivision & 0x8000) {
    throw "Expressing time division in SMTPE frames is not supported yet";
  }

  var ticksPerBeat = timeDivision;
  return {
    formatType: formatType,
    trackCount: trackCount,
    ticksPerBeat: ticksPerBeat
  };
}

function parseTracks(reader) {
  var tracks = [];

  while (!reader.eof()) {
    var trackChunk = reader.midiChunk();

    if (trackChunk.id !== "MTrk") {
      throw "Unexpected chunk, expected MTrk, got " + trackChunk.id;
    }

    var trackTrack = new _BufferReader.BufferReader(trackChunk.data);
    var track = [];

    while (!trackTrack.eof()) {
      var lastEvent = track[track.length - 1];
      var event = parseEvent(trackTrack, lastEvent ? lastEvent.typeByte : undefined);
      track = _toConsumableArray(track).concat([event]);
    }

    tracks = _toConsumableArray(tracks).concat([track]);
  }

  return tracks;
}

function parseEvent(reader, lastTypeByte) {
  var deltaTime = reader.midiInt();
  var typeByte = reader.uint8();

  if (typeByte === 0xff) {
    /** meta event */
    var _type = "meta";

    var _subTypeByte = reader.uint8();

    var length = reader.midiInt();

    switch (_subTypeByte) {
      case 0x00:
        if (length !== 2) {
          throw "Expected length for sequenceNumber event is 2, got " + length;
        }

        return {
          type: _type,
          subType: "sequenceNumber",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          number: reader.uint16()
        };

      case 0x01:
        return {
          type: _type,
          subType: "text",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x02:
        return {
          type: _type,
          subType: "copyrightNotice",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x03:
        return {
          type: _type,
          subType: "trackName",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x04:
        return {
          type: _type,
          subType: "instrumentName",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x05:
        return {
          type: _type,
          subType: "lyrics",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x06:
        return {
          type: _type,
          subType: "marker",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x07:
        return {
          type: _type,
          subType: "cuePoint",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          text: reader.string(length)
        };

      case 0x20:
        if (length !== 1) {
          throw "Expected length for midiChannelPrefix event is 1, got " + length;
        }

        return {
          type: _type,
          subType: "midiChannelPrefix",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          channel: reader.uint8()
        };

      case 0x2f:
        if (length !== 0) {
          throw "Expected length for endOfTrack event is 0, got " + length;
        }

        return {
          type: _type,
          subType: "endOfTrack",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime
        };

      case 0x51:
        if (length !== 3) {
          throw "Expected length for setTempo event is 3, got " + length;
        }

        return {
          type: _type,
          subType: "setTempo",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          microsecondsPerBeat: (reader.uint8() << 16) + (reader.uint8() << 8) + reader.uint8()
        };

      case 0x54:
        if (length != 5) {
          throw "Expected length for smpteOffset event is 5, got " + length;
        }

        var hourByte = reader.uint8();
        return {
          type: _type,
          subType: "smpteOffset",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          frameRate: getFrameRate(hourByte),
          hour: hourByte & 0x1f,
          min: reader.uint8(),
          sec: reader.uint8(),
          frame: reader.uint8(),
          subFrame: reader.uint8()
        };

      case 0x58:
        if (length != 4) {
          throw "Expected length for timeSignature event is 4, got " + length;
        }

        return {
          type: _type,
          subType: "timeSignature",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          numerator: reader.uint8(),
          denominator: Math.pow(2, reader.uint8()),
          metronome: reader.uint8(),
          thirtySeconds: reader.uint8()
        };

      case 0x59:
        if (length != 2) {
          throw "Expected length for keySignature event is 2, got " + length;
        }

        return {
          type: _type,
          subType: "keySignature",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          key: reader.int8(),
          scale: reader.uint8()
        };

      case 0x7f:
        return {
          type: _type,
          subType: "sequencerSpecific",
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          data: reader.read(length)
        };

      default:
        return {
          type: _type,
          subType: undefined,
          typeByte: typeByte,
          subTypeByte: _subTypeByte,
          deltaTime: deltaTime,
          data: reader.read(length)
        };
    }
  } else if (typeByte === 0xf0) {
    /** system event */
    var _length = reader.midiInt();

    return {
      type: "sysEx",
      subType: undefined,
      typeByte: typeByte,
      deltaTime: deltaTime,
      data: reader.read(_length)
    };
  } else if (typeByte === 0xf7) {
    /** divided system event */
    var _length2 = reader.midiInt();

    return {
      type: "dividedSysEx",
      subType: undefined,
      typeByte: typeByte,
      deltaTime: deltaTime,
      data: reader.read(_length2)
    };
  } else {
    /** midi event */
    var _type2 = "midi";
    /**
     * running status - reuse lastEventTypeByte as the event type
     * typeByte is actually the first parameter
     */

    var isRunningStatus = (typeByte & 128) === 0;

    var _value = isRunningStatus ? typeByte : reader.uint8();

    typeByte = isRunningStatus ? lastTypeByte === undefined ? 0 : lastTypeByte : typeByte;

    var _channel = typeByte & 0x0f;

    switch (typeByte >> 4) {
      case 0x08:
        return {
          type: _type2,
          subType: "noteOff",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          note: _value,
          velocity: reader.uint8()
        };

      case 0x09:
        var _velocity = reader.uint8();

        return {
          type: _type2,
          subType: _velocity === 0 ? "noteOff" : "noteOn",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          note: _value,
          velocity: _velocity
        };

      case 0x0a:
        return {
          type: _type2,
          subType: "noteAftertouch",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          note: _value,
          amount: reader.uint8()
        };

      case 0x0b:
        return {
          type: _type2,
          subType: "controller",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          controllerType: _value,
          value: reader.uint8()
        };

      case 0x0c:
        return {
          type: _type2,
          subType: "programChange",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          program: _value
        };

      case 0x0d:
        return {
          type: _type2,
          subType: "channelAftertouch",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          amount: _value
        };

      case 0x0e:
        return {
          type: _type2,
          subType: "pitchBend",
          typeByte: typeByte,
          deltaTime: deltaTime,
          channel: _channel,
          value: _value + (reader.uint8() << 7)
        };
    }
  }

  throw "Unrecognised MIDI event type byte: " + typeByte;
}

function getFrameRate(hourByte) {
  switch (hourByte & 96) {
    case 0x00:
      return 24;

    case 0x20:
      return 25;

    case 0x40:
      return 29;

    case 0x60:
      return 30;

    default:
      return 0;
  }
}