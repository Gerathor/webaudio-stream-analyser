import concatBuffer from './concat';

const wavHead = (data, sampleRate, numberOfChannels) => {
    // wav head len is 44.
    const header = new ArrayBuffer(44);

    let h = new DataView(header);

    h.setUint8(0, 'R'.charCodeAt(0));
    h.setUint8(1, 'I'.charCodeAt(0));
    h.setUint8(2, 'F'.charCodeAt(0));
    h.setUint8(3, 'F'.charCodeAt(0));

    // pcm data len
    h.setUint32(4, data.byteLength / 2 + 44, true);

    h.setUint8(8, 'W'.charCodeAt(0));
    h.setUint8(9, 'A'.charCodeAt(0));
    h.setUint8(10, 'V'.charCodeAt(0));
    h.setUint8(11, 'E'.charCodeAt(0));
    h.setUint8(12, 'f'.charCodeAt(0));
    h.setUint8(13, 'm'.charCodeAt(0));
    h.setUint8(14, 't'.charCodeAt(0));
    h.setUint8(15, ' '.charCodeAt(0));

    h.setUint32(16, 16, true);
    h.setUint16(20, 1, true);
    h.setUint16(22, numberOfChannels, true); //numberOfChannels
    h.setUint32(24, sampleRate, true); // sampleRate
    h.setUint32(28, sampleRate * 1 * 2, true); // sampleRate chunk size
    h.setUint16(32, numberOfChannels * 2, true); // numberOfChannels chunk size
    h.setUint16(34, 16, true);

    h.setUint8(36, 'd'.charCodeAt(0));
    h.setUint8(37, 'a'.charCodeAt(0));
    h.setUint8(38, 't'.charCodeAt(0));
    h.setUint8(39, 'a'.charCodeAt(0));
    h.setUint32(40, data.byteLength, true);

    return concatBuffer(header, data);
};

export default wavHead;