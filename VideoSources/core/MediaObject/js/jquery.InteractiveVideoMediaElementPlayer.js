$(document).ready(function () {

});

(function ($) {
	il.Util.addOnLoad(function () {
		$.each(il.InteractiveVideo, function (id, value) {
			if (id !== "lang") {
				il.InteractiveVideoPlayerFunction.appendInteractionEvents(id);
				var player   = null,
					seekTime = 0,
					interval = null;
				il.InteractiveVideo.last_stopPoint = -1;
				player = new MediaElementPlayer("#" + id, {

					timerRate:         50,
					enablePluginDebug: false,

					success: function (media) {

						media.addEventListener('loadeddata', function () {
							var player = $("video#" + id)[0];

							il.InteractiveVideoPlayerAbstract.config = {
								pauseCallback:          (function () {
									player.pause();
								}),
								playCallback:           (function () {
									player.play();
								}),
								durationCallback:       (function () {
									return player.duration;
								}),
								currentTimeCallback:    (function () {
									return player.currentTime;
								}),
								setCurrentTimeCallback: (function (time) {
									player.setCurrentTime(time);
								})
							};

							il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration());
						}, false);

						media.addEventListener('loadedmetadata', function () {
							if (seekTime > 0) {
								media.currentTime = seekTime;
								seekTime = 0;
							}
						}, false);

						media.addEventListener('play', function () {
							il.InteractiveVideoPlayerAbstract.play(player);
						}, false);

						media.addEventListener('seeked', function () {
							clearInterval(interval);
							il.InteractiveVideoPlayerFunction.seekingEventHandler(player);
						}, false);

						media.addEventListener('pause', function () {
							clearInterval(interval);
							il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player);
						}, false);

						media.addEventListener('ended', function () {
							il.InteractiveVideoPlayerAbstract.videoFinished(player);
						}, false);

						media.addEventListener('playing', function () {
							interval = setInterval(function () {
								il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
							}, 500);

						}, false);
					}
				});
			}
		});
	});
})(jQuery);