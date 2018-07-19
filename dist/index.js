(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StreamVisulizer = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _concat = require('./concat');

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var wavHead = function wavHead(data, sampleRate, numberOfChannels) {
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

    return (0, _concat2.default)(header, data);
};

exports.default = wavHead;

},{"./concat":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Concat two Stream ArrayBuffers
var concatBuffer = function concatBuffer(prev, next) {

    var mid = new Uint8Array(prev.byteLength + next.byteLength);

    mid.set(new Uint8Array(prev), 0);
    mid.set(new Uint8Array(next), prev.byteLength);

    return mid.buffer;
};

exports.default = concatBuffer;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _wavStreamVisulizer = require('./wav-stream-visulizer');

var _wavStreamVisulizer2 = _interopRequireDefault(_wavStreamVisulizer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _wavStreamVisulizer2.default;

module.exports = _wavStreamVisulizer2.default;

},{"./wav-stream-visulizer":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _addHeader = require('./add-header');

var _addHeader2 = _interopRequireDefault(_addHeader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StreamVisulizer = function () {
    function StreamVisulizer() {
        _classCallCheck(this, StreamVisulizer);

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

    _createClass(StreamVisulizer, [{
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
            //source.connect(this.context.destination);

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
            this.context.decodeAudioData((0, _addHeader2.default)(buf, this.sampleRate, this.numberOfChannels)).then(function (audioBuf) {

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

    return StreamVisulizer;
}();

exports.default = StreamVisulizer;

},{"./add-header":1}]},{},[3])(3)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYWRkLWhlYWRlci5qcyIsInNyYy9jb25jYXQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvd2F2LXN0cmVhbS12aXN1bGl6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQTs7Ozs7O0FBRUEsSUFBTSxVQUFVLFNBQVYsT0FBVSxDQUFDLElBQUQsRUFBTyxVQUFQLEVBQW1CLGdCQUFuQixFQUF3QztBQUNwRDtBQUNBLFFBQU0sU0FBUyxJQUFJLFdBQUosQ0FBZ0IsRUFBaEIsQ0FBZjs7QUFFQSxRQUFJLElBQUksSUFBSSxRQUFKLENBQWEsTUFBYixDQUFSOztBQUVBLE1BQUUsUUFBRixDQUFXLENBQVgsRUFBYyxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWQ7QUFDQSxNQUFFLFFBQUYsQ0FBVyxDQUFYLEVBQWMsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFkO0FBQ0EsTUFBRSxRQUFGLENBQVcsQ0FBWCxFQUFjLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZDtBQUNBLE1BQUUsUUFBRixDQUFXLENBQVgsRUFBYyxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWQ7O0FBRUE7QUFDQSxNQUFFLFNBQUYsQ0FBWSxDQUFaLEVBQWUsS0FBSyxVQUFMLEdBQWtCLENBQWxCLEdBQXNCLEVBQXJDLEVBQXlDLElBQXpDOztBQUVBLE1BQUUsUUFBRixDQUFXLENBQVgsRUFBYyxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWQ7QUFDQSxNQUFFLFFBQUYsQ0FBVyxDQUFYLEVBQWMsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFkO0FBQ0EsTUFBRSxRQUFGLENBQVcsRUFBWCxFQUFlLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZjtBQUNBLE1BQUUsUUFBRixDQUFXLEVBQVgsRUFBZSxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWY7QUFDQSxNQUFFLFFBQUYsQ0FBVyxFQUFYLEVBQWUsSUFB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SyxJQUZMLENBRVUsb0JBQVk7O0FBRWQsNkJBQWEsR0FBYixHQUFtQixRQUFuQjtBQUNBLDZCQUFhLFFBQWIsR0FBd0IsU0FBUyxRQUFqQzs7QUFFQSx1QkFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLFlBQXJCOztBQUVBLG9CQUFJLE9BQUssVUFBTCxLQUFvQixJQUF4QixFQUE4QjtBQUMxQiw0QkFBUSxHQUFSO0FBQ0EsMkJBQUssV0FBTDtBQUNIO0FBQ0osYUFiTDtBQWNIOzs7K0JBRU87QUFDSixpQkFBSyxZQUFMLEdBQW9CLElBQXBCO0FBQ0EseUJBQWEsS0FBSyxVQUFsQjs7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixJQUFsQjs7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMLENBQWEsS0FBYjtBQUVIO0FBQ0o7Ozt1Q0FFZTtBQUNaLG1CQUFPO0FBQ0gsMEJBQVUsS0FBSyxnQkFEWjtBQUVILDRCQUFhLEtBQUs7QUFGZixhQUFQO0FBSUg7Ozt1Q0FFZTtBQUNaLG1CQUFPLEtBQUssUUFBWjtBQUNIOzs7Ozs7a0JBR1UsZSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBjb25jYXRCdWZmZXIgZnJvbSAnLi9jb25jYXQnO1xyXG5cclxuY29uc3Qgd2F2SGVhZCA9IChkYXRhLCBzYW1wbGVSYXRlLCBudW1iZXJPZkNoYW5uZWxzKSA9PiB7XHJcbiAgICAvLyB3YXYgaGVhZCBsZW4gaXMgNDQuXHJcbiAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xyXG5cclxuICAgIGxldCBoID0gbmV3IERhdGFWaWV3KGhlYWRlcik7XHJcblxyXG4gICAgaC5zZXRVaW50OCgwLCAnUicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEsICdJJy5jaGFyQ29kZUF0KDApKTtcclxuICAgIGguc2V0VWludDgoMiwgJ0YnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzLCAnRicuY2hhckNvZGVBdCgwKSk7XHJcblxyXG4gICAgLy8gcGNtIGRhdGEgbGVuXHJcbiAgICBoLnNldFVpbnQzMig0LCBkYXRhLmJ5dGVMZW5ndGggLyAyICsgNDQsIHRydWUpO1xyXG5cclxuICAgIGguc2V0VWludDgoOCwgJ1cnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCg5LCAnQScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEwLCAnVicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDExLCAnRScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEyLCAnZicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEzLCAnbScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDE0LCAndCcuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDE1LCAnICcuY2hhckNvZGVBdCgwKSk7XHJcblxyXG4gICAgaC5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDIwLCAxLCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDIyLCBudW1iZXJPZkNoYW5uZWxzLCB0cnVlKTsgXHJcbiAgICBoLnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7IFxyXG4gICAgaC5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiAxICogMiwgdHJ1ZSk7IFxyXG4gICAgaC5zZXRVaW50MTYoMzIsIG51bWJlck9mQ2hhbm5lbHMgKiAyLCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XHJcblxyXG4gICAgaC5zZXRVaW50OCgzNiwgJ2QnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzNywgJ2EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzOCwgJ3QnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzOSwgJ2EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50MzIoNDAsIGRhdGEuYnl0ZUxlbmd0aCwgdHJ1ZSk7XHJcblxyXG4gICAgcmV0dXJuIGNvbmNhdEJ1ZmZlcihoZWFkZXIsIGRhdGEpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgd2F2SGVhZDsiLCIvLyBDb25jYXQgdHdvIFN0cmVhbSBBcnJheUJ1ZmZlcnNcclxuY29uc3QgY29uY2F0QnVmZmVyID0gKHByZXYsIG5leHQpID0+IHtcclxuXHJcbiAgICBjb25zdCBtaWQgPSBuZXcgVWludDhBcnJheShwcmV2LmJ5dGVMZW5ndGggKyBuZXh0LmJ5dGVMZW5ndGgpO1xyXG5cclxuICAgIG1pZC5zZXQobmV3IFVpbnQ4QXJyYXkocHJldiksIDApO1xyXG4gICAgbWlkLnNldChuZXcgVWludDhBcnJheShuZXh0KSwgcHJldi5ieXRlTGVuZ3RoKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIG1pZC5idWZmZXI7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25jYXRCdWZmZXI7IiwiaW1wb3J0IFN0cmVhbVZpc3VsaXplciBmcm9tICcuL3dhdi1zdHJlYW0tdmlzdWxpemVyJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0cmVhbVZpc3VsaXplcjtcclxubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW1WaXN1bGl6ZXI7IiwiaW1wb3J0IHdhdkhlYWQgZnJvbSAnLi9hZGQtaGVhZGVyJztcclxuXHJcbmNsYXNzIFN0cmVhbVZpc3VsaXplciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYC0tLS0tLS0tLS1jb25zdHJ1Y3QtLS0tLS0tLS0tLS0tYCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQW5hbHlzZXIoKTtcclxuICAgICAgICB0aGlzLmF1ZGlvU3RhY2sgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gcHJpdmF0ZSBwcm9wc1xyXG4gICAgICAgIHRoaXMuX2hhc0NhbmNlbGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fdGltZW91dElkID0gbnVsbDtcclxuICAgICAgICB0aGlzLl8xc3QgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubnVtYmVyT2ZDaGFubmVscyA9IDA7XHJcbiAgICAgICAgdGhpcy5zYW1wbGVSYXRlID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBfc2NodWxlZEJ1ZigpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGBbJHtuZXcgRGF0ZSgpfV0gX3NjaHVsZWRCdWYgTGVuOiAke3RoaXMuYXVkaW9TdGFjay5sZW5ndGh9YCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmF1ZGlvU3RhY2subGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZW91dElkKTtcclxuICAgICAgICAgICAgdGhpcy5fdGltZW91dElkID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH07ICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IHRoaXMuYXVkaW9TdGFjay5zaGlmdCgpOyAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHNvdXJjZS5idWZmZXIgPSBzZWdtZW50LmJ1ZjtcclxuICAgICAgICBsZXQgZHVyYXRpb24gPSBzb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xyXG4gICAgICAgIC8vY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBhbmFseXNlclxyXG4gICAgICAgIHNvdXJjZS5jb25uZWN0KHRoaXMuYW5hbHlzZXIpO1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pO1xyXG4gICAgICAgIC8vc291cmNlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYFRoaXMgc2VnbWVudCBkdXJhdGlvbjogJHtkdXJhdGlvbn1gKTtcclxuICAgICAgICBzb3VyY2Uuc3RhcnQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zY2h1bGVkQnVmKCksIDEwMDAgKiBkdXJhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHVibGljIGZ1bmNcclxuICAgIGZlZWQgKHJhdykge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYFske25ldyBEYXRlKCl9XSBmZWVkIGRhdGEgbGVuZ3RoOiAke3Jhdy5ieXRlTGVuZ3RofWApO1xyXG4gICAgICAgIGlmIChyYXcuYnl0ZUxlbmd0aCA9PT0gMCB8fCB0aGlzLl9oYXNDYW5jZWxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSAgICAgICAgXHJcblxyXG4gICAgICAgIC8vIFRvZG9cclxuICAgICAgICAvLyDmo4Dmn6XkuIDkuIvmmK/lkKblm6DkuLrmlbDmja7mmK/lpYfmlbDvvIzlr7zoh7TmnIkx5Liq5a2X6IqC55qE5q6L55WZ5pWw5o2uXHJcbiAgICAgICAgLy8g5pyJ55qE6K+d5bCx77yM5bCx5YWI5Yqg6L+b5Y6777yM5YaNY29uY2F0XHJcblxyXG4gICAgICAgIC8vIHByb2Nlc3MgbmV3IGJ1ZmZlclxyXG4gICAgICAgIGxldCBidWYsIGF1ZGlvU2VnbWVudCA9IHt9O1xyXG4gICAgICAgIGlmICh0aGlzLl8xc3QpIHtcclxuICAgICAgICAgICAgYnVmID0gcmF3LmJ1ZmZlcjtcclxuICAgICAgICAgICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubnVtYmVyT2ZDaGFubmVscyA9IGRhdGFWaWV3LmdldFVpbnQxNigyMiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2FtcGxlUmF0ZSA9IGRhdGFWaWV3LmdldFVpbnQzMigyNCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBidWYgPSBidWYuc2xpY2UoNDQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgbnVtYmVyT2ZDaGFubmVsczogJHt0aGlzLm51bWJlck9mQ2hhbm5lbHN9LCBzYW1wbGVSYXRlOiAke3RoaXMuc2FtcGxlUmF0ZX1gKTtcclxuICAgICAgICAgICAgdGhpcy5fMXN0ID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnVmID0gcmF3LmJ1ZmZlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGRlY29kZSByYXcgZGF0YSwgc2VuZCB0byBzY2hlZHVsZUJ1ZmZlclxyXG4gICAgICAgIHRoaXMuY29udGV4dFxyXG4gICAgICAgICAgICAuZGVjb2RlQXVkaW9EYXRhKHdhdkhlYWQoYnVmLCB0aGlzLnNhbXBsZVJhdGUsIHRoaXMubnVtYmVyT2ZDaGFubmVscykpXHJcbiAgICAgICAgICAgIC50aGVuKGF1ZGlvQnVmID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBhdWRpb1NlZ21lbnQuYnVmID0gYXVkaW9CdWY7XHJcbiAgICAgICAgICAgICAgICBhdWRpb1NlZ21lbnQuZHVyYXRpb24gPSBhdWRpb0J1Zi5kdXJhdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1ZGlvU3RhY2sucHVzaChhdWRpb1NlZ21lbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl90aW1lb3V0SWQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgc3RhcnQgX3NjaHVsZWRCdWZgKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY2h1bGVkQnVmKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCAoKSB7XHJcbiAgICAgICAgdGhpcy5faGFzQ2FuY2VsZWQgPSB0cnVlO1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lb3V0SWQpO1xyXG5cclxuICAgICAgICB0aGlzLmF1ZGlvU3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLl90aW1lb3V0SWQgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jbG9zZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QXVkaW9JbmZvICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjaGFubmVsczogdGhpcy5udW1iZXJPZkNoYW5uZWxzLFxyXG4gICAgICAgICAgICBzYW1wbGVSYXRlIDogdGhpcy5zYW1wbGVSYXRlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEFuYWx5enNlciAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5hbHlzZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0cmVhbVZpc3VsaXplcjtcclxuXHJcbiJdfQ==
