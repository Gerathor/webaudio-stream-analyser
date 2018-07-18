import wavHead from './add-header';

class StreamVisulizer {

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
        //source.connect(this.context.destination);

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
            .decodeAudioData(wavHead(buf, this.sampleRate, this.numberOfChannels))
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

    getAnalyzser () {
        return this.analyser;
    }
}

export default StreamVisulizer;

