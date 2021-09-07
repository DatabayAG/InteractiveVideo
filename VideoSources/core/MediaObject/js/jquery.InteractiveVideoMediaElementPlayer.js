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