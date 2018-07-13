// Concat two Stream ArrayBuffers
const concatBuffer = (prev, next) {
    const mid = new Uint8Array(prev.byteLength + next.byteLength);

    mid.set(new Uint8Array(prev), 0);
    mid.set(new Uint8Array(next), prev.byteLength);
};

export default concatBuffer;