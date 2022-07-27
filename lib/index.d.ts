export declare type MidiEvent = {
    type: "meta";
    subType: "sequenceNumber";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    number: number;
} | {
    type: "meta";
    subType: "text";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "copyrightNotice";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "trackName";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "instrumentName";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "lyrics";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "marker";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "cuePoint";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    text: string;
} | {
    type: "meta";
    subType: "midiChannelPrefix";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    channel: number;
} | {
    type: "meta";
    subType: "endOfTrack";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
} | {
    type: "meta";
    subType: "setTempo";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    microsecondsPerBeat: number;
} | {
    type: "meta";
    subType: "smpteOffset";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    frameRate: number;
    hour: number;
    min: number;
    sec: number;
    frame: number;
    subFrame: number;
} | {
    type: "meta";
    subType: "timeSignature";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    numerator: number;
    denominator: number;
    metronome: number;
    thirtySeconds: number;
} | {
    type: "meta";
    subType: "keySignature";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    key: number;
    scale: number;
} | {
    type: "meta";
    subType: "sequencerSpecific";
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    data: ArrayBuffer;
} | {
    type: "meta";
    subType: undefined;
    typeByte: number;
    subTypeByte: number;
    deltaTime: number;
    data: ArrayBuffer;
} | {
    type: "sysEx";
    subType: undefined;
    typeByte: number;
    deltaTime: number;
    data: ArrayBuffer;
} | {
    type: "dividedSysEx";
    subType: undefined;
    typeByte: number;
    deltaTime: number;
    data: ArrayBuffer;
} | {
    type: "midi";
    subType: "noteOff";
    typeByte: number;
    deltaTime: number;
    channel: number;
    note: number;
    velocity: number;
} | {
    type: "midi";
    subType: "noteOff" | "noteOn";
    typeByte: number;
    deltaTime: number;
    channel: number;
    note: number;
    velocity: number;
} | {
    type: "midi";
    subType: "noteAftertouch";
    typeByte: number;
    deltaTime: number;
    channel: number;
    note: number;
    amount: number;
} | {
    type: "midi";
    subType: "controller";
    typeByte: number;
    deltaTime: number;
    channel: number;
    controllerType: number;
    value: number;
} | {
    type: "midi";
    subType: "programChange";
    typeByte: number;
    deltaTime: number;
    channel: number;
    program: number;
} | {
    type: "midi";
    subType: "channelAftertouch";
    typeByte: number;
    deltaTime: number;
    channel: number;
    amount: number;
} | {
    type: "midi";
    subType: "pitchBend";
    typeByte: number;
    deltaTime: number;
    channel: number;
    value: number;
};
export declare function parseMidiFile(buffer: ArrayBufferLike): {
    header: {
        formatType: number;
        trackCount: number;
        ticksPerBeat: number;
    };
    tracks: MidiEvent[][];
};
