$( document ).ready(function() {
	var tag = document.createElement('script');

	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

var player = null,
	seekTime= 0,
	interval = null;

function onYouTubeIframeAPIReady() {
	$.each(il.InteractiveVideo, function (player_id, value) {
		if (value.hasOwnProperty("player_type") && value.player_type === "ytb") {
			var player = new YT.Player(player_id, {
				videoId:           interactiveVideoYoutubeId,
				events:            {
					'onStateChange': onPlayerStateChange,
					'onReady':       function (media) {
						il.InteractiveVideoPlayerAbstract.config[player_id] = {
							pauseCallback           : (function (){player.pauseVideo(player_id);}),
							playCallback            : (function (){player.playVideo(player_id);}),
							durationCallback        : (function (){return player.getDuration(player_id);}),
							currentTimeCallback     : (function (){return player.getCurrentTime(player_id);}),
							setCurrentTimeCallback  : (function (time){player.seekTo(time, player_id);})
						};
						il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
						il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration(player_id));
						il.InteractiveVideoSubtitle.initializeSubtitleTracks(player_id);
						player.addEventListener('onStateChange', function (e) {
							if (e.data === -1) {
								if (seekTime > 0) {
									media.currentTime = seekTime;
									seekTime = 0;
								}
							}
							else if (e.data === 0) {
								il.InteractiveVideoPlayerAbstract.videoFinished(player_id);
							}
							else if (e.data === 1) {
								il.InteractiveVideoPlayerAbstract.play(player_id);

								interval = setInterval(function () {
									il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
								}, 500);
							}
							else if (e.data === 2) {
								clearInterval(interval);
								il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
							}
							else if (e.data === 3) {
								if (il.InteractiveVideo.last_time > 0 &&
									(il.InteractiveVideo.last_time < il.InteractiveVideoPlayerAbstract.currentTime(player_id) + 1 ||
										il.InteractiveVideoPlayerAbstract.currentTime(player_id) > il.InteractiveVideo.last_time + 1)) {
									clearInterval(interval);
									il.InteractiveVideoPlayerFunction.seekingEventHandler(player_id);
								}
							}
						});
					}
				},
				timerRate:         50,
				enablePluginDebug: false
			});
		}
	});
}
var done = false;
function onPlayerStateChange(event)
{
	if (event.data == YT.PlayerState.PLAYING && !done) {
		done = true;
	}
}