il.InteractiveVideoPlayerAbstraction = (function () {
	'use strict';

	var pub = {}, pro = {}, pri = {};

	pub.seekingEventHandler = function(current_time)
	{
		if (il.InteractiveVideo.last_time > current_time)
		{
			il.InteractiveVideo.last_time = current_time;
			il.InteractiveVideo.last_stopPoint = -1;
		}
		else if (il.InteractiveVideo.last_time < current_time)
		{
			il.InteractiveVideo.last_time = current_time;
		}

		if(	il.InteractiveVideo.is_show_all_active === false)
		{
			il.InteractiveVideoPlayerUtils.replaceCommentsAfterSeeking(current_time);
		}
		else
		{
			il.InteractiveVideoPlayerUtils.clearAndRemarkCommentsAfterSeeking(current_time);
		}

		il.InteractiveVideoPlayerUtils.preselectActualTimeInVideo(current_time);
	};

	pub.playingEventHandler = function(current_time, duration, interval, player)
	{
		var cueTime, stop_video, i, j;
		if (current_time >= duration) {
			clearInterval(interval);
			return;
		}
		if (!isNaN(current_time) && current_time > 0) {

			il.InteractiveVideoPlayerUtils.clearCommentsWhereTimeEndEndded(current_time);

			for (j = stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(stopPoints[j], 10);
				if (cueTime >= il.InteractiveVideo.last_time && cueTime <= current_time)
				{
					stop_video = 0;
					if (il.InteractiveVideo.last_stopPoint < cueTime)
					{
						for (i = 0; i < Object.keys(comments).length; i++)
						{
							if (comments[i].comment_time == cueTime)
							{
								if(comments[i].comment_text != null)
								{
									$("#ul_scroll").prepend(il.InteractiveVideoPlayerUtils.buildListElement(comments[i], current_time, comments[i].user_name));
									if(comments[i].comment_time_end > 0)
									{
										il.InteractiveVideoPlayerUtils.fillCommentsTimeEndBlacklist(comments[i].comment_time_end, comments[i].comment_id);
									}
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
					il.InteractiveVideo.last_stopPoint = parseInt(cueTime, 10);
				}
			}
			il.InteractiveVideo.last_time = current_time;
		}
	};

	pub.appendInteractionEvents = function()
	{
		$("#ilInteractiveVideoCommentSubmit").on("click", function(e) {
			var tmp_obj, h, m, s;
			if( $('#comment_time_end').prop( "checked" ))
			{
				h =  $('#comment_time_end\\[time\\]_h').val();
				m =  $('#comment_time_end\\[time\\]_m').val();
				s =  $('#comment_time_end\\[time\\]_s').val();
			}
			tmp_obj =
			{
				'comment_id' : '0',
				'comment_time': $("video#ilInteractiveVideo")[0].currentTime,
				'comment_text': $('#comment_text').val(),
				"comment_time_end_h": h,
				"comment_time_end_m": m,
				"comment_time_end_s": s,
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
					"comment_time": $("video#ilInteractiveVideo")[0].currentTime,
					"comment_time_end_h": h,
					"comment_time_end_m": m,
					"comment_time_end_s": s,
					"comment_text": $('#comment_text').val(),
					'is_private': $('#is_private').prop( "checked" )
				},
				success  : function(data) {
					$('#comment_text').val("");
					il.InteractiveVideoPlayerUtils.rebuildCommentsViewIfShowAllIsActive();
				}
			});
		});

		$("#ilInteractiveVideoCommentCancel").on("click", function(e) {
			$('#comment_text').val('');
			$('#is_private').prop( 'checked', false );
			$('#comment_time_end').prop( 'checked', false );
			$('.end_time_selector').hide( 'fast' );
		});

		$('#comment_text').on('click', function(){
			if(il.InteractiveVideo.pause_on_click_in_comment_field)
			{
				$('#ilInteractiveVideo')["0"].pause();
			}
		});

		$('#show_all_comments').change(function() {
			il.InteractiveVideoPlayerUtils.displayAllCommentsAndDeactivateCommentStream($(this).prop('checked'));
		});

		$('#comment_time_end').change(function() {
			if($(this).is(':checked'))
			{
				$('.end_time_selector').show( 'fast' );
				il.InteractiveVideoPlayerUtils.preselectActualTimeInVideo($('#ilInteractiveVideo')['0'].currentTime);
			}
			else
			{
				$('.end_time_selector').hide( 'fast' );
			}

		});

		$('#show_all_comments').bootstrapToggle({
			on: switch_on,
			off: switch_off,
			width: 50,
			height: 27
		}, function(){
			if(il.InteractiveVideo.is_chronologic === '0')
			{
				$('#show_all_comments').click();
			}
		}());


		il.InteractiveVideoPlayerUtils.loadAllUserWithCommentsIntoFilterList();

		$('#dropdownMenuInteraktiveList a').click(function(){
			var value = $(this).html();
			var show_all_active_temp = il.InteractiveVideo.is_show_all_active;
			if(value === reset_text)
			{
				il.InteractiveVideo.filter_by_user = false;
				$('#dropdownMenuInteraktiveVideo').removeClass('btn-primary');
			}
			else
			{
				il.InteractiveVideo.filter_by_user = value;
				$('#dropdownMenuInteraktiveVideo').addClass('btn-primary');
			}
			il.InteractiveVideo.is_show_all_active = false;
			il.InteractiveVideoPlayerUtils.displayAllCommentsAndDeactivateCommentStream(show_all_active_temp);
			il.InteractiveVideo.is_show_all_active = show_all_active_temp;
		});
	};

	pub.protect = pro;
	return pub;

}());