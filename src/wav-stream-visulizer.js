import concatBuffer from './concat';
import wavHead from './add-header';

class StreamVisulizer {

    constructor() {
        console.log(`----------construct-------------`);
        
        this.context = new AudioContext();
        this.audioStack = [];

        // private props
        this._hasCanceled = false;
        this._restRawData = null;
        this.startTime = 0;
        this._1st = true;
        
        // start timeout interval
    }

    // public func
    feed (raw) {
        //console.log(`[${new Date()}] feed data length: ${raw.byteLength}`);
        if (raw.byteLength === 0 || this._hasCanceled) {
            return;
        }        

        // 检查一下是否因为数据是奇数，导致有1个字节的残留数据
        // 有的话就，就先加进去，再concat

        // concat new buffer
        let buf, audioSegment = {};
        if (this._1st) {
            buf = raw.buffer;//concatBuffer(new Uint8Array(0), raw);
            this._1st = false;
        } else {
            buf = wavHead(raw, 48000, 2);
            
        }
        console.log(buf)
        // decode raw data, send to scheduleBuffer
        this.context
            .decodeAudioData(buf)
            .then(audioBuf => {
                console.log(`duration: ${audioBuf.duration}`);

                audioSegment.buf = audioBuf;
                audioSegment.duration = audioBuf.duration;

                this.audioStack.push(audioSegment);
                const source = this.context.createBufferSource();
                source.buffer = audioBuf;
                source.connect(this.context.destination);
                source.start(this.startTime);
                this.startTime += audioBuf.duration;
            });
    }

    stop () {
        this._hasCanceled = true;
        if (this.context) {
            this.context.close();
        }
    }

    recorder () {

    }

    saveWav () {

    }
}

export default StreamVisulizer;

