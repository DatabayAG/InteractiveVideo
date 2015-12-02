$( document ).ready(function() {
	$("#ilInteractiveVideoCommentSubmit").on("click", function(e) {
		tmp_obj = 
			{
				'comment_id': '0',
				'comment_time': $("video#ilInteractiveVideo")[0].currentTime,
				'comment_text': $('#comment_text').val(),
				'user_name': username,
				'is_interactive': '0',
				'is_private': $('#is_private').prop( "checked" )
			};
		il.InteractiveVideoPlayerUtils.sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time);
		
		$("#ul_scroll").prepend(il.InteractiveVideoPlayerUtils.buildListElement(tmp_obj, tmp_obj.comment_time, username));
		
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : post_comment_url,
			data     : {
						    "comment_time":$("video#ilInteractiveVideo")[0].currentTime, 
							"comment_text": $('#comment_text').val(), 
							'is_private': $('#is_private').prop( "checked" )
						},
			success  : function(data) {
				$('#comment_text').val("");
			}
		});
	});

	$("#ilInteractiveVideoCommentCancel").on("click", function(e) {
		$('#comment_text').val("");
	});

	$("#ilInteractiveVideoTutorCommentSubmit").on("click", function(e) {
		$('#comment_time').val($("video#ilInteractiveVideo")[0].currentTime);
	});
	
	$("#ilInteractiveVideoTutorQuestionSubmit").on("click", function(e) {
		$('#comment_time').val($("video#ilInteractiveVideo")[0].currentTime);
	});
	$('#comment_text').on('click', function(){
		if(InteractiveVideo.pause_on_click_in_comment_field)
		{
			$('#ilInteractiveVideo')["0"].pause();
		}
	});
});


(function ($) {

	il.Util.addOnLoad(function () {
		var _lastTime = 0,
			player = null,
			interval = null;
		InteractiveVideo.last_stopPoint = -1;
		player = new MediaElementPlayer("#ilInteractiveVideo", {
			timerRate: 50,
			enablePluginDebug: false,
			success:           function(media) {

				media.addEventListener('loadedmetadata', function (e) {
					$().debugPrinter('Player', 'loadedmetadata');
					if (seekTime > 0) {
						media.currentTime = seekTime;
						seekTime = 0;
					}
				}, false);

				media.addEventListener('seeked', function(e) {
					$().debugPrinter('Player', 'seeked');
					clearInterval(interval);
					if (_lastTime > media.currentTime) {
						_lastTime = media.currentTime;
						InteractiveVideo.last_stopPoint = -1;
					} else if (_lastTime < media.currentTime) {
						_lastTime = media.currentTime;
					}
					il.InteractiveVideoPlayerUtils.replaceCommentsAfterSeeking(media.currentTime);
				}, false);

				media.addEventListener('pause', function(e) {
					$().debugPrinter('Player', 'paused');
					clearInterval(interval);
					_lastTime = media.currentTime;
				}, false);

				media.addEventListener('ended', function(e) {
					$().debugPrinter('Player', 'video finished');
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
								var cueTime = parseInt(stopPoints[j], 10);
								if (cueTime >= _lastTime && cueTime <= media.currentTime) 
								{
									var stop_video = 0;
									if (InteractiveVideo.last_stopPoint < cueTime) 
									{
										for (var i = 0; i < Object.keys(comments).length; i++) 
										{
											if (comments[i].comment_time == cueTime) 
											{
												if(comments[i].comment_text != null)
												{
													$("#ul_scroll").prepend(il.InteractiveVideoPlayerUtils.buildListElement(comments[i], media.currentTime, comments[i].user_name, i));
												}
												if (comments[i].is_interactive == 1 && $.inArray(comments[i].comment_id, ignore_questions) == -1) 
												{
													stop_video = 1;
													InteractiveVideoQuestionViewer.getQuestionPerAjax(comments[i].comment_id, player);
												}
												else if (comments[i].is_interactive == 1)
												{
													$('.list_item_' + i).find('.comment_text').append(' (' + answered_text + ') ');
												}
											}
										}
										if (stop_video == 1) {
											player.pause();
											stop_video = 0;
										}
									}
									InteractiveVideo.last_stopPoint = parseInt(cueTime, 10);
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
