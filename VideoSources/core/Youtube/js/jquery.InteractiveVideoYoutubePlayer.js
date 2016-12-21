$( document ).ready(function() {
	var tag = document.createElement('script');

	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	il.InteractiveVideoPlayerFunction.appendInteractionEvents();
});

var player = null,
	seekTime= 0,
	interval = null;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('ilInteractiveVideo', {
		videoId: interactiveVideoYoutubeId,
		events: {
			'onStateChange': onPlayerStateChange,
			'onReady': function(media) {
					il.InteractiveVideoPlayerAbstract.config = {
						pauseCallback           : (function (){player.pauseVideo();}),
						playCallback            : (function (){player.playVideo();}),
						durationCallback        : (function (){return player.getDuration();}),
						currentTimeCallback     : (function (){return player.getCurrentTime();}),
						setCurrentTimeCallback  : (function (time){player.seekTo(time);})
					};

				il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration());

				player.addEventListener('onStateChange', function(e){
					if(e.data === -1)
					{
						if (seekTime > 0) {
							media.currentTime = seekTime;
							seekTime = 0;
						}
					}
					else if(e.data === 1)
					{
						interval = setInterval(function () {
							il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
						}, 500);
					}
					else if(e.data === 2)
					{
						clearInterval(interval);
						il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime();
					}
					else if(e.data === 3)
					{
						clearInterval(interval);
						il.InteractiveVideoPlayerFunction.seekingEventHandler();
					}
				});
			}
		},
		timerRate: 50,
		enablePluginDebug: false
	});
}

var done = false;
function onPlayerStateChange(event)
{
	if (event.data == YT.PlayerState.PLAYING && !done) {
		done = true;
	}
}