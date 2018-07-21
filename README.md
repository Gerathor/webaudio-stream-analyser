# Webaudio-Stream-Analyser
The technical implementation is based on the [Web Audio API](), and the pcm-raw data can be decoded by the decode interface by manually adding the WAV head. The calculation of the waveform spectrum is also based on the [visualizations api]().

## How to Example
````
npm install

yarn server

yarn build

yarn start
````

![img]()

## Usage

````js
// create your wav decode player
player = new StreamVisulizer();

// when you get pcm raw data, you need feed them to player, and music will playing.
let raw = new Uint8Array(event.data);				
player.feed(raw);

// if you want stop music
player.stop();

// you can get your stream data info of music
const {channels, sampleRate} = player.getAudioInfo();

// you can context.createAnalyser obj from this api, it will be connect to music destion and get data.
let analyser = player.getAnalyzser();
let array = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(array);

````












