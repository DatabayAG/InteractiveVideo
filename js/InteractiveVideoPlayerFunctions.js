il.InteractiveVideoPlayerFunction = (function (scope) {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pri.utils = scope.InteractiveVideoPlayerComments;

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
			pri.utils.replaceCommentsAfterSeeking(current_time);
		}
		else
		{
			pri.utils.clearAndRemarkCommentsAfterSeeking(current_time);
		}

		pri.utils.preselectActualTimeInVideo(current_time);
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

			pri.utils.clearCommentsWhereTimeEndEndded(current_time);

			for (j = scope.InteractiveVideo.stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(scope.InteractiveVideo.stopPoints[j], 10);
				if (cueTime >= scope.InteractiveVideo.last_time && cueTime <= current_time)
				{
					stop_video = 0;
					if (scope.InteractiveVideo.last_stopPoint < cueTime)
					{
						for (i = 0; i < Object.keys(scope.InteractiveVideo.comments).length; i++)
						{
							if (scope.InteractiveVideo.comments[i].comment_time == cueTime)
							{
								stop_video = pro.commentsObjectActions(i, current_time, player);
							}
							if (stop_video == 1) {
								scope.InteractiveVideoPlayerAbstract.pause();
								stop_video = 0;
							}
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

	pro.commentsObjectActions = function(i, current_time, player)
	{
		var is_interactive = parseInt(scope.InteractiveVideo.comments[i].is_interactive, 10);
		var comment        = scope.InteractiveVideo.comments[i];
		var stop_video     = 0;
		
		if (scope.InteractiveVideo.comments[i].comment_text != null) 
		{
			$("#ul_scroll").prepend(pri.utils.buildListElement(comment, current_time, comment.user_name));

			if (comment.comment_time_end > 0) 
			{
				pri.utils.fillCommentsTimeEndBlacklist(comment.comment_time_end, comment.comment_id);
			}
		}

		if (is_interactive === 1 && $.inArray(comment.comment_id, scope.InteractiveVideo.ignore_questions) == -1) {
			stop_video = 1;
			InteractiveVideoQuestionViewer.getQuestionPerAjax(comment.comment_id, player);
		}
		else if (is_interactive === 1) 
		{
			$('.list_item_' + i).find('.comment_text').append(' (' + scope.InteractiveVideo.lang.answered_text + ') ');
		}

		return stop_video;
	};
	
	pro.addAjaxFunctionForCommentPosting = function()
	{
		$("#ilInteractiveVideoCommentSubmit").on("click", function(e) {
			var tmp_obj, h, m, s, fake_id;
			if( $('#comment_time_end').prop( "checked" ))
			{
				h = $('#comment_time_end\\[time\\]_h').val();
				m = $('#comment_time_end\\[time\\]_m').val();
				s = $('#comment_time_end\\[time\\]_s').val();

				var actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime();
				var h_end = parseInt(h, 10) * 3600;
				var m_end = parseInt(m, 10) * 60;
				var s_end = parseInt(s, 10);
				var end_time = h_end + m_end + s_end;
				if(end_time < parseInt(actual_time_in_video, 10))
				{
					$('#endtime_warning').removeClass('ilNoDisplay');
					return;
				}
			}

			fake_id = parseInt(Math.random() * 10000000, 10);
			tmp_obj = 
			{
				'comment_id' : fake_id,
				'comment_time': scope.InteractiveVideoPlayerAbstract.currentTime(),
				'comment_text': $('#comment_text').val(),
				'comment_time_end_h': h,
				'comment_time_end_m': m,
				'comment_time_end_s': s,
				'user_name': scope.InteractiveVideo.username,
				'is_interactive': '0',
				'is_private': $('#is_private').prop( "checked" )
			};
			if(!tmp_obj.comment_text)
			{
				$('#no_text_warning').removeClass('ilNoDisplay');
				return;
			}
			pri.utils.sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time);

			$("#ul_scroll").prepend(pri.utils.buildListElement(tmp_obj, tmp_obj.comment_time, scope.InteractiveVideo.username));

			$.ajax({
				type     : "POST",
				dataType : "JSON",
				url      : il.InteractiveVideo.post_comment_url,
				data     : {
					'comment_time': scope.InteractiveVideoPlayerAbstract.currentTime(),
					'comment_time_end_h': h,
					'comment_time_end_m': m,
					'comment_time_end_s': s,
					'comment_text': $('#comment_text').val(),
					'is_private': $('#is_private').prop( "checked" )
				},
				success  : function(data) {
					pro.resetCommentForm();
					pri.utils.rebuildCommentsViewIfShowAllIsActive();
				}
			});
		});
	};

	pro.resetCommentFormOnClick = function()
	{
		$("#ilInteractiveVideoCommentCancel").on("click", function(e) {
			pro.resetCommentForm();
		});
	};

	pro.resetCommentForm = function()
	{
		$('#comment_text').val('');
		$('#is_private').prop( 'checked', false );
		$('#comment_time_end').prop( 'checked', false );
		$('.end_time_selector').hide( 'fast' );
		$('.alert-warning').addClass('ilNoDisplay');
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
			pri.utils.displayAllCommentsAndDeactivateCommentStream($(this).prop('checked'));
		});
	};

	pro.addCommentTimeChanged = function()
	{
		$('#comment_time_end').change(function() {
			if($(this).is(':checked'))
			{
				$('.end_time_selector').show( 'fast' );
				pri.utils.preselectActualTimeInVideo(scope.InteractiveVideoPlayerAbstract.currentTime());
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
			pro.isChronologicViewDeactivatedShowAllComments();
		}());
	};
	
	pro.isChronologicViewDeactivatedShowAllComments = function()
	{
		if(scope.InteractiveVideo.is_chronologic === '1')
		{
			$('#show_all_comments').click();
		}
	};

	pro.addDropDownEvent = function()
	{
		pri.utils.loadAllUserWithCommentsIntoFilterList();

		$('#dropdownMenuInteraktiveList a').click(function(){
			var value = $(this).html();
			var show_all_active_temp = scope.InteractiveVideo.is_show_all_active;

			if(value === scope.InteractiveVideo.lang.reset_text)
			{
				scope.InteractiveVideo.filter_by_user = false;
				$('#dropdownMenuInteraktiveVideo').removeClass('btn-primary').html(il.InteractiveVideo.lang.author_filter);
			}
			else
			{
				scope.InteractiveVideo.filter_by_user = value;
				$('#dropdownMenuInteraktiveVideo').addClass('btn-primary').html(il.InteractiveVideo.lang.author_filter + ' ' + value);
			}

			if(scope.InteractiveVideoPlayerAbstract.currentTime() > 0 || scope.InteractiveVideo.is_show_all_active === true)
			{
				scope.InteractiveVideo.is_show_all_active = false;
				scope.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(show_all_active_temp);
				scope.InteractiveVideo.is_show_all_active = show_all_active_temp;
			}
		});
	};

	pub.protect = pro;
	return pub;

}(il));