var InteractiveVideoQuestionViewer = (function (scope) {
	'use strict';
	let pub = {},
		pro = {};

	pub.QuestionObject = {};

	pub.getQuestionPerAjax = function (comment_id, player) {
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);

		$.when(
				$.ajax({
					url:  player_data.question_get_url + '&comment_id=' + comment_id,
					type: 'GET', dataType: 'json'
				})
		).then(function (array) {
			pro.showQuestionInteractionForm(comment_id, array, player);
		});
	};

	pro.buildQuestionForm = function(player) {
		let modal = $('.modal-body');
		let type  = parseInt(pub.QuestionObject.type, 10);
		let img   = '';

		modal.html('');
		$('.modal-title').html(pub.QuestionObject.question_title);
		if(pub.QuestionObject.question_image)
		{
			img = '<div class="question_image_container"><img class="question_image" src="' + pub.QuestionObject.question_image+ '"/></div>';
		}
		modal.append(img + '<div class="question_center"><p>' + pub.QuestionObject.question_text + '</p></div>');
		if (type === 0) {
			pro.addAnswerPossibilities('radio');
			pro.addFeedbackDiv();
			pro.addButtons(player);
		}
		else if (type === 1){
			pro.addAnswerPossibilities('checkbox');
			pro.addFeedbackDiv();
			pro.addButtons(player);
		}
		else if (type === 2)
		{
			pro.addSelfReflectionLayout(player);
		}
		pro.showPreviousAnswer();
	};

	pro.showPreviousAnswer = function()
	{
		if(pub.QuestionObject.feedback !== undefined && pub.QuestionObject.previous_answer !== undefined)
		{
			$.each(pub.QuestionObject.previous_answer, function (l, value) {
				$('#answer_' + value).attr('checked', true);
			});
			if(pub.QuestionObject.type != 2)
			{
				pro.showFeedback(pub.QuestionObject.feedback);
			}
		}
		il.InteractiveVideoPlayerFunction.refreshMathJaxView();
	};

	pro.addAnswerPossibilities = function(input_type) {
		let html = '';

		html = '<form id="question_form">';
		$.each(pub.QuestionObject.answers, function (l, value) {
			html += pro.buildAnswerInputElement(input_type, value);
		});
		html += '<input name="qid" value ="' + pub.QuestionObject.question_id + '" type="hidden"/>';
		html += '<div id="question_buttons_bellow_form"></div>';
		html += '</form>';
		$('.modal-body').append(html);
	};

	pro.buildAnswerInputElement = function(input_type, value)
	{
		return  '<label for="answer_'   + value.answer_id + '">' +
			'<input' +
			' id="answer_' + value.answer_id + '" name="answer[]"' +
			' value="'      + value.answer_id + '"' +
			' type="'     + input_type + '">' +
			value.answer +
			'</label>' + 
			'<div class="progress rf_listener response_frequency_' + value.answer_id + ' ilNoDisplay"></div>' +
			'<br/>';
	};

	pro.addSelfReflectionLayout = function(player) {
		let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
		let player_id = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);

		$('.modal-body').append('<div class="modal_feedback"><div class="modal_reflection_footer">' + pro.createButtonButtons('close_form', scope.InteractiveVideo.lang.close_text) +'</div></div>');
		if(parseInt(pub.QuestionObject.reflection_question_comment, 10) === 1)
		{
			pro.appendSelfReflectionCommentForm(player_id);
		}

		pro.appendCloseButtonListener();
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
		let feedback = $('.modal_feedback');

		footer.prepend(pro.createButtonButtons('submit_comment_form', scope.InteractiveVideo.lang.save));
		footer.prepend('<input type="checkbox" name="is_private_modal" value="1" id="is_private_modal_"' + player_id + '/> ' + scope.InteractiveVideo.lang.private_text);
		feedback.prepend('<textarea id="'+comment_id+'">' + pub.QuestionObject.reply_to_txt + '</textarea>');
		if(pub.QuestionObject.reply_to_private == '1')
		{
			$('#is_private_modal_' + player_id).attr('checked', 'checked');
		}
		CKEDITOR.replace(comment_id);
		feedback.prepend(scope.InteractiveVideo.lang.add_comment);
		scope.InteractiveVideoPlayerFunction.addAjaxFunctionForReflectionCommentPosting(pub.comment_id, pub.QuestionObject.reply_original_id, player_id);
	};

	pro.addToLocalIgnoreArrayIfNonRepeatable = function(player_id){
		let payer_data = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player_id);
		let repeat = parseInt(InteractiveVideoQuestionViewer.QuestionObject.repeat_question, 10);

		if(repeat === 0)
		{
			payer_data.ignore_questions.push(pub.comment_id );
		}
	};

	pro.addFeedbackDiv = function() {
		$('#question_form').after('<div class="modal_feedback"></div>');
	};

	pro.addButtons = function(player) {
		let question_form = $('#question_buttons_bellow_form');

		question_form.append(pro.createButtonButtons('sendForm', scope.InteractiveVideo.lang.send_text));
		question_form.append(pro.createButtonButtons('close_form', scope.InteractiveVideo.lang.close_text));
		pro.appendButtonListener(player);
	};

	pro.showFeedback = function(feedback) {
		let modal = $('.modal_feedback');

		modal.html('');
		pro.showResponseFrequency(feedback.response_frequency);
		modal.html(feedback.html);
		if (parseInt(feedback.is_timed, 10) === 1) {
			modal.append('<div class="learning_recommendation"><br/>' + scope.InteractiveVideo.lang.learning_recommendation_text + ': ' + pro.createButtonButtons('jumpToTimeInVideo', scope.InteractiveVideo.lang.feedback_button_text + ' ' + mejs.Utility.secondsToTimeCode(feedback.time)) + '</div>');
			$('#jumpToTimeInVideo').on('click', function () {
				$('#ilQuestionModal').modal('hide');
				scope.InteractiveVideoPlayerAbstract.jumpToTimeInVideo(feedback.time);
			});
		}
		if(feedback.feedback_link !== undefined && feedback.feedback_link !== '')
		{
			modal.append('<div class="learning_recommendation_link">' + scope.InteractiveVideo.lang.more_information + ': <span class="feedback_link_more">' + '<img src="' + feedback.feedback_icon + '"/>' + feedback.feedback_link + '</span></div>');
		}
	};

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

	pro.appendButtonListener = function(player) {
		$('#question_form').on('submit', function (e) {
			let player_data = il.InteractiveVideoPlayerFunction.getPlayerDataObjectByPlayer(player);
			let player_id = il.InteractiveVideoPlayerFunction.getPlayerIdFromPlayerObject(player);

			e.preventDefault();
			$.ajax({
				type:    "POST",
				cache:   false,
				url:     player_data.question_post_url,
				data:    $(this).serialize(),
				success: function (feedback) {
					let obj = JSON.parse(feedback);
					pro.showFeedback(obj);
					pro.addToLocalIgnoreArrayIfNonRepeatable(player_id);
				}
			});
		});
		pro.appendCloseButtonListener(player);
	};

	pro.appendCloseButtonListener = function(player)
	{
		$('#close_form').on('click', function () {
			$('#ilQuestionModal').modal('hide');
			scope.InteractiveVideoPlayerAbstract.resumeVideo(player);
		});
	};

	pro.createButtonButtons = function(id, value) {
		return '<input id="' + id + '" class="btn btn-default btn-sm" value="' + value + '" '+ 'type="submit">';
	};

	pro.showQuestionInteractionForm = function(comment_id, array, player) {
		pub.comment_id = comment_id;
		pub.QuestionObject = array;
		pub.QuestionObject.player = player;
		pro.buildQuestionForm(player);
		if (pub.QuestionObject.player.isFullScreen === true) {
			pub.QuestionObject.player.exitFullScreen();
		}
		$('#ilQuestionModal').modal('show');
	};

	pub.protect = pro;
	return pub;

}(il));
