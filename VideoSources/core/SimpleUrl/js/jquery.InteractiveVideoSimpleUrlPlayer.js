$( document ).ready(function() {

});

(function ($) {
	il.Util.addOnLoad(function () {
		$.each(il.InteractiveVideo, function (player_id, value) {
			if (value.hasOwnProperty("player_type") && value.player_type === "surl") {
				il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
				var player   = null,
					seekTime = 0,
					interval = null;
				il.InteractiveVideo.last_stopPoint = -1;
				il.InteractiveVideoSubtitle.initializeSubtitleTracks(player_id);

				new MediaElementPlayer("#" + player_id, {

					timerRate:         50,
					enablePluginDebug: false,

					success: function (media) {

						media.addEventListener('loadeddata', function () {
							player = $("video#" + player_id)[0];

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

							il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration(player_id));
						}, false);

						media.addEventListener('loadedmetadata', function () {
							if (seekTime > 0) {
								media.currentTime = seekTime;
								seekTime = 0;
							}
							//Workaround for subtitle layout error with medialementjs
							$('.mejs-captions-layer.mejs-layer').css({'width' :'100%'})
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
				});
			}
		});
	});
})(jQuery);