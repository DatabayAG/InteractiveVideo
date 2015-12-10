$( document ).ready(function() {
	il.InteractiveVideoPlayerAbstraction.appendInteractionEvents();
});

(function ($) {

	il.Util.addOnLoad(function () {
		var player = null,
			interval = null;
		il.InteractiveVideo.last_stopPoint = -1;
		player = new MediaElementPlayer("#ilInteractiveVideo", {
			timerRate: 50,
			enablePluginDebug: false,
			success:           function(media) {

				media.addEventListener('loadeddata', function (e) {
					il.InteractiveVideoPlayerUtils.fillEndTimeSelector( media.duration);
				}, false);

				media.addEventListener('loadedmetadata', function (e) {
					if (seekTime > 0) {
						media.currentTime = seekTime;
						seekTime = 0;
					}
				}, false);

				media.addEventListener('seeked', function(e) {
					clearInterval(interval);
					il.InteractiveVideoPlayerAbstraction.seekingEventHandler(media.currentTime);
				}, false);

				media.addEventListener('pause', function(e) {
					clearInterval(interval);
					il.InteractiveVideo.last_time = media.currentTime;
				}, false);

				media.addEventListener('ended', function(e) {
				}, false);

				media.addEventListener('playing', function(e) {
					interval = setInterval(function () {
						il.InteractiveVideoPlayerAbstraction.playingEventHandler(media.currentTime, media.duration, interval, player);
					}, 500);

				}, false);
			}
		});
	});
})(jQuery);

