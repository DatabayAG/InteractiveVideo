var InteractiveVideoQuestionViewer = (function () {
	var pub = {};
	//Private method
	function buildQuestionForm() {
		var modal = $('.modal-body');
		var type  = parseInt(pub.QuestionObject.type, 10);
		modal.html('');
		modal.append('<h2>' + pub.QuestionObject.question_title + '</h2>');
		modal.append('<p>' + pub.QuestionObject.question_text + '</p>');
		if (type === 0) {
			addAnswerPossibilities('radio');
			addFeedbackDiv();
			addButtons();
		}
		else if (type === 1){
			addAnswerPossibilities('checkbox');
			addFeedbackDiv();
			addButtons();
		}
		else if (type === 2)
		{
			addSelfReflectionLayout();
		}
		showPreviousAnswer();
	}

	function showPreviousAnswer()
	{
		if(pub.QuestionObject.feedback !== undefined && pub.QuestionObject.previous_answer !== undefined)
		{
			$.each(pub.QuestionObject.previous_answer, function (l, value) {
				$('#answer_' + value).attr('checked', true);
			});
			if(pub.QuestionObject.type != 2)
			{
				showFeedback(pub.QuestionObject.feedback);
			}
		}
	}
	
	function addAnswerPossibilities(input_type) {
		var html = '';
		html = '<form id="question_form">';
		$.each(pub.QuestionObject.answers, function (l, value) {
			html += buildAnswerInputElement(input_type, value);
		});
		html += '<input type="hidden" name="qid" value ="' + pub.QuestionObject.question_id + '"/>';
		html += '</form>';
		$('.modal-body').append(html);
	}
	
	function buildAnswerInputElement(input_type, value)
	{
		return  '<label for="answer_'   + value.answer_id + '">' +
					'<input type="'     + input_type + 
						'" id="answer_' + value.answer_id + '" name="answer[]" ' +
						' value="'      + value.answer_id + '">' +
										  value.answer + 
				'</label><br/>';
	}

	function addSelfReflectionLayout() {
		$('.modal-body').append('<div class="modal_feedback">' + createButtonButtons('close_form', close_text) +'</div>');
		appendCloseButtonListener();
		$.ajax({
			type:    "POST",
			cache:   false,
			url:     question_post_url,
			data:    {'qid' : pub.QuestionObject.question_id},
			success: function () {
				addToLocalIgnoreArrayIfNonRepeatable();
			}
		});
	}
	
	function addToLocalIgnoreArrayIfNonRepeatable(){
		var non_repeat = parseInt(InteractiveVideoQuestionViewer.QuestionObject.repeat_question, 10);
		if(non_repeat === 0)
		{
			ignore_questions.push(pub.comment_id );
		}
	}
	
	function addFeedbackDiv() {
		$('#question_form').append('<div class="modal_feedback"></div>');
	}
	
	function addButtons() {
		var question_form = $('#question_form');
		question_form.append(createButtonButtons('sendForm', send_text));
		question_form.append(createButtonButtons('close_form', close_text));
		appendButtonListener();
	}

	function showFeedback(feedback) {
		var modal = $('.modal_feedback');
		modal.html('');
		modal.html(feedback.html);
		if (feedback.is_timed == 1) {
			modal.append('<div class="align_button">' + createButtonButtons('jumpToTimeInVideo', feedback_button_text) + '</div>');
			$('#jumpToTimeInVideo').on('click', function (e) {
				$('#ilQuestionModal').modal('hide');
				$().jumpToTimeInVideo(feedback.time);
			});
		}
	}

	function appendButtonListener() {
		$('#question_form').on('submit', function (e) {
			e.preventDefault();
			$().debugPrinter('pub.QuestionObject Ajax', $(this).serialize());
			$.ajax({
				type:    "POST",
				cache:   false,
				url:     question_post_url,
				data:    $(this).serialize(),
				success: function (feedback) {
					var obj = JSON.parse(feedback);
					showFeedback(obj);
					addToLocalIgnoreArrayIfNonRepeatable();
					//todo check question object and add to ignore if only once
				}
			});
		});
		appendCloseButtonListener();
	}
	
	function appendCloseButtonListener()
	{
		$('#close_form').on('click', function (e) {
			$('#ilQuestionModal').modal('hide');
			$().resumeVideo();
		});
	}
	
	function createButtonButtons(id, value) {
		return '<input id="' + id + '" class="btn btn-default btn-sm" type="submit" value="' + value + '">';
	}

	//Public property
	pub.QuestionObject = {};

	//Public method
	pub.getQuestionPerAjax = function (comment_id, player) {
		$.when(
			$.ajax({
				url:  question_get_url + '&comment_id=' + comment_id,
				type: 'GET', dataType: 'json'
			})
		).then(function (array) {
				//Todo get answerd state of question also if question can be answered multiple times 
				pub.comment_id            = comment_id;
				pub.QuestionObject        = array;
				pub.QuestionObject.player = player;
				buildQuestionForm();
				if (pub.QuestionObject.player.isFullScreen === true) {
					pub.QuestionObject.player.exitFullScreen();
				}
				$('#ilQuestionModal').modal('show');
			});
	};

	//Return just the public parts
	return pub;

}());
