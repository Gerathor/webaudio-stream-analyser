// Concat two Stream ArrayBuffers
const concatBuffer = (prev, next) => {
    
    //console.log(`${next.byteLength}`);
    //console.log(`${prev.byteLength}`);

    const mid = new Uint8Array(prev.byteLength + next.byteLength);

    mid.set(new Uint8Array(prev), 0);
    mid.set(new Uint8Array(next), prev.byteLength);
    
    return mid.buffer;
};

export default concatBuffer;