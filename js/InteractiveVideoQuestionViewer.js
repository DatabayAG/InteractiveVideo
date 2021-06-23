il.InteractiveVideoQuestionViewer = (function (scope) {
	'use strict';
	let pub = {},
			pro = {},
			pri = {
				locked:  false,
				ids:     {
					modal:                    '#ilQuestionModal',
					question_form:            '#question_form',
					close_form:               '#close_form',
					send_form:                '#sendForm',
					time_string:              '#jumpToTimeInVideo',
					answer_part:              '#answer_',
					private_modal:            '#is_private_modal_',
					question_btns_below_form: '#question_buttons_bellow_form',
				},
				classes: {
					modal_body:     '.modal-body',
					modal_title:    '.modal-title',
					modal_feedback: '.modal_feedback',
					modal_close:    '.close',
					modal_content:  '.modal-content'
				},
			};

	pub.QuestionObject = {};

	pro.cleanModal = function() {
		$('.modal-title').html('');
		$('.modal-body').html('');
		$('#question_buttons_bellow_form').remove();
		$('.modal_feedback').remove();
	}

	pub.getQuestionPerAjax = function (comment_id, player) {
		pro.cleanModal();
		if(pro.isQuestionLockEnabled() && $(pri.ids.modal).css('display') === 'none') {
				pro.removeQuestionLock();
		}

		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);

		$.when(
				$.ajax({
					url:  player_data.question_get_url + '&comment_id=' + comment_id,
					type: 'GET', dataType: 'json'
				})
		).then(function (array) {
			if(pro.isQuestionLockDisabled()) {
				pro.enableQuestionLock();
				pro.showQuestionInteractionForm(comment_id, array, player);
			}
		});
	};

	pub.toggleCloseButtons = function(show) {
		if (show) {
			$(pri.ids.modal + ' ' + pri.ids.close_form).hide();
			$(pri.ids.modal + ' ' + pri.classes.modal_close).hide();
		} else {
			$(pri.ids.modal + ' ' + pri.ids.close_form).show();
			$(pri.ids.modal + ' ' + pri.classes.modal_close).show();
		}
	};

	pro.addCompulsoryHeader = function(header){
		pub.toggleCloseButtons(false);
		$(pri.ids.modal + ' .modal-header').removeClass('compulsory');
		if(pub.QuestionObject.compulsory_question === "1") {
			if(! pub.QuestionObject.feedback) {
				pub.toggleCloseButtons(true);
			}
			header = '<span class="compulsory_question">' + il.InteractiveVideo["lang"].compulsory + '</span>';
			$(pri.ids.modal + ' .modal-header').addClass('compulsory');
		}
		return header;
	};

	pro.buildQuestionForm = function(comment_id, player) {
		//Todo: make modal operations use id and .find()
		let modal  = $(pri.classes.modal_body);
		let type   = parseInt(pub.QuestionObject.type, 10);
		let img    = '';
		let header = '';

		modal.html('');
		if(pub.QuestionObject.question_image)
		{
			img = '<div class="question_image_container"><img class="question_image" src="' + pub.QuestionObject.question_image + '"/></div>';
		}

		modal.append(img + '<div class="question_center"><p>' + pub.QuestionObject.question_text + '</p></div>');
		if (type === 0) {
			pro.addAnswerPossibilities('radio');
			pro.addFeedbackDiv();
			pro.addButtons(comment_id, player, type);
		} else if (type === 1) {
			pro.addAnswerPossibilities('checkbox');
			pro.addFeedbackDiv();
			pro.addButtons(comment_id, player, type);
		} else if (type === 2) {
			pro.addSelfReflectionLayout(player);
		}
		header = pro.addCompulsoryHeader(header);
		$(pri.classes.modal_title).html(pub.QuestionObject.question_title + ' ' + header);
		pro.showPreviousAnswer(comment_id, player);
	};

	pro.showPreviousAnswer = function(comment_id, player)
	{
		if(pub.QuestionObject.feedback !== undefined && pub.QuestionObject.previous_answer !== undefined)
		{
			pro.disableInteractionsIfLimitAttemptsIsActivated();
			$.each(pub.QuestionObject.previous_answer, function (l, value) {
				$(pri.ids.answer_part + value).attr('checked', true);
			});
			if(pub.QuestionObject.type != 2)
			{
				pro.showFeedback(comment_id, pub.QuestionObject.feedback, player);
			}
		}
		il.InteractiveVideoPlayerFunction.refreshMathJaxView();
	};

	pro.addAnswerPossibilities = function(input_type) {
		let html = '';
		$('#question_buttons_bellow_form').remove()
		html = '<div class="question_flex_div"><form id="question_form">';
		$.each(pub.QuestionObject.answers, function (l, value) {
			html += pro.buildAnswerInputElement(input_type, value);
		});
		html += '<input name="qid" value ="' + pub.QuestionObject.question_id + '" type="hidden"/>';
		html += '<div id="question_buttons_bellow_form"></div>';
		html += '</form></div>';
		$(pri.classes.modal_body).append(html);
	};

	pro.buildAnswerInputElement = function(input_type, value)
	{
		return  '<label for="answer_'   + value.answer_id + '" class="answer_label">' +
			'<input' +
			' id="answer_'  + value.answer_id + '" name="answer[]"' +
			' value="'      + value.answer_id + '"' +
			' type="'       + input_type + '">' +
			value.answer +
			'</label>' + 
			'<div class="progress rf_listener response_frequency_' + value.answer_id + ' ilNoDisplay"></div>';
	};

	pro.addSelfReflectionLayout = function(player) {
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
		let player_id = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
		let language = scope.InteractiveVideo.lang;

		$(pri.classes.modal_body).append('<div class="modal_feedback"><div class="modal_reflection_footer">' + pro.createButtonButtons('close_form', language.close_text) +'</div></div>', '');
		if(parseInt(pub.QuestionObject.reflection_question_comment, 10) === 1)
		{
			pro.appendSelfReflectionCommentForm(player_id);
		}

		pro.appendCloseButtonListener(player_id);
		$.ajax({
			type:    "POST",
			cache:   false,
			url:     player_data.question_post_url,
			data:    {'qid' : pub.QuestionObject.question_id},
			success: function () {
				pro.addToLocalIgnoreArrayIfNonRepeatable(player_id);
			}
		});
	};
	
	pro.appendSelfReflectionCommentForm = function(player_id)
	{
		let comment_id = 'text_reflection_comment_'+ pub.comment_id ;
		let footer = $('.modal_reflection_footer');
		let feedback = $(pri.classes.modal_feedback);
		let language = scope.InteractiveVideo.lang;
		let html = '<div id="question_reflection_buttons_bellow_form"></div>';
		$(pri.classes.modal_body).append(html);

		$('#question_reflection_buttons_bellow_form').prepend(pro.createButtonButtons('submit_comment_form_' + player_id, language.save, 'submit_comment_form'));
		$('#question_reflection_buttons_bellow_form').prepend($(pri.ids.close_form));
		footer.prepend('<input type="checkbox" name="is_private_modal" value="1" id="is_private_modal_' + player_id + '"/> ' + language.private_text);
		feedback.prepend('<textarea id="'+comment_id+'">' + pub.QuestionObject.reply_to_txt + '</textarea>');
		if(pub.QuestionObject.reply_to_private == '1')
		{
			$(pri.ids.private_modal + player_id).attr('checked', 'checked');
		}
		CKEDITOR.replace(comment_id);
		feedback.prepend(language.add_comment);
		scope.InteractiveVideoPlayerFunction.addAjaxFunctionForReflectionCommentPosting(pub.comment_id, pub.QuestionObject.reply_original_id, player_id);
	};

	pro.addToLocalIgnoreArrayIfNonRepeatable = function(player_id){
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayerId(player_id);
		let repeat = parseInt(il.InteractiveVideoQuestionViewer.QuestionObject.repeat_question, 10);

		if(repeat === 0)
		{
			player_data.ignore_questions.push(pub.comment_id);
		}
	};

	pro.addFeedbackDiv = function() {
		$('.modal_feedback').remove()
		$(pri.classes.modal_body).after('<div class="modal_feedback"></div>');
	};

	pro.addButtons = function(comment_id, player, type) {
		let question_form = $(pri.ids.question_btns_below_form);
		$('.question_action_btn').remove()
		let language = scope.InteractiveVideo.lang;

		question_form.append(pro.createButtonButtons('close_form', language.close_text, 'question_action_btn', 'button'));
		question_form.append(pro.createButtonButtons('sendForm', language.send_text, 'question_action_btn'));
		pro.appendButtonListener(comment_id, player, type);
	};

	pro.showFeedback = function(comment_id, feedback, player){
		let modal = $(pri.classes.modal_feedback);
		let language = scope.InteractiveVideo.lang;
		let player_id = scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
		$(pri.classes.modal_content).append($('#question_buttons_bellow_form'))
		modal.html('');
		pro.showResponseFrequency(feedback.response_frequency);
		modal.html(feedback.html);
		if (parseInt(feedback.is_timed, 10) === 1) {
			modal.append('<div class="learning_recommendation"><br/>' + language.learning_recommendation_text + ': ' + pro.createButtonButtons('jumpToTimeInVideo', language.feedback_button_text + ' ' + il.InteractiveVideoPlayerComments.protect.secondsToTimeCode(feedback.time)) + '</div>', '');
			let player_id = scope.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
			$(pri.ids.time_string).on('click', function () {
				$(pri.ids.modal).modal('hide');

				scope.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(feedback.time, player_id);

			});
		}
		if(feedback.feedback_link !== undefined && feedback.feedback_link !== '')
		{
			modal.append('<div class="learning_recommendation_link">' + language.more_information + ': <span class="feedback_link_more">' + '<img src="' + feedback.feedback_icon + '"/>' + feedback.feedback_link + '</span></div>');
		}

		$('.iv_best_solution_value').html(feedback.best_solution);
		$('#question_buttons_bellow_form').append($('#show_best_solution'))
		$('#show_best_solution').val(il.InteractiveVideo["lang"].show_best_solution);
		$('#show_best_solution').hide();
		if(feedback.correct != true) {
			$('#show_best_solution').show();
			$('#show_best_solution').off('click');
			$('#show_best_solution').on('click', function () {
				$('.iv_best_solution_hidden').removeClass('iv_best_solution_hidden');
				pro.sortAppendBestSolution();
				$('#sendForm').remove()
				$('#question_form input[name="answer[]"]').prop( "disabled", true )
				$('#close_form').prop( "disabled", false )
				pro.showBestSolutionIsClicked(comment_id, player)
			});
		}

	};

	pro.showBestSolutionIsClicked = function(comment_id, player) {
		$('#show_best_solution').prop("disabled", true)
		if(pub.QuestionObject.limit_attempts === "0"){
			$('#question_buttons_bellow_form').append(pro.createButtonButtons('repeat_question', scope.InteractiveVideo.lang.repeat, 'question_repeat_btn', 'button'))
			$('.question_repeat_btn').off('click');
			$('.question_repeat_btn').on('click', function () {
				let time = parseInt(pub.QuestionObject.time, 10);

				//$(pri.ids.modal).modal('hide');
				pro.removeQuestionLock();
				pub.getQuestionPerAjax(comment_id, player);
				//il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(time - 1, player_id);
			});
		}
	}

	pub.showBestSolutionForReflectionIsClicked = function(player_id) {
		$('#show_best_solution').prop("disabled", true)
		if(pub.QuestionObject.limit_attempts === "0"){
			$('#question_reflection_buttons_bellow_form').append(pro.createButtonButtons('repeat_question', scope.InteractiveVideo.lang.repeat, 'question_repeat_btn', 'button'))
			$('#repeat_question').off('click');
			$('#repeat_question').on('click', function () {
				let time = parseInt(pub.QuestionObject.time, 10);

				$(pri.ids.modal).modal('hide');
				il.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(time - 1, player_id);
			});
		}
	}

	pro.sortAppendBestSolution = function()
	{
		$('.best_solution_block').remove()
		$('.best_solution_answer_view').remove();
		$.each($('.best_solution_answer'), function (key, object) {
			let question_type = pub.QuestionObject.type;
			let answer_id = parseInt($(object).data('best-solution'), 10);
			let answer_state = parseInt($(object).data('answer-state'), 10);
			if(question_type === "0"){
				let element = '<div class="best_solution_answer_view"><input type="radio" onClick="return false;"></div>'
				if(answer_state === 1) {
					element = '<div class="best_solution_answer_view"><input type="radio" onClick="return false;" checked="checked"></div>'
				}
				$( element).prependTo($('#answer_' + answer_id).parent())
			} else if (question_type === "1"){
				let element = '<div class="best_solution_answer_view"><input type="checkbox" onClick="return false;"></div>'
				if(answer_state === 1) {
					element = '<div class="best_solution_answer_view"><input type="checkbox" onClick="return false;" checked="checked"></div>'
				}
				$( element).prependTo($('#answer_' + answer_id).parent())
			}

		});

		$('.question_flex_div').prepend($('<div class="best_solution_block">' + il.InteractiveVideo["lang"].solution + ': </div>'))
	}

	pro.showResponseFrequency = function(response_frequency) 
	{
		let answers_count = 0;
		let percentage = 0;

		if(parseInt(pub.QuestionObject.show_response_frequency, 10) === 1)
		{
			$.each(response_frequency, function (l, value) {
				answers_count += parseInt(value, 10);
			});

			$.each($('.rf_listener'), function () {
				$(this).removeClass('ilNoDisplay');
				$(this).html('<div class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">0%</div>');
			});
			$.each(response_frequency, function (l, value) {
				percentage = ((value / answers_count) * 100).toFixed(2);
				$('.response_frequency_' + l).html('<div class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percentage + '%;">' + percentage + '% ('+ value +')</div>');
			});
		}
	};

	pro.appendButtonListener = function(comment_id, player, type) {
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
		let player_id = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);

		$(pri.ids.send_form).off('click')
		$(pri.ids.send_form).on('click', function (e) {
			e.preventDefault();
			if(type === 0 && $(pri.ids.question_form + ' input:checked').length === 0) {
				if($(pri.classes.modal_body + ' .modal_alert').length === 0){
					$(pri.classes.modal_body).prepend('<div class="modal_alert">' + il.InteractiveVideo.lang.at_least_one_answer + '</div>');
				}
			} else {
				$(pri.classes.modal_body + ' .modal_alert').remove()

				$.ajax({
					type:    "POST",
					cache:   false,
					url:     player_data.question_post_url,
					data:    $(pri.ids.question_form).serialize(),
					success: function (feedback) {
						let obj = JSON.parse(feedback);
						let question_id = pub.QuestionObject.question_id;
						if(question_id in il.InteractiveVideo[player_id].compulsoryQuestions) {
							il.InteractiveVideo[player_id].compulsoryQuestions[question_id].answered = true;
						}
						$('#show_best_solution').remove();
						pro.showFeedback(comment_id, obj, player);
						pro.addToLocalIgnoreArrayIfNonRepeatable(player_id);
						pub.toggleCloseButtons(false);
						pro.disableInteractionsIfLimitAttemptsIsActivated(player_id);

					}
				});
			}
		});
		pro.appendCloseButtonListener(player_id);
	};

	pro.disableInteractionsIfLimitAttemptsIsActivated = function(player_id)
	{
		let limit_attempts = il.InteractiveVideoQuestionViewer.QuestionObject.limit_attempts;
		
		if(limit_attempts === '1') {
			$("#question_form :input").attr("disabled", true);
			$('#close_form').prop('disabled', false);
		}

	};

	pro.appendCloseButtonListener = function(player_id)
	{
		let close_form = $(pri.ids.close_form);
		let question_modal = $(pri.ids.modal);

		close_form.off('click');
		close_form.on('click', function () {
			question_modal.modal('hide');
			pro.removeQuestionLock();
		});

		question_modal.off('hidden.bs.modal');
		question_modal.on('hidden.bs.modal', function () {
			scope.InteractiveVideoPlayerAbstract.resumeVideo(player_id);
			pro.removeQuestionLock();
		})
	};

	pro.createButtonButtons = function(id, value, class_string, type) {
		if(typeof type === 'undefined' || type === null){
			type = 'submit';
		}
		return '<input id="' + id + '" class="btn btn-default btn-sm ' + class_string + '" value="' + value + '" '+ 'type="' + type + '">';
	};

	pro.showQuestionInteractionForm = function(comment_id, array, player) {
		pub.comment_id = comment_id;
		pub.QuestionObject = array;
		pub.QuestionObject.player = player
		pro.buildQuestionForm(comment_id, player);
		if(typeof player !== "string") {
			player = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);
		}
		if(il.InteractiveVideo[player].hasOwnProperty("player")
			&& il.InteractiveVideo[player].player !== undefined
			) {
			//il.InteractiveVideo[player].player.exitFullScreen();
			}

		let config = {};
		if(il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player).fixed_modal === "1" ||
				( pub.QuestionObject.compulsory_question === "1" && ! pub.QuestionObject.feedback )
		) {
			config = {backdrop: 'static', keyboard: false};
		}
		$(pri.ids.modal).modal(config, 'show');
	};

	pro.enableQuestionLock = function(){
		pri.locked = true;
	};

	pro.removeQuestionLock = function(){
		pri.locked = false;
	};

	pro.isQuestionLockEnabled = function(){
		return pri.locked === true;
	};

	pro.isQuestionLockDisabled = function(){
		return pri.locked === false;
	};

	pub.protect = pro;
	return pub;

}(il));
