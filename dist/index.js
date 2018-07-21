(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StreamVisulizer = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _wavStreamAnalyser = require('./src/wav-stream-analyser');

var _wavStreamAnalyser2 = _interopRequireDefault(_wavStreamAnalyser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _wavStreamAnalyser2.default;

module.exports = _wavStreamAnalyser2.default;

},{"./src/wav-stream-analyser":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//import wavHead from './add-header';

var StreamAnalyser = function () {
    function StreamAnalyser() {
        _classCallCheck(this, StreamAnalyser);

        console.log('----------construct-------------');

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


    _createClass(StreamAnalyser, [{
        key: 'concatBuffer',
        value: function concatBuffer(prev, next) {

            var mid = new Uint8Array(prev.byteLength + next.byteLength);

            mid.set(new Uint8Array(prev), 0);
            mid.set(new Uint8Array(next), prev.byteLength);

            return mid.buffer;
        }
    }, {
        key: 'wavHead',
        value: function wavHead(data, sampleRate, numberOfChannels) {
            // wav head len is 44.
            var header = new ArrayBuffer(44);

            var h = new DataView(header);

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
    }, {
        key: '_schuledBuf',
        value: function _schuledBuf() {
            var _this = this;

            //console.log(`[${new Date()}] _schuledBuf Len: ${this.audioStack.length}`);

            if (this.audioStack.length === 0) {
                clearTimeout(this._timeoutId);
                this._timeoutId = null;
                return;
            };

            var source = this.context.createBufferSource();
            var segment = this.audioStack.shift();

            source.buffer = segment.buf;
            var duration = source.buffer.duration;
            //connect the source to the analyser
            source.connect(this.analyser);
            this.analyser.connect(this.context.destination);

            console.log('This segment duration: ' + duration);
            source.start();

            this._timeoutId = setTimeout(function () {
                return _this._schuledBuf();
            }, 1000 * duration);
        }

        // public func

    }, {
        key: 'feed',
        value: function feed(raw) {
            var _this2 = this;

            //console.log(`[${new Date()}] feed data length: ${raw.byteLength}`);
            if (raw.byteLength === 0 || this._hasCanceled) {
                return;
            }

            // Todo
            // 检查一下是否因为数据是奇数，导致有1个字节的残留数据
            // 有的话就，就先加进去，再concat

            // process new buffer
            var buf = void 0,
                audioSegment = {};
            if (this._1st) {
                buf = raw.buffer;
                var dataView = new DataView(buf);

                this.numberOfChannels = dataView.getUint16(22, true);
                this.sampleRate = dataView.getUint32(24, true);

                buf = buf.slice(44);
                console.log('numberOfChannels: ' + this.numberOfChannels + ', sampleRate: ' + this.sampleRate);
                this._1st = false;
            } else {
                buf = raw.buffer;
            }

            // decode raw data, send to scheduleBuffer
            this.context.decodeAudioData(this.wavHead(buf, this.sampleRate, this.numberOfChannels)).then(function (audioBuf) {

                audioSegment.buf = audioBuf;
                audioSegment.duration = audioBuf.duration;

                _this2.audioStack.push(audioSegment);

                if (_this2._timeoutId === null) {
                    console.log('start _schuledBuf');
                    _this2._schuledBuf();
                }
            });
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._hasCanceled = true;
            clearTimeout(this._timeoutId);

            this.audioStack = [];
            this._timeoutId = null;

            if (this.context) {
                this.context.close();
            }
        }
    }, {
        key: 'getAudioInfo',
        value: function getAudioInfo() {
            return {
                channels: this.numberOfChannels,
                sampleRate: this.sampleRate
            };
        }
    }, {
        key: 'getAnalyzser',
        value: function getAnalyzser() {
            return this.analyser;
        }
    }]);

    return StreamAnalyser;
}();

exports.default = StreamAnalyser;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy93YXYtc3RyZWFtLWFuYWx5c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUE7Ozs7OztrQkFFZSwyQjs7QUFDZixPQUFPLE9BQVAsR0FBaUIsMkJBQWpCOzs7Ozs7Ozs7Ozs7O0FDSEE7O0lBRU0sYztBQUVGLDhCQUFjO0FBQUE7O0FBQ1YsZ0JBQVEsR0FBUjs7QUFFQSxhQUFLLE9BQUwsR0FBZSxJQUFJLFlBQUosRUFBZjtBQUNBLGFBQUssUUFBTCxHQUFnQixLQUFLLE9BQUwsQ0FBYSxjQUFiLEVBQWhCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLEVBQWxCOztBQUVBO0FBQ0EsYUFBSyxZQUFMLEdBQW9CLEtBQXBCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsYUFBSyxJQUFMLEdBQVksSUFBWjs7QUFFQSxhQUFLLGdCQUFMLEdBQXdCLENBQXhCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLENBQWxCO0FBQ0g7O0FBRUQ7Ozs7O3FDQUNjLEksRUFBTSxJLEVBQU07O0FBRXRCLGdCQUFNLE1BQU0sSUFBSSxVQUFKLENBQWUsS0FBSyxVQUFMLEdBQWtCLEtBQUssVUFBdEMsQ0FBWjs7QUFFQSxnQkFBSSxHQUFKLENBQVEsSUFBSSxVQUFKLENBQWUsSUFBZixDQUFSLEVBQThCLENBQTlCO0FBQ0EsZ0JBQUksR0FBSixDQUFRLElBQUksVUFBSixDQUFlLElBQWYsQ0FBUixFQUE4QixLQUFLLFVBQW5DOztBQUVBLG1CQUFPLElBQUksTUFBWDtBQUNIOzs7Z0NBRVEsSSxFQUFNLFUsRUFBWSxnQixFQUFrQjtBQUN6QztBQUNBLGdCQUFNLFNBQVMsSUFBSSxXQUFKLENBQWdCLEVBQWhCLENBQWY7O0FBRUEsZ0JBQUksSUFBSSxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQVI7O0FBRUEsY0FBRSxRQUFGLENBQVcsQ0FBWCxFQUFjLElB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VUFBTCxLQUFvQixJQUF4QixFQUE4QjtBQUMxQiw0QkFBUSxHQUFSO0FBQ0EsMkJBQUssV0FBTDtBQUNIO0FBQ0osYUFiTDtBQWNIOzs7K0JBRU87QUFDSixpQkFBSyxZQUFMLEdBQW9CLElBQXBCO0FBQ0EseUJBQWEsS0FBSyxVQUFsQjs7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixJQUFsQjs7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMLENBQWEsS0FBYjtBQUVIO0FBQ0o7Ozt1Q0FFZTtBQUNaLG1CQUFPO0FBQ0gsMEJBQVUsS0FBSyxnQkFEWjtBQUVILDRCQUFhLEtBQUs7QUFGZixhQUFQO0FBSUg7Ozt1Q0FFZTtBQUNaLG1CQUFPLEtBQUssUUFBWjtBQUNIOzs7Ozs7a0JBR1UsYyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBTdHJlYW1BbmFseXNlciBmcm9tICcuL3NyYy93YXYtc3RyZWFtLWFuYWx5c2VyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0cmVhbUFuYWx5c2VyO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmVhbUFuYWx5c2VyOyIsIi8vaW1wb3J0IHdhdkhlYWQgZnJvbSAnLi9hZGQtaGVhZGVyJztcclxuXHJcbmNsYXNzIFN0cmVhbUFuYWx5c2VyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgLS0tLS0tLS0tLWNvbnN0cnVjdC0tLS0tLS0tLS0tLS1gKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5hbmFseXNlciA9IHRoaXMuY29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xyXG4gICAgICAgIHRoaXMuYXVkaW9TdGFjayA9IFtdO1xyXG5cclxuICAgICAgICAvLyBwcml2YXRlIHByb3BzXHJcbiAgICAgICAgdGhpcy5faGFzQ2FuY2VsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl90aW1lb3V0SWQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuXzFzdCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5udW1iZXJPZkNoYW5uZWxzID0gMDtcclxuICAgICAgICB0aGlzLnNhbXBsZVJhdGUgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbmNhdCB0d28gU3RyZWFtIEFycmF5QnVmZmVyc1xyXG4gICAgY29uY2F0QnVmZmVyIChwcmV2LCBuZXh0KSB7XHJcblxyXG4gICAgICAgIGNvbnN0IG1pZCA9IG5ldyBVaW50OEFycmF5KHByZXYuYnl0ZUxlbmd0aCArIG5leHQuYnl0ZUxlbmd0aCk7XHJcblxyXG4gICAgICAgIG1pZC5zZXQobmV3IFVpbnQ4QXJyYXkocHJldiksIDApO1xyXG4gICAgICAgIG1pZC5zZXQobmV3IFVpbnQ4QXJyYXkobmV4dCksIHByZXYuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1pZC5idWZmZXI7XHJcbiAgICB9XHJcblxyXG4gICAgd2F2SGVhZCAoZGF0YSwgc2FtcGxlUmF0ZSwgbnVtYmVyT2ZDaGFubmVscykge1xyXG4gICAgICAgIC8vIHdhdiBoZWFkIGxlbiBpcyA0NC5cclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xyXG4gICAgXHJcbiAgICAgICAgbGV0IGggPSBuZXcgRGF0YVZpZXcoaGVhZGVyKTtcclxuICAgIFxyXG4gICAgICAgIGguc2V0VWludDgoMCwgJ1InLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMSwgJ0knLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMiwgJ0YnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMywgJ0YnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gcGNtIGRhdGEgbGVuXHJcbiAgICAgICAgaC5zZXRVaW50MzIoNCwgZGF0YS5ieXRlTGVuZ3RoIC8gMiArIDQ0LCB0cnVlKTtcclxuICAgIFxyXG4gICAgICAgIGguc2V0VWludDgoOCwgJ1cnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoOSwgJ0EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMTAsICdWJy5jaGFyQ29kZUF0KDApKTtcclxuICAgICAgICBoLnNldFVpbnQ4KDExLCAnRScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgICAgaC5zZXRVaW50OCgxMiwgJ2YnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMTMsICdtJy5jaGFyQ29kZUF0KDApKTtcclxuICAgICAgICBoLnNldFVpbnQ4KDE0LCAndCcuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgICAgaC5zZXRVaW50OCgxNSwgJyAnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgXHJcbiAgICAgICAgaC5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcclxuICAgICAgICBoLnNldFVpbnQxNigyMCwgMSwgdHJ1ZSk7XHJcbiAgICAgICAgaC5zZXRVaW50MTYoMjIsIG51bWJlck9mQ2hhbm5lbHMsIHRydWUpOyBcclxuICAgICAgICBoLnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7IFxyXG4gICAgICAgIGguc2V0VWludDMyKDI4LCBzYW1wbGVSYXRlICogMSAqIDIsIHRydWUpOyBcclxuICAgICAgICBoLnNldFVpbnQxNigzMiwgbnVtYmVyT2ZDaGFubmVscyAqIDIsIHRydWUpO1xyXG4gICAgICAgIGguc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XHJcbiAgICBcclxuICAgICAgICBoLnNldFVpbnQ4KDM2LCAnZCcuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgICAgaC5zZXRVaW50OCgzNywgJ2EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgICAgIGguc2V0VWludDgoMzgsICd0Jy5jaGFyQ29kZUF0KDApKTtcclxuICAgICAgICBoLnNldFVpbnQ4KDM5LCAnYScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICAgICAgaC5zZXRVaW50MzIoNDAsIGRhdGEuYnl0ZUxlbmd0aCwgdHJ1ZSk7XHJcbiAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jYXRCdWZmZXIoaGVhZGVyLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBfc2NodWxlZEJ1ZigpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGBbJHtuZXcgRGF0ZSgpfV0gX3NjaHVsZWRCdWYgTGVuOiAke3RoaXMuYXVkaW9TdGFjay5sZW5ndGh9YCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmF1ZGlvU3RhY2subGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZW91dElkKTtcclxuICAgICAgICAgICAgdGhpcy5fdGltZW91dElkID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH07ICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IHRoaXMuYXVkaW9TdGFjay5zaGlmdCgpOyAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHNvdXJjZS5idWZmZXIgPSBzZWdtZW50LmJ1ZjtcclxuICAgICAgICBsZXQgZHVyYXRpb24gPSBzb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgICAgIC8vY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBhbmFseXNlclxyXG4gICAgICAgIHNvdXJjZS5jb25uZWN0KHRoaXMuYW5hbHlzZXIpO1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgVGhpcyBzZWdtZW50IGR1cmF0aW9uOiAke2R1cmF0aW9ufWApO1xyXG4gICAgICAgIHNvdXJjZS5zdGFydCgpO1xyXG5cclxuICAgICAgICB0aGlzLl90aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3NjaHVsZWRCdWYoKSwgMTAwMCAqIGR1cmF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBwdWJsaWMgZnVuY1xyXG4gICAgZmVlZCAocmF3KSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgWyR7bmV3IERhdGUoKX1dIGZlZWQgZGF0YSBsZW5ndGg6ICR7cmF3LmJ5dGVMZW5ndGh9YCk7XHJcbiAgICAgICAgaWYgKHJhdy5ieXRlTGVuZ3RoID09PSAwIHx8IHRoaXMuX2hhc0NhbmNlbGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9ICAgICAgICBcclxuXHJcbiAgICAgICAgLy8gVG9kb1xyXG4gICAgICAgIC8vIOajgOafpeS4gOS4i+aYr+WQpuWboOS4uuaVsOaNruaYr+Wlh+aVsO+8jOWvvOiHtOaciTHkuKrlrZfoioLnmoTmrovnlZnmlbDmja5cclxuICAgICAgICAvLyDmnInnmoTor53lsLHvvIzlsLHlhYjliqDov5vljrvvvIzlho1jb25jYXRcclxuXHJcbiAgICAgICAgLy8gcHJvY2VzcyBuZXcgYnVmZmVyXHJcbiAgICAgICAgbGV0IGJ1ZiwgYXVkaW9TZWdtZW50ID0ge307XHJcbiAgICAgICAgaWYgKHRoaXMuXzFzdCkge1xyXG4gICAgICAgICAgICBidWYgPSByYXcuYnVmZmVyO1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhVmlldyA9IG5ldyBEYXRhVmlldyhidWYpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5udW1iZXJPZkNoYW5uZWxzID0gZGF0YVZpZXcuZ2V0VWludDE2KDIyLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5zYW1wbGVSYXRlID0gZGF0YVZpZXcuZ2V0VWludDMyKDI0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGJ1ZiA9IGJ1Zi5zbGljZSg0NCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBudW1iZXJPZkNoYW5uZWxzOiAke3RoaXMubnVtYmVyT2ZDaGFubmVsc30sIHNhbXBsZVJhdGU6ICR7dGhpcy5zYW1wbGVSYXRlfWApO1xyXG4gICAgICAgICAgICB0aGlzLl8xc3QgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBidWYgPSByYXcuYnVmZmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZGVjb2RlIHJhdyBkYXRhLCBzZW5kIHRvIHNjaGVkdWxlQnVmZmVyXHJcbiAgICAgICAgdGhpcy5jb250ZXh0XHJcbiAgICAgICAgICAgIC5kZWNvZGVBdWRpb0RhdGEodGhpcy53YXZIZWFkKGJ1ZiwgdGhpcy5zYW1wbGVSYXRlLCB0aGlzLm51bWJlck9mQ2hhbm5lbHMpKVxyXG4gICAgICAgICAgICAudGhlbihhdWRpb0J1ZiA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgYXVkaW9TZWdtZW50LmJ1ZiA9IGF1ZGlvQnVmO1xyXG4gICAgICAgICAgICAgICAgYXVkaW9TZWdtZW50LmR1cmF0aW9uID0gYXVkaW9CdWYuZHVyYXRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5hdWRpb1N0YWNrLnB1c2goYXVkaW9TZWdtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGltZW91dElkID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHN0YXJ0IF9zY2h1bGVkQnVmYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2NodWxlZEJ1ZigpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AgKCkge1xyXG4gICAgICAgIHRoaXMuX2hhc0NhbmNlbGVkID0gdHJ1ZTtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZW91dElkKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdWRpb1N0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5fdGltZW91dElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuY2xvc2UoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEF1ZGlvSW5mbyAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY2hhbm5lbHM6IHRoaXMubnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgICAgICAgc2FtcGxlUmF0ZSA6IHRoaXMuc2FtcGxlUmF0ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRBbmFseXpzZXIgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFuYWx5c2VyO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdHJlYW1BbmFseXNlcjtcclxuXHJcbiJdfQ==
