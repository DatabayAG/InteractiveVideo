il.InteractiveVideoSimpleUrlPlayer = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	pub.initPlayer = function()
	{
		$.each(il.InteractiveVideo, function (player_id, value) {

			if (value.hasOwnProperty("player_type") && value.player_type === "surl") {
				il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
				var player   = null,
					seekTime = 0,
					interval = null;
				il.InteractiveVideo.last_stopPoint = -1;

				il.InteractiveVideoSubtitle.initializeSubtitleTracks(player_id);
				player =  new Plyr('#' + player_id, {});
				il.InteractiveVideo[player_id].player =	player
				il.InteractiveVideo[player_id].player.on('ready', event => {
					il.InteractiveVideoPlayerAbstract.config[player_id] = {
						pauseCallback: (function () {
							player.pause();
						}),
						playCallback: (function () {
							player.play();
						}),
						durationCallback: (function () {
							return player.duration
						}),
						currentTimeCallback: (function () {
							return player.currentTime
						}),
						setCurrentTimeCallback: (function (time) {
							player.currentTime = time;
						}),
						initPlayerCallback         : il.InteractiveVideoMediaElementPlayer.initPlayer
					};
					il.InteractiveVideoPlayerAbstract.readyCallback(player_id);
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
		il.InteractiveVideoSimpleUrlPlayer.initPlayer();
	});
})(jQuery);