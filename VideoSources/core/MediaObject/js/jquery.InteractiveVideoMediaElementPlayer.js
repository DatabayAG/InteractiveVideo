il.InteractiveVideoMediaElementPlayer = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.initPlayer = function()
	{
		$.each(il.InteractiveVideo, function (player_id, value) {

			if (value.hasOwnProperty("player_type") && value.player_type === "imo") {
				il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
				var player   = null,
					seekTime = 0,
					interval = null;
				il.InteractiveVideo.last_stopPoint = -1;

				il.InteractiveVideoSubtitle.initializeSubtitleTracks(player_id);
				il.InteractiveVideo[player_id].player =	 new Plyr('#' + player_id, {});
				il.InteractiveVideo[player_id].player.on('ready', event => {
					il.InteractiveVideoPlayerAbstract.config[player_id] = {
						pauseCallback: (function () {
							player = $("#" + player_id)[0];
							player.pause();
						}),
						playCallback: (function () {
							player = $("#" + player_id)[0];
							player.play();
						}),
						durationCallback: (function () {
							player = $("#" + player_id)[0];
							return player.getDuration
						}),
						currentTimeCallback: (function () {
							player = $("#" + player_id)[0];
							return player.currentTime
						}),
						setCurrentTimeCallback: (function (time) {
							player = $("#" + player_id)[0];
							player.seeked = time;
						}),
						initPlayerCallback         : il.InteractiveVideoMediaElementPlayer.initPlayer
					};
					il.InteractiveVideo[player_id].player.on('play', event => {
						il.InteractiveVideoPlayerAbstract.play(player_id);
					});
					il.InteractiveVideo[player_id].player.on('seeked', event => {
						clearInterval(interval);
						il.InteractiveVideoPlayerFunction.seekingEventHandler(player_id);
					});
					il.InteractiveVideo[player_id].player.on('pause', event => {
						clearInterval(interval);
						il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
					});
					il.InteractiveVideo[player_id].player.on('ended', event => {
						il.InteractiveVideoPlayerAbstract.videoFinished(player_id);
					});
					il.InteractiveVideo[player_id].player.on('playing', event => {
						interval = setInterval(function () {
							il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player_id);
						}, 500);
					});
				});
				/*	timerRate:         50,
					enablePluginDebug: false,
					stretching: "responsive",

					success: function (media) {
						player = $("#" + player_id)[0];
						il.InteractiveVideoPlayerAbstract.config[player_id] = {
							pauseCallback:          (function () {
								player.pause(player_id);
							}),
							playCallback:           (function () {
								player.play(player_id);
							}),
							durationCallback:       (function () {
								return player.duration;
							}),
							currentTimeCallback:    (function () {
								return player.currentTime;
							}),
							setCurrentTimeCallback: (function (time) {
								player.setCurrentTime(time, player_id);
							})
						};
						media.addEventListener('loadedmetadata', function () {
							il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration(player_id));
						}, false);

						media.addEventListener('loadedmetadata', function () {
							if (seekTime > 0) {
								media.currentTime = seekTime;
								seekTime = 0;
							}
						}, false);

						media.addEventListener('play', function () {
							il.InteractiveVideoPlayerAbstract.play(player_id);
						}, false);

						media.addEventListener('seeked', function () {
							clearInterval(interval);
							il.InteractiveVideoPlayerFunction.seekingEventHandler(player_id);
						}, false);

						media.addEventListener('pause', function () {
							clearInterval(interval);
							il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
						}, false);

						media.addEventListener('ended', function () {
							il.InteractiveVideoPlayerAbstract.videoFinished(player_id);
						}, false);

						media.addEventListener('playing', function () {
							interval = setInterval(function () {
								il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player_id);
							}, 500);

						}, false);
					}
				});*/
			}

		});
	};
	pub.protect = pro;
	return pub;

}(il));
(function ($) {
	il.Util.addOnLoad(function () {
		il.InteractiveVideoMediaElementPlayer.initPlayer();
	});
})(jQuery);