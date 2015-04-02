$( document ).ready(function() {
	$("#ilInteractiveVideoCommentSubmit").on("click", function(e) {
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : post_comment_url,
			data     : {"comment_time":$("video#ilInteractiveVideo")[0].currentTime, "comment_text": $('#comment_text').val()},
			success  : function(data) {
				console.log("ok");
				$('#comment_text').val("");
			}
		});
	});

	$("#ilInteractiveVideoCommentCancel").on("click", function(e) {
		$('#comment_text').val("");
	});
});

$.fn.scrollToBottom = function (that)
{
	that.animate({ scrollTop: that.prop('scrollHeight') }, 200);
};

(function ($) {

	il.Util.addOnLoad(function () {
		var _lastTime = 0,

			interval = null,
			last_stopPoint = -1;

		var player = new MediaElementPlayer("#ilInteractiveVideo", {
			timerRate: 50,
			enablePluginDebug: false,
			success:           function(media) {

				media.addEventListener('seeked', function(e) {
					$().debugPrinter('Player', 'seeked');
					clearInterval(interval);
					if (_lastTime > media.currentTime) {
						_lastTime = media.currentTime;
					} else if (_lastTime < media.currentTime) {
						_lastTime = media.currentTime;
					}
				}, false);

				media.addEventListener('pause', function(e) {
					$().debugPrinter('Player', 'paused');
					clearInterval(interval);
					_lastTime = media.currentTime;
				}, false);

				media.addEventListener('playing', function(e) {
					$().debugPrinter('Player', 'playing');
					interval = setInterval(function () {
						if (media.currentTime >= media.duration) {
							clearInterval(interval);
							return;
						}
						if (!isNaN(media.currentTime) && media.currentTime > 0) {
							// @todo: Evtl. use a better way to detect the relevant stopping point

							for (var j = stopPoints.length - 1; j >= 0; j--) 
							{
								var cueTime = stopPoints[j];
								if (cueTime >= _lastTime && cueTime <= media.currentTime) 
								{
									var stop_video = 0;
									if (last_stopPoint < cueTime) 
									{
										for (var i = 0; i < Object.keys(comments).length; i++) 
										{
											if (comments[i].comment_time == cueTime) 
											{
												$("#ul_scroll").append('<li> <time id="time">'+ mejs.Utility.secondsToTimeCode(media.currentTime) +' </time> ' + comments[i].comment_text + '</li>');
												$().scrollToBottom($("#ilInteractiveVideoComments"));
												if (comments[i].is_interactive == 1) 
												{
													stop_video = 1;
													$().getQuestionPerAjax(comments[i].comment_id, player);
												}
											}
										}
										if (stop_video == 1) {
											player.pause();
											stop_video = 0;
										}
									}
									last_stopPoint = cueTime;
								}
							}
							_lastTime = media.currentTime;
						}
					}, 500);

				}, false);
			}
		});
	});
})(jQuery);