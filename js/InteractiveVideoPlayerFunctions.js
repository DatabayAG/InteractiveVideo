il.InteractiveVideoPlayerFunction = (function (scope) {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pub.seekingEventHandler = function()
	{
		var current_time = scope.InteractiveVideoPlayerAbstract.currentTime();
		
		if (scope.InteractiveVideo.last_time > current_time)
		{
			scope.InteractiveVideo.last_time = current_time;
			scope.InteractiveVideo.last_stopPoint = -1;
		}
		else if (scope.InteractiveVideo.last_time < current_time)
		{
			scope.InteractiveVideo.last_time = current_time;
		}

		if(	scope.InteractiveVideo.is_show_all_active === false)
		{
			scope.InteractiveVideoPlayerUtils.replaceCommentsAfterSeeking(current_time);
		}
		else
		{
			scope.InteractiveVideoPlayerUtils.clearAndRemarkCommentsAfterSeeking(current_time);
		}

		scope.InteractiveVideoPlayerUtils.preselectActualTimeInVideo(current_time);
	};

	pub.playingEventHandler = function(interval, player)
	{
		var cueTime, stop_video, i, j;
		var current_time    = scope.InteractiveVideoPlayerAbstract.currentTime();
		var duration        = scope.InteractiveVideoPlayerAbstract.duration();

		if (current_time >= duration) {
			clearInterval(interval);
			return;
		}
		if (!isNaN(current_time) && current_time > 0) {

			scope.InteractiveVideoPlayerUtils.clearCommentsWhereTimeEndEndded(current_time);

			for (j = stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(stopPoints[j], 10);
				if (cueTime >= scope.InteractiveVideo.last_time && cueTime <= current_time)
				{
					stop_video = 0;
					if (scope.InteractiveVideo.last_stopPoint < cueTime)
					{
						for (i = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
						{
							if (scope.InteractiveVideo.comments[i].comment_time == cueTime)
							{
								if(scope.InteractiveVideo.comments[i].comment_text != null)
								{
									$("#ul_scroll").prepend(scope.InteractiveVideoPlayerUtils.buildListElement(scope.InteractiveVideo.comments[i], current_time, scope.InteractiveVideo.comments[i].user_name));
									if(scope.InteractiveVideo.comments[i].comment_time_end > 0)
									{
										scope.InteractiveVideoPlayerUtils.fillCommentsTimeEndBlacklist(scope.InteractiveVideo.comments[i].comment_time_end, scope.InteractiveVideo.comments[i].comment_id);
									}
								}
								if (scope.InteractiveVideo.comments[i].is_interactive == 1 && $.inArray(scope.InteractiveVideo.comments[i].comment_id, ignore_questions) == -1)
								{
									stop_video = 1;
									InteractiveVideoQuestionViewer.getQuestionPerAjax(scope.InteractiveVideo.comments[i].comment_id, player);
								}
								else if (scope.InteractiveVideo.comments[i].is_interactive == 1)
								{
									$('.list_item_' + i).find('.comment_text').append(' (' + scope.InteractiveVideo.lang.answered_text + ') ');
								}
							}
						}
						if (stop_video == 1) {
							scope.InteractiveVideoPlayerAbstract.pause();
							stop_video = 0;
						}
					}
					scope.InteractiveVideo.last_stopPoint = parseInt(cueTime, 10);
				}
			}
			scope.InteractiveVideo.last_time = current_time;
		}
	};

	pub.appendInteractionEvents = function()
	{
		pro.addAjaxFunctionForCommentPosting();

		pro.resetCommentFormOnClick();

		pro.addPausePlayerOnClick();

		pro.addShowAllCommetsChange();

		pro.addCommentTimeChanged();

		pro.addBootStrapToggle();

		pro.addDropDownEvent();
	};

	pro.addAjaxFunctionForCommentPosting = function()
	{
		$("#ilInteractiveVideoCommentSubmit").on("click", function(e) {
			var tmp_obj, h, m, s;
			if( $('#comment_time_end').prop( "checked" ))
			{
				h = $('#comment_time_end\\[time\\]_h').val();
				m = $('#comment_time_end\\[time\\]_m').val();
				s = $('#comment_time_end\\[time\\]_s').val();
			}
			tmp_obj =
			{
				'comment_id' : '0',
				'comment_time': scope.InteractiveVideoPlayerAbstract.currentTime(),
				'comment_text': $('#comment_text').val(),
				"comment_time_end_h": h,
				"comment_time_end_m": m,
				"comment_time_end_s": s,
				'user_name': username,
				'is_interactive': '0',
				'is_private': $('#is_private').prop( "checked" )
			};
			scope.InteractiveVideoPlayerUtils.sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time);

			$("#ul_scroll").prepend(scope.InteractiveVideoPlayerUtils.buildListElement(tmp_obj, tmp_obj.comment_time, username));

			$.ajax({
				type     : "POST",
				dataType : "JSON",
				url      : post_comment_url,
				data     : {
					"comment_time": scope.InteractiveVideoPlayerAbstract.currentTime(),
					"comment_time_end_h": h,
					"comment_time_end_m": m,
					"comment_time_end_s": s,
					"comment_text": $('#comment_text').val(),
					'is_private': $('#is_private').prop( "checked" )
				},
				success  : function(data) {
					$('#comment_text').val("");
					scope.InteractiveVideoPlayerUtils.rebuildCommentsViewIfShowAllIsActive();
				}
			});
		});
	};

	pro.resetCommentFormOnClick = function()
	{
		$("#ilInteractiveVideoCommentCancel").on("click", function(e) {
			$('#comment_text').val('');
			$('#is_private').prop( 'checked', false );
			$('#comment_time_end').prop( 'checked', false );
			$('.end_time_selector').hide( 'fast' );
		});
	};
	
	pro.addPausePlayerOnClick = function()
	{
		$('#comment_text').on('click', function(){
			if(scope.InteractiveVideo.pause_on_click_in_comment_field)
			{
				scope.InteractiveVideoPlayerAbstract.pause();
			}
		});
	};
	
	pro.addShowAllCommetsChange = function()
	{
		$('#show_all_comments').change(function() {
			scope.InteractiveVideoPlayerUtils.displayAllCommentsAndDeactivateCommentStream($(this).prop('checked'));
		});
	};

	pro.addCommentTimeChanged = function()
	{
		$('#comment_time_end').change(function() {
			if($(this).is(':checked'))
			{
				$('.end_time_selector').show( 'fast' );
				scope.InteractiveVideoPlayerUtils.preselectActualTimeInVideo(scope.InteractiveVideoPlayerAbstract.currentTime());
			}
			else
			{
				$('.end_time_selector').hide( 'fast' );
			}
		});
	};

	pro.addBootStrapToggle = function()
	{
		$('#show_all_comments').bootstrapToggle({
			on: scope.InteractiveVideo.lang.switch_on,
			off: scope.InteractiveVideo.lang.switch_off,
			width: 50,
			height: 27
		}, function(){
			if(scope.InteractiveVideo.is_chronologic === '0')
			{
				$('#show_all_comments').click();
			}
		}());
	};
	
	pro.addDropDownEvent = function()
	{
		scope.InteractiveVideoPlayerUtils.loadAllUserWithCommentsIntoFilterList();

		$('#dropdownMenuInteraktiveList a').click(function(){
			var value = $(this).html();
			var show_all_active_temp = scope.InteractiveVideo.is_show_all_active;
			if(value === scope.InteractiveVideo.lang.reset_text)
			{
				scope.InteractiveVideo.filter_by_user = false;
				$('#dropdownMenuInteraktiveVideo').removeClass('btn-primary');
			}
			else
			{
				scope.InteractiveVideo.filter_by_user = value;
				$('#dropdownMenuInteraktiveVideo').addClass('btn-primary');
			}
			if(scope.InteractiveVideoPlayerAbstract.currentTime() > 0)
			{
				scope.InteractiveVideo.is_show_all_active = false;
				scope.InteractiveVideoPlayerUtils.displayAllCommentsAndDeactivateCommentStream(show_all_active_temp);
				scope.InteractiveVideo.is_show_all_active = show_all_active_temp;
			}
		});
	};

	pub.protect = pro;
	return pub;

}(il));