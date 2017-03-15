$( document ).ready(function() {
	il.InteractiveVideoPlayerFunction.appendInteractionEvents();
});

(function ($) {
	il.Util.addOnLoad(function () {
		var player = null,
			seekTime= 0,
			interval = null;
		il.InteractiveVideo.last_stopPoint = -1;
		player = new MediaElementPlayer("#ilInteractiveVideo", {

			timerRate: 50,
			enablePluginDebug: false,

			success: function(media) {

				media.addEventListener('loadeddata', function () {
					var player = $("video#ilInteractiveVideo")[0];

					il.InteractiveVideoPlayerAbstract.config = {
						pauseCallback           : (function (){player.pause();}),
						playCallback            : (function (){player.play();}),
						durationCallback        : (function (){return player.duration;}),
						currentTimeCallback     : (function (){return player.currentTime;}),
						setCurrentTimeCallback  : (function (time){player.setCurrentTime(time);})
					};

					il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration());
				}, false);

				media.addEventListener('loadedmetadata', function () {
					if (seekTime > 0) {
						media.currentTime = seekTime;
						seekTime = 0;
					}
				}, false);

				media.addEventListener('play', function() {
					il.InteractiveVideoPlayerAbstract.play();
				}, false);

				media.addEventListener('seeked', function() {
					clearInterval(interval);
					il.InteractiveVideoPlayerFunction.seekingEventHandler();
				}, false);

				media.addEventListener('pause', function() {
					clearInterval(interval);
					il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime();
				}, false);

				media.addEventListener('ended', function() {
					il.InteractiveVideoPlayerAbstract.videoFinished();
				}, false);

				media.addEventListener('playing', function() {
					interval = setInterval(function () {
						il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
					}, 500);

				}, false);
			}
		});
	});
})(jQuery);