const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: ['./src/wav-stream-analyser.js'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'wav-stream-analyser.min.js',
        library: "StreamAnalyser",
        libraryTarget: "umd"
    }
}

