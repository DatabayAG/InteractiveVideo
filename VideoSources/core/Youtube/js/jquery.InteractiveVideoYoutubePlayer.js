$( document ).ready(function() {
	var tag = document.createElement('script');

	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

var player = null,
	seekTime= 0,
	repeat_interval = null,
	interval = null;



function onYouTubeIframeAPIReady() {
	$.each(il.InteractiveVideo, function (player_id, value) {

		if (value.hasOwnProperty("player_type") && value.player_type === "ytb") {
			console.log('ytb ' + player_id)
			 player =  new Plyr('#' + player_id, {
		});

			player.on('ready', event => {
					il.InteractiveVideoPlayerAbstract.config[player_id] = {
						pauseCallback: (function () {
							player.pause();
						}),
						playCallback: (function () {
							player.play();
						}),
						durationCallback: (function () {
							return player.getDuration
						}),
						currentTimeCallback: (function () {
							return player.currentTime
						}),
						setCurrentTimeCallback: (function (time) {
							player.seeked();
						})
					};
					console.log('CONFIG ' + player_id)

			});

			/*{
				videoId:           $('#'+player_id).attr('data-youtube-id'),
				listeners:            {
					'onStateChange': onPlayerStateChange,
					'ready':       function (media) {
						il.InteractiveVideoPlayerAbstract.config[player_id] = {
							pauseCallback           : (function (){player.pauseVideo(player_id);}),
							playCallback            : (function (){player.playVideo(player_id);}),
							durationCallback        : (function (){return player.getDuration(player_id);}),
							currentTimeCallback     : (function (){return player.getCurrentTime(player_id);}),
							setCurrentTimeCallback  : (function (time){player.seekTo(time, player_id);})
						};
						console.log('CONFIG ' + player_id)
						il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
						il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration(player_id));
						il.InteractiveVideoSubtitle.initializeSubtitleTracks(player_id);

						function repeatingYoutubeFunc() {
						if(il.InteractiveVideo.last_time != il.InteractiveVideoPlayerAbstract.currentTime(player_id)) {
								il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
								il.InteractiveVideoSourceYoutube.seekInPlayer(player_id);
							}
							clearInterval(repeat_interval);
							repeat_interval = setTimeout(repeatingYoutubeFunc, 500);
						}

						// Youtube iframe player doesn't fire onStateChange event if in pause mode
						player.addEventListener('onStateChange', function (e) {
							// -1 (unstarted)
							if (e.data === -1) {
								if (seekTime > 0) {
									media.currentTime = seekTime;
									seekTime = 0;
								}
							}
							// 0 (ended)
							else if (e.data === 0) {
								il.InteractiveVideoPlayerAbstract.videoFinished(player_id);
							}
							// 1 (playing)
							else if (e.data === 1) {
								il.InteractiveVideoPlayerAbstract.play(player_id);

								interval = setInterval(function () {
									il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
								}, 500);
								clearInterval(repeat_interval);
							}
							// 2 (paused)
							else if (e.data === 2) {
								clearInterval(interval);
								il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
								clearInterval(repeat_interval);
								repeat_interval = setTimeout(repeatingYoutubeFunc, 500);
							}
							// 3 (buffering)
							else if (e.data === 3) {
								il.InteractiveVideoSourceYoutube.seekInPlayer(player_id);
							}
						});
					}
				},
				timerRate:         50,
				enablePluginDebug: false
			});*/
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

il.InteractiveVideoSourceYoutube = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
 };

	pub.seekInPlayer = function(player_id) {
		if(pro.checkIfSeekEventShouldBeTriggered(player_id))
		{
			clearInterval(interval);
			il.InteractiveVideoPlayerFunction.seekingEventHandler(player_id);
		}
	};

	pro.checkIfSeekEventShouldBeTriggered = function(player_id) {
		if ( pro.lastTimeIsGreaterAsZero() &&
				( pro.lastTimeIsSmallerThanCurrentTime(player_id) 
						|| pro.lastTimeIsGreaterThanCurrentTime(player_id) 
						|| pro.currentTimeEqualsZero(player_id)
				) 
			 )
		{
			return true;
		}
		return false;
	};

	pro.lastTimeIsGreaterAsZero = function() {
		return il.InteractiveVideo.last_time >= 0;
	};

	pro.lastTimeIsSmallerThanCurrentTime = function(player_id) {
		return il.InteractiveVideo.last_time <
				il.InteractiveVideoPlayerAbstract.currentTime(player_id) + 1;
	};

	pro.lastTimeIsGreaterThanCurrentTime = function(player_id) {
		return il.InteractiveVideoPlayerAbstract.currentTime(player_id) >
				il.InteractiveVideo.last_time + 1;
	};

	pro.currentTimeEqualsZero = function(player_id) {
		return il.InteractiveVideoPlayerAbstract.currentTime(player_id) === 0
	};

	pub.protect = pro;
	return pub;

}(il));