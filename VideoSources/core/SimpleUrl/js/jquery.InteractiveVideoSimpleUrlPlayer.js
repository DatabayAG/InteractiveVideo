$( document ).ready(function() {
	il.InteractiveVideoPlayerFunction.appendInteractionEvents();
});

(function ($) {

	il.Util.addOnLoad(function () {
		il.InteractiveVideo.last_stopPoint = -1;

		var options = {fluid : true};

		var player = videojs('ilInteractiveVideo', options, function onPlayerReady() {

			var interval = null;

			il.InteractiveVideoPlayerAbstract.config = {
				pauseCallback              : (function (){player.pause();}),
				playCallback               : (function (){player.play();}),
				durationCallback           : (function (){return player.duration();}),
				currentTimeCallback        : (function (){return player.currentTime();}),
				setCurrentTimeCallback     : (function (time){player.currentTime(time);}),
				removeNonAdventureElements : (function (){
					player.controlBar.progressControl.disable();
					player.controlBar.removeChild("currentTimeDisplay");
					player.controlBar.removeChild("remainingTimeDisplay");
				})
			};

			il.InteractiveVideoPlayerComments.fillEndTimeSelector(il.InteractiveVideoPlayerAbstract.duration());
			$('#ilInteractiveVideo').prepend($('#ilInteractiveVideoOverlay'));

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
				
					if(il.InteractiveVideo.video_mode == 0)
					{
						interval = setInterval(function () {
							il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player);
						}, 500);
					}
					else
					{
						il.InteractiveVideoPlayerAdventure.Init();

						interval = setInterval(function () {
							il.InteractiveVideoPlayerAdventure.playingEventHandler(interval, player);
						}, 500);
					}

			});

			this.on('contextmenu', function(e) {
				e.preventDefault();
			});
		});
	});
})(jQuery);