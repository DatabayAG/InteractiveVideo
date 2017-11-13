	$( document ).ready(function() {
		il.InteractiveVideoPlayerFunction.appendInteractionEvents();
	});

	(function ($) {

		il.Util.addOnLoad(function () {
			il.InteractiveVideo.last_stopPoint = -1;

			var options = {
				"techOrder": ["youtube"],
				"sources": [{ "type": "video/youtube", "src": "https://www.youtube.com/watch?v="+interactiveVideoYoutubeId+""}], "youtube": { "ytControls": 2 }
			};

			var player = videojs('ilInteractiveVideo', options, function onPlayerReady() {

				var interval = null;

				il.InteractiveVideoPlayerAbstract.config = {
					pauseCallback           : (function (){player.pause();}),
					playCallback            : (function (){player.play();}),
					durationCallback        : (function (){return player.duration();}),
					currentTimeCallback     : (function (){return player.currentTime();}),
					setCurrentTimeCallback  : (function (time){player.setCurrentTime(time);})
				};

				il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration());

				this.on('seeked', function() {
					clearInterval(interval);
					il.InteractiveVideoPlayerFunction.seekingEventHandler();
				});

				this.on('pause', function() {
					clearInterval(interval);
					il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime();
				});

				this.on('ended', function() {
					il.InteractiveVideoPlayerAbstract.videoFinished();
				});

				this.on('playing', function() {
					interval = setInterval(function () {
						il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
					}, 500);

				});
			});
		});
})(jQuery);
