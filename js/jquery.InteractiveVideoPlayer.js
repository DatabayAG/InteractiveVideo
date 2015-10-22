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
		$().sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time);
		
		$("#ul_scroll").prepend($().buildListElement(tmp_obj, tmp_obj.comment_time, username));
		
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

$.fn.sliceCommentAndStopPointsInCorrectPosition = function (tmp_obj, time)
{
	var pos = 0;
	for (var i = 0; i < Object.keys(comments).length; i++)
	{
		if (comments[i].comment_time <= time)
		{
			pos = i;
		}
	}
	comments.splice( pos + 1, 0 , tmp_obj);
	stopPoints.splice( pos + 1, 0, Math.floor(time));
};

$.fn.replaceCommentsAfterSeeking = function (time)
{
	var html = '';
	for (var i = 0; i < Object.keys(comments).length; i++)
	{
		if (comments[i].comment_time <= time && comments[i].comment_text != null && comments[i].is_interactive == 0)
		{
			html = $().buildListElement(comments[i], comments[i].comment_time, comments[i].user_name) + html;
		}
	}
	$("#ul_scroll").html(html);
};

$.fn.jumpToTimeInVideo = function (time)
{
	var video_player = $('#ilInteractiveVideo')["0"];
	video_player.play();
	video_player.pause();
	if(time != null)
	{
		video_player.setCurrentTime(time);
	}
	$().resumeVideo();
};

$.fn.resumeVideo = function ()
{
	if(InteractiveVideo.auto_resume === true)
	{
		$('#ilInteractiveVideo')["0"].play();
	}
};

$.fn.buildListElement = function (comment, time, username, counter)
{
	var comment_tags    = '';
	var private_comment = '';
	if(comment.comment_title == null)
	{
		comment.comment_title = '';
	}
	if(comment.comment_tags == null)
	{
		comment_tags = '';
	}
	else
	{
		comment_tags = '<span class="tag">' + comment.comment_tags.split(',').join('</span> <span class="tag">') + '</span>';
	}
	if(username != '')
	{
		username = '[' + username + ']';
	}
	if(comment.is_interactive == 1)
	{
		username  = '[' + question_text + ']';
	}
	if(comment.is_private == 1)
	{
		private_comment = ' (' + private_text + ')';
	}
	else
	{
		private_comment = '';
	}
	return '<li class="list_item_' + counter + '">' + 
				'<time class="time"> <a onClick="$().jumpToTimeInVideo(' + time + '); return false;">'+ mejs.Utility.secondsToTimeCode(time)  + '</a></time> '  + 
		   		'<span class="comment_username"> ' + username                + '</span> '  +
				'<span class="comment_title">' 	   + comment.comment_title   + '</span> '  +
				'<span class="comment_text">'      + comment.comment_text    + '</span> '  +
				'<span class="private_text">'      + private_comment         + '</span> '  +
				'<br/><div class="comment_tags">'  + comment_tags    		 + '</div> '  +
		   '</li>';
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
						last_stopPoint = -1;
					} else if (_lastTime < media.currentTime) {
						_lastTime = media.currentTime;
					}
					$().replaceCommentsAfterSeeking(media.currentTime);
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
												if(comments[i].comment_text != null)
												{
													$("#ul_scroll").prepend($().buildListElement(comments[i], media.currentTime, comments[i].user_name, i));
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
									last_stopPoint = cueTime;
								}
							}
							_lastTime = media.currentTime;
						}
					}, 250);

				}, false);
			}
		});
	});
})(jQuery);
