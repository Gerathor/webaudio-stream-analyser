//import wavHead from './add-header';

class StreamAnalyser {

    constructor() {
        console.log(`----------construct-------------`);
        
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.audioStack = [];

        // private props
        this._hasCanceled = false;
        this._timeoutId = null;
        this._1st = true;
        
        this.numberOfChannels = 0;
        this.sampleRate = 0;
    }

    // Concat two Stream ArrayBuffers
    concatBuffer (prev, next) {

        const mid = new Uint8Array(prev.byteLength + next.byteLength);

        mid.set(new Uint8Array(prev), 0);
        mid.set(new Uint8Array(next), prev.byteLength);
        
        return mid.buffer;
    }

    wavHead (data, sampleRate, numberOfChannels) {
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
        h.setUint16(22, numberOfChannels, true); 
        h.setUint32(24, sampleRate, true); 
        h.setUint32(28, sampleRate * 1 * 2, true); 
        h.setUint16(32, numberOfChannels * 2, true);
        h.setUint16(34, 16, true);
    
        h.setUint8(36, 'd'.charCodeAt(0));
        h.setUint8(37, 'a'.charCodeAt(0));
        h.setUint8(38, 't'.charCodeAt(0));
        h.setUint8(39, 'a'.charCodeAt(0));
        h.setUint32(40, data.byteLength, true);
    
        return this.concatBuffer(header, data);
    }

    _schuledBuf() {
        //console.log(`[${new Date()}] _schuledBuf Len: ${this.audioStack.length}`);

        if (this.audioStack.length === 0 ) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
            return;
        };        
        
        const source = this.context.createBufferSource();
        const segment = this.audioStack.shift();        
            
        source.buffer = segment.buf;
        let duration = source.buffer.duration;
        //connect the source to the analyser
        source.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        console.log(`This segment duration: ${duration}`);
        source.start();

        this._timeoutId = setTimeout(() => this._schuledBuf(), 1000 * duration);
    }

    // public func
    feed (raw) {
        //console.log(`[${new Date()}] feed data length: ${raw.byteLength}`);
        if (raw.byteLength === 0 || this._hasCanceled) {
            return;
        }        

        // Todo
        // 检查一下是否因为数据是奇数，导致有1个字节的残留数据
        // 有的话就，就先加进去，再concat

        // process new buffer
        let buf, audioSegment = {};
        if (this._1st) {
            buf = raw.buffer;
            const dataView = new DataView(buf);

            this.numberOfChannels = dataView.getUint16(22, true);
            this.sampleRate = dataView.getUint32(24, true);

            buf = buf.slice(44);
            console.log(`numberOfChannels: ${this.numberOfChannels}, sampleRate: ${this.sampleRate}`);
            this._1st = false;
        } else {
            buf = raw.buffer;
        }

        // decode raw data, send to scheduleBuffer
        this.context
            .decodeAudioData(this.wavHead(buf, this.sampleRate, this.numberOfChannels))
            .then(audioBuf => {

                audioSegment.buf = audioBuf;
                audioSegment.duration = audioBuf.duration;

                this.audioStack.push(audioSegment);

                if (this._timeoutId === null) {
                    console.log(`start _schuledBuf`);
                    this._schuledBuf()
                }
            });
    }

    stop () {
        this._hasCanceled = true;
        clearTimeout(this._timeoutId);

        this.audioStack = [];
        this._timeoutId = null;

        if (this.context) {
            this.context.close();
            
        }
    }

    getAudioInfo () {
        return {
            channels: this.numberOfChannels,
            sampleRate : this.sampleRate
        }
    }

    getAnalyzser () {
        return this.analyser;
    }
}

export default StreamAnalyser;

