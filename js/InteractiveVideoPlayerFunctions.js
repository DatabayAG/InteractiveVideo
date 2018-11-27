il.InteractiveVideoPlayerFunction = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {};

	pri.utils = scope.InteractiveVideoPlayerComments;

	pub.seekingEventHandler = function(player)
	{
		let player_data = pub.getPlayerDataObjectByPlayer(player);
		let current_time = scope.InteractiveVideoPlayerAbstract.currentTime();
		
		if (player_data.last_time > current_time)
		{
			player_data.last_time = current_time;
			player_data.last_stopPoint = -1;
		}
		else if (player_data.last_time < current_time)
		{
			player_data.last_time = current_time;
		}

		if(player_data.is_show_all_active === false)
		{
			pri.utils.replaceCommentsAfterSeeking(current_time, player);
		}
		else
		{
			pri.utils.clearAndRemarkCommentsAfterSeeking(current_time, player);
		}

		pri.utils.preselectActualTimeInVideo(current_time);
	};

	pub.playingEventHandler = function(interval, player)
	{
		let cueTime, stop_video, i, j;
		let current_time    = scope.InteractiveVideoPlayerAbstract.currentTime();
		let duration        = scope.InteractiveVideoPlayerAbstract.duration();
		let player_id       = pub.getPlayerIdFromPlayerObject(player);
		let player_data     = pub.getPlayerDataObjectByPlayer(player);

		if (current_time >= duration) {
			clearInterval(interval);
			return;
		}

		if (!isNaN(current_time) && current_time > 0) {

			pri.utils.clearCommentsWhereTimeEndEndded(player_id, current_time);
			for (j = player_data.stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(player_data.stopPoints[j], 10);
				if (cueTime >= player_data.last_time && cueTime <= current_time)
				{
					stop_video = 0;
					if (player_data.last_stopPoint < cueTime)
					{
						for (i = 0; i < Object.keys(player_data.comments).length; i++)
						{
							if (player_data.comments[i].comment_time == cueTime)
							{
								stop_video = pro.commentsObjectActions(i, current_time, player);
							}
							if (stop_video == 1) {
								scope.InteractiveVideoPlayerAbstract.pause();
								stop_video = 0;
							}
						}
					}
					player_data.last_stopPoint = parseInt(cueTime, 10);
				}
			}
			player_data.last_time = current_time;
		}
	};

	pub.appendInteractionEvents = function(player_id)
	{
		pro.addAjaxFunctionForCommentPosting(player_id);
		pro.addShowAllCommetsChange(player_id);
		pro.addTaskInteraction(player_id);
		pro.addPausePlayerOnClick(player_id);
		pro.addCommentTimeChanged(player_id);
		pro.addBootStrapToggle(player_id);
		pro.addDropDownEvent(player_id);
		pro.addModalInteractionToBackLinkButton();
		pro.resetCommentFormOnClick(player_id);
	};
	
	pro.addTaskInteraction = function(player_id)
	{
		$('#task_interaction_' + player_id).on('click', function() {
			let description = $('#task_description_' + player_id);
			let icon = $('#task_icon_' + player_id);
			if(! description.hasClass('closed'))
			{
				description.addClass('closed');
				icon.addClass('arrow_left');
				icon.removeClass('arrow_down');
			}
			else
			{
				description.removeClass('closed');
				icon.addClass('arrow_down');
				icon.removeClass('arrow_left');
			}
		});
	};

	pro.addHighlightToCommentWithoutEndTime = function(comment)
	{
		let time_end = parseInt(comment.comment_time_end, 10);
		if(time_end === 0 || time_end === null) 
		{
			$('.list_item_' + comment.comment_id).addClass('activeCommentWithoutEndTime');
			setTimeout(function(){
				$('.list_item_' + comment.comment_id).removeClass('activeCommentWithoutEndTime');}, il.InteractiveVideo.comment_hightlight_time);
		}
	};

	pro.commentsObjectActions = function(i, current_time, player)
	{
		let player_id      = pub.getPlayerIdFromPlayerObject(player);
		let player_data    = pub.getPlayerDataObjectByPlayer(player);
		let is_interactive = parseInt(player_data.comments[i].is_interactive, 10);
		let comment        = player_data.comments[i];
		let stop_video     = 0;
		let comments_div   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll');
		let language = scope.InteractiveVideo.lang;

		if (player_data.comments[i].comment_text != null) 
		{
			comments_div.prepend(pri.utils.buildListElement(player_id, comment, current_time, comment.user_name));
			pro.addHighlightToCommentWithoutEndTime(comment);
			if (comment.comment_time_end > 0) 
			{
				pri.utils.fillCommentsTimeEndBlacklist(player_id, comment.comment_time_end, comment.comment_id);
			}
		}

		if (is_interactive === 1 && $.inArray(comment.comment_id, player_data.ignore_questions) == -1) {
			stop_video = 1;
			InteractiveVideoQuestionViewer.getQuestionPerAjax(comment.comment_id, player);
		}
		else if (is_interactive === 1) 
		{
			$('.list_item_' + i).find('.comment_text').append(' (' + language.answered_text + ') ');
		}

		return stop_video;
	};

	pub.postAndAppendFakeCommentToStream = function(actual_time_in_video, comment_text, is_private, end_time, player_id) {
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		let fake_id = parseInt(Math.random() * 10000000, 10);

		let comments_div   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll');
		let tmp_obj =
			{
				'comment_id':         fake_id,
				'comment_time':       actual_time_in_video,
				'comment_text':       comment_text,
				'comment_time_end':   end_time,
				'user_name':          player_data.username,
				'user_image':         player_data.user_image,
				'is_interactive':     '0',
				'is_private':         is_private
			};
		if (!tmp_obj.comment_text) 
		{
			$('#no_text_warning').removeClass('ilNoDisplay');
			return;
		}
		pri.utils.sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time, player_data);

		comments_div.prepend(pri.utils.buildListElement(player_id, tmp_obj, tmp_obj.comment_time, player_data.username));
		pub.refreshMathJaxView();

		$.ajax({
			type:     "POST",
			url:      il.InteractiveVideo.post_comment_url,
			data:     {
				'comment_time':       actual_time_in_video,
				'comment_time_end'  : end_time,
				'comment_text':      comment_text,
				'is_private':        is_private
			},
			success:  function () {
				pro.resetCommentForm(player_id);
				pri.utils.rebuildCommentsViewIfShowAllIsActive(player_id);
			}
		});
	};

	pro.addAjaxFunctionForCommentPosting = function(player_id)
	{
		$("#ilInteractiveVideoCommentSubmit").on("click", function() {
			let time;
			let actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime();
			let comment_text = CKEDITOR.instances.comment_text.getData();
			let is_private = $('#is_private').prop("checked");

			if( $('#comment_time_end_chk').prop( "checked" ))
			{
				time = $('#comment_time_end').val();
				time = time.split(':'); // split it at the colons

				var end_time = (parseInt(time[0], 10) * 3600) + (parseInt(time[1], 10) * 60) + (parseInt(time[2], 10));

				if(end_time < parseInt(actual_time_in_video, 10))
				{
					$('#endtime_warning').removeClass('ilNoDisplay');
					return;
				}
			}

			pub.postAndAppendFakeCommentToStream(actual_time_in_video, comment_text, is_private, end_time, player_id);
		});
	};

	pub.addAjaxFunctionForReflectionCommentPosting = function(comment_id, org_id, player_id)
	{
		$('#submit_comment_form_' + player_id).on("click", function() {
			let actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime();
			let comment_text = CKEDITOR.instances['text_reflection_comment_' + comment_id].getData();
			let is_private = $('#is_private_modal_' + player_id).prop("checked");
			//Todo: Check values
			$.ajax({
				type:     "POST",
				url:      il.InteractiveVideo.post_comment_url,
				data:     {
					'comment_time':      actual_time_in_video,
					'comment_text':      comment_text,
					'is_private':        is_private,
					'is_reply_to':       comment_id
				},
				success:  function () {
					$('.reply_comment_' + org_id).remove();
					$('.list_item_' + comment_id + ' .reply_comment_non_existent').remove();
					var reply = {'comment_text' : comment_text, 'is_interactive' : 0, 'is_private' : is_private, 'user_name' :scope.InteractiveVideo.username, 'comment_id' : 'non_existent'};
					var html = scope.InteractiveVideoPlayerComments.getCommentRepliesHtml(reply);
					$('.list_item_' + comment_id).find('.comment_replies').append(html);
					$('#ilQuestionModal').modal('hide');
					pub.refreshMathJaxView();
				}
			});
		});
	};

	pro.resetCommentFormOnClick = function(player_id)
	{
		$('#ilInteractiveVideoCommentCancel_' + player_id).on("click", function() {
			pro.resetCommentForm(player_id);
		});
	};

	pro.resetCommentForm = function(player_id)
	{
		CKEDITOR.instances.comment_text.setData('');
		$('#is_private_' + player_id).prop( 'checked', false );
		$('#comment_time_end_chk_' + player_id).prop( 'checked', false );
		$('.end_time_selector_' + player_id).hide( 'fast' );
		$('.alert-warning_' + player_id).addClass('ilNoDisplay');
	};

	pro.addPausePlayerOnClick = function(player_id)
	{
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		CKEDITOR.on('instanceReady', function(evt) {
			let editor = evt.editor;
			if(editor.name === 'comment_text_' + player_id)
			{
				editor.on('focus', function() {
					if (player_data.pause_on_click_in_comment_field) {
						scope.InteractiveVideoPlayerAbstract.pause();
					}
				});
			}
		});
	};

	pro.addShowAllCommetsChange = function(player_id)
	{
		$('#show_all_comments_' + player_id).change(function() {
			pri.utils.displayAllCommentsAndDeactivateCommentStream($(this).prop('checked'), player_id);
		});
	};

	pro.addCommentTimeChanged = function(player_id)
	{
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);

		$('#comment_time_end_chk_' + player_id).change(function() {
			if($(this).is(':checked'))
			{
				$('.end_time_selector_' + player_id).show( 'fast' );
				//Todo: check if this is a problem
				pri.utils.preselectActualTimeInVideo(scope.InteractiveVideoPlayerAbstract.currentTime());
			}
			else
			{
				$('.end_time_selector_' + player_id).hide( 'fast' );
			}
		});
	};

	pro.addBootStrapToggle = function(player_id)
	{
		let language = scope.InteractiveVideo.lang;

		$('#show_all_comments_' + player_id).bootstrapToggle({
			on: language.switch_on,
			off: language.switch_off,
			width: 50,
			height: 27
		}, function(){
			pro.isChronologicViewDeactivatedShowAllComments(player_id);
		}());
	};
	
	pro.isChronologicViewDeactivatedShowAllComments = function(player_id)
	{
		if(pub.getPlayerDataObjectByPlayerId(player_id).is_chronologic === '1')
		{
			$('#show_all_comments_' + player_id).click();
		}
	};

	pro.addDropDownEvent = function(player_id)
	{
		let language = scope.InteractiveVideo.lang;
		pri.utils.loadAllUserWithCommentsIntoFilterList(player_id);

		$('#dropdownMenuInteraktiveList_' + player_id + ' a').click(function(){
			let value = $(this).html();
			let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
			let show_all_active_temp = player_data.is_show_all_active;

			if(value === language.reset_text)
			{
				player_data.filter_by_user = false;
				$('#dropdownMenuInteraktiveVideo_' + player_id).removeClass('btn-primary').html(language.author_filter);
			}
			else
			{
				player_data.filter_by_user = value;
				$('#dropdownMenuInteraktiveVideo_' + player_id).addClass('btn-primary').html(language.author_filter + ' ' + value);
			}

			if(scope.InteractiveVideoPlayerAbstract.currentTime() > 0 || player_data.is_show_all_active === true)
			{
				player_data.is_show_all_active = false;
				scope.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(show_all_active_temp, player_id);
				player_data.is_show_all_active = show_all_active_temp;
			}
		});
	};

	pro.addModalInteractionToBackLinkButton = function()
	{
	/*if(pub.doesReferencePointExists())
		{
			$('.back_link_to').on('click', function(event)
			{
				event.preventDefault();
				pub.finishAndReturnToReferencePoint();
			});
		}*/
	};
	
	pub.doesReferencePointExists = function()
	{
		let object = $('.back_link_to');
		return (object.size() > 0);
	};

	pub.finishAndReturnToReferencePoint = function()
	{
		let modal = $('.modal-body');
		modal.html('');
		$('.modal-title').html();
		modal.append($('.back_to_title').html());
		modal.show();
		$('#ilQuestionModal').modal('show');
		pro.addCancelAction();
	};
	
	pro.addCancelAction = function()
	{
		$('#ilQuestionModal').find('.back_link_cancel').on('click', function(event){
			event.preventDefault();
			$('#ilQuestionModal').modal('hide');
		});
	};

	pub.triggerVideoStarted = function (player) {
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : pub.getPlayerDataObjectByPlayer(player).video_started_post_url,
			data     : {},
			success  : function() {
			}
		});
	};

	pub.triggerVideoFinished = function (player) {
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : pub.getPlayerDataObjectByPlayer(player).video_finished_post_url,
			data     : {},
			success  : function() {
			}
		});
	};

	pub.refreshMathJaxView = function()
	{
		if (typeof MathJax != 'undefined') 
		{
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		}
	};

	pub.getPlayerDataObjectByPlayer = function(player)
	{
		return pub.getPlayerDataObjectByPlayerId(pub.getPlayerIdFromPlayerObject(player));
	};

	pub.getPlayerIdFromPlayerObject = function(player)
	{
		return player.node.id;
	};

	pub.getPlayerDataObjectByPlayerId = function(player_id)
	{
		return scope.InteractiveVideo[player_id];
	};

	pub.protect = pro;
	return pub;

}(il));