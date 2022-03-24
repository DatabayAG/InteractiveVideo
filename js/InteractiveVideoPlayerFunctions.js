il.InteractiveVideoPlayerFunction = (function (scope) {
	'use strict';

	let pub = {}, pro = {}, pri = {
		last_current_time : 0
	};

	pri.utils = scope.InteractiveVideoPlayerComments;

	pub.getCommentTextFromEditor = function()
	{
		return CKEDITOR.instances.comment_text.getData();
	};

	pub.seekingEventHandler = function(player)
	{
		let player_data = pub.getPlayerDataObjectByPlayer(player);
		let player_id = pub.getPlayerIdFromPlayerObject(player);
		let current_time = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);

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
			pri.utils.replaceCommentsAfterSeeking(current_time, player_id);
		}
		else
		{
			pri.utils.clearAndRemarkCommentsAfterSeeking(current_time, player);
		}

		pri.utils.preselectActualTimeInVideo(current_time);
		il.InteractiveVideoPlayerComments.buildToc(player_id);
		player_data.last_stop_id = -1;
		if(il.InteractiveVideoOverlayMarker.editScreen === false)
		{
			pri.utils.preselectActualTimeInVideo(current_time);
		}
	};

	pub.playingEventHandler = function(interval, player)
	{
		let cueTime, stop_video, i, j;
		let player_id       = pub.getPlayerIdFromPlayerObject(player);
		let current_time    = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
		let duration        = scope.InteractiveVideoPlayerAbstract.duration(player_id);
		let player_data     = pub.getPlayerDataObjectByPlayer(player);

		if (current_time >= duration) {
			clearInterval(interval);
			return;
		}

		scope.InteractiveVideoPlayerResume.saveResumeTime(player_id);
		pri.utils.highlightTocItem(player_id, current_time);
		if (!isNaN(current_time) && current_time > 0) {
			pri.checkForCompulsoryQuestion(player_id, current_time);
			pri.utils.clearCommentsWhereTimeEndEnded(player_id, current_time);
			for (j = player_data.stopPoints.length - 1; j >= 0; j--)
			{
				cueTime = parseInt(player_data.stopPoints[j], 10);
				if (cueTime >= player_data.last_time && cueTime <= current_time)
				{
					stop_video = 0;
					if (player_data.last_stopPoint <= cueTime)
					{
						for (i = 0; i < Object.keys(player_data.comments).length; i++)
						{
							if (parseInt(player_data.comments[i].comment_time, 10) === cueTime && player_data.last_stop_id !== j)
							{
								stop_video = pro.commentsObjectActions(i, current_time, player);
								player_data.last_stop_id = j;
							}
							if (stop_video === 1) {
								if(scope.InteractiveVideoPlayerAbstract.isFullScreen(player_id)){
									scope.InteractiveVideoPlayerAbstract.exitFullScreen(player_id)
								}
								scope.InteractiveVideoPlayerAbstract.pause(player_id);
								stop_video = 0;
							}
						}
					}
					player_data.last_stopPoint = cueTime;
				}
			}
			player_data.last_time = parseInt(current_time, 10);
		}
		pro.autoScrollForViewAllComments(player_id);
	};

	pro.autoScrollForViewAllComments = function(player_id)
	{
		let scrollHeight = 0;
		let j_obj_scroll_div	= $('#ilInteractiveVideoComments_' + player_id);
		let current_time      = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
		let show_all          = scope.InteractiveVideo[player_id].is_show_all_active;

		if(show_all) {
			if(pri.last_current_time !== current_time){

				$('#ul_scroll_' + player_id + ' li').each(function() {
					if($(this).find('.time').data('time') <= current_time) {
						scrollHeight += $(this).height();
					}
				});

				pri.last_current_time = current_time;
				//j_obj_scroll_div.scrollTop(scrollHeight);
			}
		}
	};

	pri.checkForCompulsoryQuestion = function(player_id, current_time)
	{
		let compulsory_question = il.InteractiveVideo[player_id].compulsoryQuestions;
		$.each(compulsory_question, function (key, object) {
			if(object.answered == false){
				if(current_time >= object.time) {
					il.InteractiveVideoPlayerAbstract.pause(player_id);
					il.InteractiveVideoPlayerAbstract.setCurrentTime(parseInt(object.time, 10) + 0.1, player_id);
					il.InteractiveVideoQuestionViewer.getQuestionPerAjax(object.comment_id, player_id, true);
					return false;
				}
			}
		});
	};

	pub.appendInteractionEvents = function(player_id)
	{
		pro.setInitialLayoutValue(player_id);
		pro.addAjaxFunctionForCommentPosting(player_id);
		pub.addShowAllCommentsChange(player_id);
		pro.addTaskInteraction(player_id);
		pro.addPausePlayerOnClick(player_id);
		pro.addCommentTimeChanged(player_id);
		pro.addBootStrapToggle(player_id);
		pro.addDropDownEvents(player_id);
		pro.addModalInteractionToBackLinkButton();
		pro.resetCommentFormOnClick(player_id);
	};

	pro.setInitialLayoutValue = function(player_id){
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		let width = player_data.layout_width
		pro.selectLayoutValue(player_id, width);
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

	pro.addHighlightToCommentWithoutEndTime = function(comment, player_id)
	{
		let time_end = parseInt(comment.comment_time_end, 10);
		if(time_end === 0 || time_end === null) 
		{
			$('.list_item_' + comment.comment_id).addClass('activeCommentWithoutEndTime');
			setTimeout(function(){
				$('.list_item_' + comment.comment_id).removeClass('activeCommentWithoutEndTime');}, il.InteractiveVideo[player_id].comment_hightlight_time);
		}
	};

	pro.commentsObjectActions = function(i, current_time, player)
	{
		let player_id      = pub.getPlayerIdFromPlayerObject(player);
		let player_data    = pub.getPlayerDataObjectByPlayer(player);
		let is_interactive = parseInt(player_data.comments[i].is_interactive, 10);
		let is_overlay_marker = parseInt(player_data.comments[i].is_overlay, 10);
		let comment        = player_data.comments[i];
		let stop_video     = 0;
		let comments_div   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll_' + player_id);
		let language       = scope.InteractiveVideo.lang;

		if (player_data.comments[i].comment_text != null)
		{
			comments_div.prepend(pri.utils.buildListElement(player_id, comment, current_time, comment.user_name));
			il.InteractiveVideoPlayerComments.registerReplyToListeners(player_id);
			pro.addHighlightToCommentWithoutEndTime(comment, player_id);
			if (comment.comment_time_end > 0) 
			{
				pri.utils.fillCommentsTimeEndBlacklist(player_id, comment.comment_time_end, comment.comment_id);
			}
		}

		if (is_interactive === 1 && $.inArray(comment.comment_id, player_data.ignore_questions) === -1) {
			stop_video = 1;
			il.InteractiveVideoQuestionViewer.getQuestionPerAjax(comment.comment_id, player, true);
		}
		else if (is_interactive === 1)
		{
			$('.list_item_' + i).find('.comment_text').append(' (' + language.answered_text + ') ');
		}

		if(is_overlay_marker === 1) {
			if($('.interactive_overlay_element_' + comment.comment_id).size() === 0){
				var marker = '<g class=interactive_overlay_element_' + comment.comment_id +'>' + comment.marker + '</g>';
				$('#ilInteractiveVideoOverlay').html($('#ilInteractiveVideoOverlay').html() + marker);
			}
		}
		return stop_video;
	};

	pub.postAndAppendFakeCommentToStream = function(actual_time_in_video, comment_text, is_private, end_time, marker, player_id) {
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		let fake_id = Math.random() * 10000000;

		let comments_div   = $('#ilInteractiveVideoComments_' + player_id + ' #ul_scroll_' + player_id);
		let tmp_obj =
			{
				'comment_id'       : fake_id,
				'comment_time'     : actual_time_in_video,
				'comment_text'     : comment_text,
				'comment_time_end' : end_time,
				'user_name'        : player_data.username,
				'user_image'       : player_data.user_image,
				'is_interactive'   : '0',
				'is_private'       : is_private,
				'is_table_of_content' : '0',
				'marker'              : '<svg>' + marker + '</svg>',
				'is_overlay'       : 1,
				'has_no_reply_button' : true

			};
		if (!tmp_obj.comment_text) 
		{
			$('#no_text_warning_' + player_id).removeClass('ilNoDisplay');
			return;
		}
		pri.utils.sliceCommentAndStopPointsInCorrectPosition(tmp_obj, tmp_obj.comment_time, player_data);
		comments_div.prepend(pri.utils.buildListElement(player_id, tmp_obj, tmp_obj.comment_time, player_data.username));
		pub.refreshMathJaxView();

		$.ajax({
			type:     "POST",
			url:      il.InteractiveVideo[player_id].post_comment_url,
			data:     {
				'comment_time'     : actual_time_in_video,
				'comment_time_end' : end_time,
				'comment_text'     : comment_text,
				'is_private'       : is_private,
				'marker'           : marker
			},
			success:  function () {
				pro.resetCommentForm(player_id);
				pri.utils.rebuildCommentsViewIfShowAllIsActive(player_id);
			}
		});
	};

	pro.addAjaxFunctionForCommentPosting = function(player_id)
	{
		$('#ilInteractiveVideoCommentSubmit_' + player_id).on("click", function() {
			let time;
			let actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
			let text_instance = 'comment_text_' + player_id;
			let comment_text = CKEDITOR.instances[text_instance].getData();
			let is_private = $('#is_private_' + player_id).prop("checked");
			let end_time = actual_time_in_video + 3;
			if( $('#comment_time_end_chk_' + player_id).prop( "checked" ))
			{
				time = $('#comment_time_end_' + player_id).val();
				time = time.split(':'); // split it at the colons

				end_time = (parseInt(time[0], 10) * 3600) + (parseInt(time[1], 10) * 60) + (parseInt(time[2], 10));

				if(end_time < parseInt(actual_time_in_video, 10))
				{
					$('#end_time_warning_' + player_id).removeClass('ilNoDisplay');
					return;
				}
			}

			pub.postAndAppendFakeCommentToStream(actual_time_in_video, comment_text, is_private, end_time, $('#ilInteractiveVideoOverlay').html(), player_id);
		});
	};

	pub.getSecondsFromTime = function(time)
	{
		time = time.split(':');
		return (parseInt(time[0], 10) * 3600) + (parseInt(time[1], 10) * 60) + (parseInt(time[2], 10));
	};

	pro.replyWasSubmittedSuccessful = function(player_id, org_id, comment_text, is_private, comment_id) {
		var reply = {'comment_text': comment_text, 'is_interactive': 0, 'is_private': is_private, 'user_name': scope.InteractiveVideo[player_id].username, 'comment_id': 'non_existent'};
		var html = scope.InteractiveVideoPlayerComments.getCommentRepliesHtml(reply);
		$('.list_item_' + comment_id).find('.comment_replies').append(html);
		pub.refreshMathJaxView();
	};

	pub.addAjaxFunctionForReflectionCommentPosting = function(comment_id, org_id, player_id)
	{
		$('#submit_comment_form_' + player_id).on("click", function() {
			let actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
			let comment_text = CKEDITOR.instances['text_reflection_comment_' + comment_id].getData();
			let is_private = $('#is_private_modal_' + player_id).prop("checked");
			$.ajax({
				type:     "POST",
				url:      il.InteractiveVideo[player_id].post_comment_url,
				data:     {
					'comment_time':      actual_time_in_video,
					'comment_text':      comment_text,
					'is_private':        is_private,
					'is_reply_to':       comment_id
				},
				success:  function () {
					$('.reply_comment_' + org_id).remove();
					$('.list_item_' + comment_id + ' .reply_comment_non_existent').remove();
					let reply = {'comment_text' : comment_text, 'is_interactive' : 0, 'is_private' : is_private, 'user_name' : scope.InteractiveVideo[player_id].username, 'comment_id' : 'non_existent'};
					let html = scope.InteractiveVideoPlayerComments.getCommentRepliesHtml(reply);
					$('.list_item_' + comment_id).find('.comment_replies').append(html);
					pub.decideSolutionHandlingForReflectionQuestion(comment_id, player_id);
					pro.replyWasSubmittedSuccessful(player_id, org_id, comment_text, is_private, comment_id);
					$('#ilQuestionModal').modal('hide');
					$('.reply_comment_' + org_id).remove();
					$('.reply_comment_non_existent').remove()
				}
			});
		});
	};

	pub.decideSolutionHandlingForReflectionQuestion = function(comment_id, player_id) {
		let question = il.InteractiveVideoQuestionViewer.QuestionObject;
		if(question.show_best_solution === "1" && question.show_best_solution_text.length >= 0){
			let reflection_solution = '<input id="reflection_solution" class="btn btn-default btn-sm" value="' +  il.InteractiveVideo.lang.show_best_solution + '" '+ 'type="submit">';
			let best_solution_element = '<div class="iv_show_best_solution_reflection iv_best_solution_hidden">' +
				'<div class="reflection_best_solution_title">' + il.InteractiveVideo.lang.solution + ': </div>' +
				'<div class="reflection_best_solution_text">' + question.show_best_solution_text + '</div>' +
				'</div>';
			$('.question_center').append($(best_solution_element))
			$('#question_reflection_buttons_bellow_form').append(reflection_solution)
			pro.registerReflectionBestSolutionListener(comment_id, player_id);
		} else {
			$('#ilQuestionModal').modal('hide');
			pub.refreshMathJaxView();
		}
	};

	pro.registerReflectionBestSolutionListener = function(comment_id, player_id)
	{
		let reflection_solution_btn = $('#reflection_solution');
		reflection_solution_btn.off('click');
		reflection_solution_btn.on('click', function () {
			reflection_solution_btn.prop('disabled', true);
			$('.submit_comment_form').remove();
			$('.iv_show_best_solution_reflection').removeClass('iv_best_solution_hidden')
			il.InteractiveVideoQuestionViewer.showBestSolutionForReflectionIsClicked(comment_id, player_id);
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
		CKEDITOR.instances['comment_text_' + player_id].setData('');
		$('#is_private_' + player_id).prop( 'checked', false );
		$('#comment_time_end_chk_' + player_id).prop( 'checked', false );
		$('.end_time_selector_' + player_id).hide( 'fast' );
		$('.alert-warning_' + player_id).addClass('ilNoDisplay');
		CKEDITOR.instances['comment_text_' + player_id].setData('');
		$('#is_private').prop( 'checked', false );
		$('#comment_time_end_chk').prop( 'checked', false );
		$('.end_time_selector').hide( 'fast' );
		$('.alert-warning').addClass('ilNoDisplay');
		$('.iv_svg_marker').remove();
		$('#add_marker_chk').prop( 'checked', false );
		//$('.add_marker_selector').hide( 'fast' );
		il.InteractiveVideoOverlayMarker.resetForm();
	};

	pro.addPausePlayerOnClick = function(player_id)
	{
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		let editor_name = 'comment_text_' + player_id;
		if($('#' + editor_name).size() > 0){
			CKEDITOR.on('instanceReady', function(evt) {
				let editor = evt.editor;
				if(editor.name === editor_name)
				{
					editor.on('focus', function() {
						if (player_data.pause_on_click_in_comment_field) {
							scope.InteractiveVideoPlayerAbstract.pause(player_id);
						}
					});
				}
			});

			//because the initialisation of youtube is slower than the init of CKEDITOR we need to reinit CKEDITOR
			if(player_data.player_type === 'ytb') {
				let editor_old_instance = CKEDITOR.instances[editor_name];
				if (editor_old_instance) { editor_old_instance.destroy(true); }
				CKEDITOR.replace(editor_name);
			}
		}


	};

	pub.addShowAllCommentsChange = function(player_id)
	{
		let filter_element = $('#show_all_comments_' + player_id);
		if(filter_element.length >= 1){
			filter_element.change(function() {
				pri.utils.displayAllCommentsAndDeactivateCommentStream($(this).prop('checked'), player_id);
			});
		} else{
			let show_all = (pub.getPlayerDataObjectByPlayerId(player_id).is_chronologic === '1');
			pri.utils.displayAllCommentsAndDeactivateCommentStream(show_all, player_id);
		}

	};

	pro.addCommentTimeChanged = function(player_id)
	{
		$('#comment_time_end_chk_' + player_id).change(function() {
			if($(this).is(':checked'))
			{
				$('.end_time_selector_' + player_id).show( 'fast' );
				pri.utils.preselectActualTimeInVideo(scope.InteractiveVideoPlayerAbstract.currentTime(player_id));
			}
			else
			{
				$('.end_time_selector_' + player_id).hide( 'fast' );
			}
		});

		$('#add_marker_chk').change(function() {
			if($(this).is(':checked'))
			{
				$('.add_marker_selector').show( 'fast' );
				il.InteractiveVideoOverlayMarker.attachListener();
			}
			else
			{
				$('.add_marker_selector').hide( 'fast' );
				il.InteractiveVideoOverlayMarker.resetForm();
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

	pro.setLayoutValue = function(value, player_id) {
		if (value === '1:1') {
			$('.player_element_' + player_id).css('width', '50%')
			$('.comment_element_' + player_id).css('width', '50%')
		} else if (value === '2:1') {
			$('.player_element_' + player_id).css('width', '70%')
			$('.comment_element_' + player_id).css('width', '30%')
		} else if (value === '1:0') {
			$('.player_element_' + player_id).css('width', '100%')
			$('.comment_element_' + player_id).css('width', '100%')
		}
	}

	pro.addDropDownEvents = function(player_id)
	{
		let language = scope.InteractiveVideo.lang;
		pri.utils.loadAllUserWithCommentsIntoFilterList(player_id);
		pri.utils.loadAllLayoutStyles(player_id);

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

			if(scope.InteractiveVideoPlayerAbstract.currentTime(player_id) > 0 || player_data.is_show_all_active === true)
			{
				player_data.is_show_all_active = false;
				scope.InteractiveVideoPlayerComments.displayAllCommentsAndDeactivateCommentStream(show_all_active_temp, player_id);
				player_data.is_show_all_active = show_all_active_temp;
			}
		});

		$('#dropdownMenuLayoutInteraktiveList_' + player_id + ' a').click(function(){
			let value = $(this).html();
			pro.selectLayoutValue(player_id, value);
		});
	};

	pro.selectLayoutValue = function(player_id, value)
	{
		let language = scope.InteractiveVideo.lang;
		let player_data = pub.getPlayerDataObjectByPlayerId(player_id);
		if(value === language.reset_text)
		{
			value = player_data.layout_width
			$('.dropdownMenuLayoutInteraktiveVideo_' + player_id).removeClass('btn-primary').html(language.layout_filter);
		}
		else
		{
			$('.dropdownMenuLayoutInteraktiveVideo_' + player_id).addClass('btn-primary').html(language.layout_filter + ' ' + value);
		}
		pro.setLayoutValue(value, player_id);
	}

	pro.registerListenerFunction = function()
	{
		var k = [], c = '38,38,40,40,37,39,37,39,66,65';
		$(document).keydown(function(e) {
			var rot = 'rotNinety';
			k.push(e.keyCode);
			if ( k.toString().indexOf( c ) >= 0 )
			{
				var object = $('#ilInteractiveVideo');
				if(object.hasClass(rot))
				{
					object.removeClass(rot);
				}
				else
				{

					object.addClass(rot);
				}
			}
		});
	};

	pro.addModalInteractionToBackLinkButton = function()
	{
	if(pub.doesReferencePointExists())
		{
			$('.back_link_to').on('click', function(event)
			{
				event.preventDefault();
				pub.finishAndReturnToReferencePoint();
			});
		}
	};

	pub.doesReferencePointExists = function()
	{
		let object = $('.back_link_to');
		return (object.size() > 0);
	};

	pub.jumpToTimeInVideoFromCommentTime = function()
	{
		var sec = il.InteractiveVideoPlayerFunction.getSecondsFromTime($('#comment_time').val());
		//Needs Player id
		il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(sec);
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
		let question_modal = $('#ilQuestionModal');

		question_modal.find('.back_link_cancel').on('click', function(event){
			event.preventDefault();
			question_modal.modal('hide');
		});
	};

	pub.triggerVideoStarted = function (player_id) {
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : pub.getPlayerDataObjectByPlayer(player_id).video_started_post_url,
			data     : {},
			success  : function() {
			}
		});
	};

	pub.triggerVideoFinished = function (player_id) {
		$.ajax({
			type     : "POST",
			dataType : "JSON",
			url      : pub.getPlayerDataObjectByPlayerId(player_id).video_finished_post_url,
			data     : {},
			success  : function() {
			}
		});
	};

	pub.refreshMathJaxView = function()
	{
		if (typeof MathJax !== 'undefined')
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
		if(typeof player === "string"){
			return player;
		}

		if(player.hasOwnProperty("node")){
			if(player.node.hasOwnProperty("id")){
				return player.node.id;
			}
		}

		//Youtube
		if(typeof player.getIframe !== "undefined"){
			let iframe_id = $(player.getIframe()).attr('id');
			if(iframe_id !== undefined){
				return iframe_id;
			}
		}

		//Youtube
		if(player.hasOwnProperty("f")){
			if(player.f.id !== undefined) {
				return player.f.id;
			}
		}

		//Youtube
		if(player.hasOwnProperty("i")){
			if(player.i.id !== undefined) {
				return player.i.id;
			}
		}

		//Vimeo
		if(typeof player.hasOwnProperty('element')){
			if(player.element.parentNode) {
				let iframe_id = player.element.parentNode.id;
				if(iframe_id !== undefined){
					return iframe_id;
				}
			}

		}
		console.log('No id found, there seems to be something wrong!')
	};

	pub.addAjaxFunctionForReplyPosting = function(player_id, comment_id, org_id)
	{
		$("#submit_comment_form").on("click", function() {
			var actual_time_in_video = scope.InteractiveVideoPlayerAbstract.currentTime(player_id);
			var comment_text = $('#list_item_' + comment_id).val();

			if(comment_text !== '')
			{
				$.ajax({
					type:     "POST",
					url:      il.InteractiveVideo[player_id].post_comment_url,
					data:     {
						'comment_time':      actual_time_in_video,
						'comment_text':      comment_text,
						'is_private':        0,
						'is_reply_to':       comment_id,
						'reply_to_posting' : true
					},
					success:  function () {
						pro.replyWasSubmittedSuccessful(player_id, org_id, comment_text, 0, comment_id);
						$('#list_item_container_' + comment_id).remove();
					}
				});
			}
		});
	};

	pub.getPlayerDataObjectByPlayerId = function(player_id)
	{
		return scope.InteractiveVideo[player_id];
	};

	pub.protect = pro;
	return pub;

}(il));
