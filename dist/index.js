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

var _wavStreamAnalyser = require('./wav-stream-analyser');

var _wavStreamAnalyser2 = _interopRequireDefault(_wavStreamAnalyser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _wavStreamAnalyser2.default;

module.exports = _wavStreamAnalyser2.default;

},{"./wav-stream-analyser":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _addHeader = require('./add-header');

var _addHeader2 = _interopRequireDefault(_addHeader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

    _createClass(StreamAnalyser, [{
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

    return StreamAnalyser;
}();

exports.default = StreamAnalyser;

},{"./add-header":1}]},{},[3])(3)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYWRkLWhlYWRlci5qcyIsInNyYy9jb25jYXQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvd2F2LXN0cmVhbS1hbmFseXNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQ0FBOzs7Ozs7QUFFQSxJQUFNLFVBQVUsU0FBVixPQUFVLENBQUMsSUFBRCxFQUFPLFVBQVAsRUFBbUIsZ0JBQW5CLEVBQXdDO0FBQ3BEO0FBQ0EsUUFBTSxTQUFTLElBQUksV0FBSixDQUFnQixFQUFoQixDQUFmOztBQUVBLFFBQUksSUFBSSxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQVI7O0FBRUEsTUFBRSxRQUFGLENBQVcsQ0FBWCxFQUFjLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZDtBQUNBLE1BQUUsUUFBRixDQUFXLENBQVgsRUFBYyxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWQ7QUFDQSxNQUFFLFFBQUYsQ0FBVyxDQUFYLEVBQWMsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFkO0FBQ0EsTUFBRSxRQUFGLENBQVcsQ0FBWCxFQUFjLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZDs7QUFFQTtBQUNBLE1BQUUsU0FBRixDQUFZLENBQVosRUFBZSxLQUFLLFVBQUwsR0FBa0IsQ0FBbEIsR0FBc0IsRUFBckMsRUFBeUMsSUFBekM7O0FBRUEsTUFBRSxRQUFGLENBQVcsQ0FBWCxFQUFjLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZDtBQUNBLE1BQUUsUUFBRixDQUFXLENBQVgsRUFBYyxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWQ7QUFDQSxNQUFFLFFBQUYsQ0FBVyxFQUFYLEVBQWUsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFmO0FBQ0EsTUFBRSxRQUFGLENBQVcsRUFBWCxFQUFlLElBQUksVUFBSixDQUFlLENBQWYsQ0FBZjtBQUNBLE1BQUUsUUFBRixDQUFXLEVBQVgsRUFBZSxJQUFJ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LENBRVUsb0JBQVk7O0FBRWQsNkJBQWEsR0FBYixHQUFtQixRQUFuQjtBQUNBLDZCQUFhLFFBQWIsR0FBd0IsU0FBUyxRQUFqQzs7QUFFQSx1QkFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLFlBQXJCOztBQUVBLG9CQUFJLE9BQUssVUFBTCxLQUFvQixJQUF4QixFQUE4QjtBQUMxQiw0QkFBUSxHQUFSO0FBQ0EsMkJBQUssV0FBTDtBQUNIO0FBQ0osYUFiTDtBQWNIOzs7K0JBRU87QUFDSixpQkFBSyxZQUFMLEdBQW9CLElBQXBCO0FBQ0EseUJBQWEsS0FBSyxVQUFsQjs7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixJQUFsQjs7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMLENBQWEsS0FBYjtBQUVIO0FBQ0o7Ozt1Q0FFZTtBQUNaLG1CQUFPO0FBQ0gsMEJBQVUsS0FBSyxnQkFEWjtBQUVILDRCQUFhLEtBQUs7QUFGZixhQUFQO0FBSUg7Ozt1Q0FFZTtBQUNaLG1CQUFPLEtBQUssUUFBWjtBQUNIOzs7Ozs7a0JBR1UsYyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCBjb25jYXRCdWZmZXIgZnJvbSAnLi9jb25jYXQnO1xyXG5cclxuY29uc3Qgd2F2SGVhZCA9IChkYXRhLCBzYW1wbGVSYXRlLCBudW1iZXJPZkNoYW5uZWxzKSA9PiB7XHJcbiAgICAvLyB3YXYgaGVhZCBsZW4gaXMgNDQuXHJcbiAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xyXG5cclxuICAgIGxldCBoID0gbmV3IERhdGFWaWV3KGhlYWRlcik7XHJcblxyXG4gICAgaC5zZXRVaW50OCgwLCAnUicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEsICdJJy5jaGFyQ29kZUF0KDApKTtcclxuICAgIGguc2V0VWludDgoMiwgJ0YnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzLCAnRicuY2hhckNvZGVBdCgwKSk7XHJcblxyXG4gICAgLy8gcGNtIGRhdGEgbGVuXHJcbiAgICBoLnNldFVpbnQzMig0LCBkYXRhLmJ5dGVMZW5ndGggLyAyICsgNDQsIHRydWUpO1xyXG5cclxuICAgIGguc2V0VWludDgoOCwgJ1cnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCg5LCAnQScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEwLCAnVicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDExLCAnRScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEyLCAnZicuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDEzLCAnbScuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDE0LCAndCcuY2hhckNvZGVBdCgwKSk7XHJcbiAgICBoLnNldFVpbnQ4KDE1LCAnICcuY2hhckNvZGVBdCgwKSk7XHJcblxyXG4gICAgaC5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDIwLCAxLCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDIyLCBudW1iZXJPZkNoYW5uZWxzLCB0cnVlKTsgXHJcbiAgICBoLnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7IFxyXG4gICAgaC5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiAxICogMiwgdHJ1ZSk7IFxyXG4gICAgaC5zZXRVaW50MTYoMzIsIG51bWJlck9mQ2hhbm5lbHMgKiAyLCB0cnVlKTtcclxuICAgIGguc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XHJcblxyXG4gICAgaC5zZXRVaW50OCgzNiwgJ2QnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzNywgJ2EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzOCwgJ3QnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50OCgzOSwgJ2EnLmNoYXJDb2RlQXQoMCkpO1xyXG4gICAgaC5zZXRVaW50MzIoNDAsIGRhdGEuYnl0ZUxlbmd0aCwgdHJ1ZSk7XHJcblxyXG4gICAgcmV0dXJuIGNvbmNhdEJ1ZmZlcihoZWFkZXIsIGRhdGEpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgd2F2SGVhZDsiLCIvLyBDb25jYXQgdHdvIFN0cmVhbSBBcnJheUJ1ZmZlcnNcclxuY29uc3QgY29uY2F0QnVmZmVyID0gKHByZXYsIG5leHQpID0+IHtcclxuXHJcbiAgICBjb25zdCBtaWQgPSBuZXcgVWludDhBcnJheShwcmV2LmJ5dGVMZW5ndGggKyBuZXh0LmJ5dGVMZW5ndGgpO1xyXG5cclxuICAgIG1pZC5zZXQobmV3IFVpbnQ4QXJyYXkocHJldiksIDApO1xyXG4gICAgbWlkLnNldChuZXcgVWludDhBcnJheShuZXh0KSwgcHJldi5ieXRlTGVuZ3RoKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIG1pZC5idWZmZXI7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25jYXRCdWZmZXI7IiwiaW1wb3J0IFN0cmVhbUFuYWx5c2VyIGZyb20gJy4vd2F2LXN0cmVhbS1hbmFseXNlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdHJlYW1BbmFseXNlcjtcclxubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW1BbmFseXNlcjsiLCJpbXBvcnQgd2F2SGVhZCBmcm9tICcuL2FkZC1oZWFkZXInO1xyXG5cclxuY2xhc3MgU3RyZWFtQW5hbHlzZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGAtLS0tLS0tLS0tY29uc3RydWN0LS0tLS0tLS0tLS0tLWApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuICAgICAgICB0aGlzLmFuYWx5c2VyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUFuYWx5c2VyKCk7XHJcbiAgICAgICAgdGhpcy5hdWRpb1N0YWNrID0gW107XHJcblxyXG4gICAgICAgIC8vIHByaXZhdGUgcHJvcHNcclxuICAgICAgICB0aGlzLl9oYXNDYW5jZWxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3RpbWVvdXRJZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fMXN0ID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm51bWJlck9mQ2hhbm5lbHMgPSAwO1xyXG4gICAgICAgIHRoaXMuc2FtcGxlUmF0ZSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgX3NjaHVsZWRCdWYoKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgWyR7bmV3IERhdGUoKX1dIF9zY2h1bGVkQnVmIExlbjogJHt0aGlzLmF1ZGlvU3RhY2subGVuZ3RofWApO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5hdWRpb1N0YWNrLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVvdXRJZCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3RpbWVvdXRJZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9OyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgICAgIGNvbnN0IHNlZ21lbnQgPSB0aGlzLmF1ZGlvU3RhY2suc2hpZnQoKTsgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICBzb3VyY2UuYnVmZmVyID0gc2VnbWVudC5idWY7XHJcbiAgICAgICAgbGV0IGR1cmF0aW9uID0gc291cmNlLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgICAgICAvL2Nvbm5lY3QgdGhlIHNvdXJjZSB0byB0aGUgYW5hbHlzZXJcclxuICAgICAgICBzb3VyY2UuY29ubmVjdCh0aGlzLmFuYWx5c2VyKTtcclxuICAgICAgICB0aGlzLmFuYWx5c2VyLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYFRoaXMgc2VnbWVudCBkdXJhdGlvbjogJHtkdXJhdGlvbn1gKTtcclxuICAgICAgICBzb3VyY2Uuc3RhcnQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zY2h1bGVkQnVmKCksIDEwMDAgKiBkdXJhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHVibGljIGZ1bmNcclxuICAgIGZlZWQgKHJhdykge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYFske25ldyBEYXRlKCl9XSBmZWVkIGRhdGEgbGVuZ3RoOiAke3Jhdy5ieXRlTGVuZ3RofWApO1xyXG4gICAgICAgIGlmIChyYXcuYnl0ZUxlbmd0aCA9PT0gMCB8fCB0aGlzLl9oYXNDYW5jZWxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSAgICAgICAgXHJcblxyXG4gICAgICAgIC8vIFRvZG9cclxuICAgICAgICAvLyDmo4Dmn6XkuIDkuIvmmK/lkKblm6DkuLrmlbDmja7mmK/lpYfmlbDvvIzlr7zoh7TmnIkx5Liq5a2X6IqC55qE5q6L55WZ5pWw5o2uXHJcbiAgICAgICAgLy8g5pyJ55qE6K+d5bCx77yM5bCx5YWI5Yqg6L+b5Y6777yM5YaNY29uY2F0XHJcblxyXG4gICAgICAgIC8vIHByb2Nlc3MgbmV3IGJ1ZmZlclxyXG4gICAgICAgIGxldCBidWYsIGF1ZGlvU2VnbWVudCA9IHt9O1xyXG4gICAgICAgIGlmICh0aGlzLl8xc3QpIHtcclxuICAgICAgICAgICAgYnVmID0gcmF3LmJ1ZmZlcjtcclxuICAgICAgICAgICAgY29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubnVtYmVyT2ZDaGFubmVscyA9IGRhdGFWaWV3LmdldFVpbnQxNigyMiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2FtcGxlUmF0ZSA9IGRhdGFWaWV3LmdldFVpbnQzMigyNCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBidWYgPSBidWYuc2xpY2UoNDQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgbnVtYmVyT2ZDaGFubmVsczogJHt0aGlzLm51bWJlck9mQ2hhbm5lbHN9LCBzYW1wbGVSYXRlOiAke3RoaXMuc2FtcGxlUmF0ZX1gKTtcclxuICAgICAgICAgICAgdGhpcy5fMXN0ID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnVmID0gcmF3LmJ1ZmZlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGRlY29kZSByYXcgZGF0YSwgc2VuZCB0byBzY2hlZHVsZUJ1ZmZlclxyXG4gICAgICAgIHRoaXMuY29udGV4dFxyXG4gICAgICAgICAgICAuZGVjb2RlQXVkaW9EYXRhKHdhdkhlYWQoYnVmLCB0aGlzLnNhbXBsZVJhdGUsIHRoaXMubnVtYmVyT2ZDaGFubmVscykpXHJcbiAgICAgICAgICAgIC50aGVuKGF1ZGlvQnVmID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBhdWRpb1NlZ21lbnQuYnVmID0gYXVkaW9CdWY7XHJcbiAgICAgICAgICAgICAgICBhdWRpb1NlZ21lbnQuZHVyYXRpb24gPSBhdWRpb0J1Zi5kdXJhdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1ZGlvU3RhY2sucHVzaChhdWRpb1NlZ21lbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl90aW1lb3V0SWQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgc3RhcnQgX3NjaHVsZWRCdWZgKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY2h1bGVkQnVmKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCAoKSB7XHJcbiAgICAgICAgdGhpcy5faGFzQ2FuY2VsZWQgPSB0cnVlO1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lb3V0SWQpO1xyXG5cclxuICAgICAgICB0aGlzLmF1ZGlvU3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLl90aW1lb3V0SWQgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5jbG9zZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QXVkaW9JbmZvICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjaGFubmVsczogdGhpcy5udW1iZXJPZkNoYW5uZWxzLFxyXG4gICAgICAgICAgICBzYW1wbGVSYXRlIDogdGhpcy5zYW1wbGVSYXRlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldEFuYWx5enNlciAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5hbHlzZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFN0cmVhbUFuYWx5c2VyO1xyXG5cclxuIl19
