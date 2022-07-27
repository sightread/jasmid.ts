"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BufferReader = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var BufferReader =
/*#__PURE__*/
function () {
  function BufferReader(buffer) {
    _classCallCheck(this, BufferReader);

    this.position = 0;
    this.data = new DataView(buffer);
  }

  _createClass(BufferReader, [{
    key: "read",
    value: function read(length) {
      var value = this.data.buffer.slice(this.position, this.position + length);
      this.position += length;
      return value;
    }
  }, {
    key: "int8",
    value: function int8() {
      var value = this.data.getInt8(this.position);
      this.position += 1;
      return value;
    }
  }, {
    key: "uint8",
    value: function uint8() {
      var value = this.data.getUint8(this.position);
      this.position += 1;
      return value;
    }
  }, {
    key: "uint16",
    value: function uint16() {
      var value = this.data.getUint16(this.position);
      this.position += 2;
      return value;
    }
  }, {
    key: "uint32",
    value: function uint32() {
      var value = this.data.getUint32(this.position);
      this.position += 4;
      return value;
    }
  }, {
    key: "string",
    value: function string(length) {
      return new TextDecoder("ascii").decode(this.read(length));
    }
  }, {
    key: "eof",
    value: function eof() {
      return this.position >= this.data.byteLength;
    }
    /**
     * Read a MIDI-style variable-length integer.
     * (big-endian value in groups of 7 bits, with top bit set to signify that another byte follows)
     */

  }, {
    key: "midiInt",
    value: function midiInt() {
      var result = 0;

      while (true) {
        var value = this.uint8();

        if (value & 128) {
          result += value & 127;
          result <<= 7;
        } else {
          return result + value;
        }
      }
    }
  }, {
    key: "midiChunk",
    value: function midiChunk() {
      var id = this.string(4);
      var length = this.uint32();
      var data = this.read(length);
      return {
        id: id,
        length: length,
        data: data
      };
    }
  }]);

  return BufferReader;
}();

exports.BufferReader = BufferReader;