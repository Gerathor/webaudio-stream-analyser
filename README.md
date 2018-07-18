# webaudio-stream-visulizer
pcm raw data player using WebAudio API to show spectrum visualization

技术实现基于，webAudio相关api，pcm-raw data 可以通过手动添加WAV head的方式用decode接口来解码。波形频谱的计算也是基于analyzer api。

## 接口模块组成
-   流媒体数据listen接口， feed-data
-   解码二进制媒体模块
-   音频buf 管理单元，拼接stream，clean已播放的数据
-   播放控制接口，play，stop
-   频谱显示动画单元

## 音频 buf 管理模块
这个模块是一个定时器，用来避免频繁的调用 createAudioBuffer 接口，因为每次接收到的data，都需要走一遍decode，导入audiobuffer的过程。这样在保证音乐播放连续的情况下，保证音频数据的处理顺序，不乱流，同时做一些性能缓冲，减少频繁调用 createAudioBuffer。

这里模拟的场景是，server端stream的chunk播放时长为1s，根据网速的不同，可以调整1s内发送不同chunk的数量。










