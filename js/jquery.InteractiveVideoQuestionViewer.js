var IVQV = {};

$.fn.getQuestionPerAjax = function(comment_id, player) {
	$.when(
		$.ajax({url: question_get_url + '&comment_id=' + comment_id,
				type: 'GET', dataType: 'json'})
		).then(function (array) {
			IVQV = array;
			IVQV.player = player;
			$().buildQuestionForm();
			if(IVQV.player.isFullScreen === true)
			{
				IVQV.player.exitFullScreen();
			}
			$('#ilQuestionModal').modal('show');
		});
};

$.fn.buildQuestionForm = function() {
	var modal = $('.modal-body');
	modal.html('');
	modal.append('<p>' + IVQV.question_text + '</p>');
	if(parseInt(IVQV.type, 10) === 0)
	{
		$().addAnswerPossibilities('radio');
	}
	else
	{
		$().addAnswerPossibilities('checkbox');
	}
	$().addFeedbackDiv();
	$().addButtons();
};

$.fn.addAnswerPossibilities = function(input_type) {
	var html 	= '';
	html		= '<form id="question_form">';
	$.each(IVQV.answers, function(l,value){
		html += '<label for="answer_' + value.answer_id + '">' +
				'<input type="' + input_type + '" id="answer_' + value.answer_id + '" name="answer[]" value="' + value.answer_id + '">' +
				 value.answer + '</label><br/>';		
	});
	html		+= '<input type="hidden" name="qid" value ="' + IVQV.question_id + '"/>';
	html 		+= '</form>';
	$('.modal-body').append(html);
};

$.fn.addFeedbackDiv = function() {
	$('#question_form').append('<div class="modal_feedback"></div>');
};

$.fn.addButtons = function() {
	$('#question_form').append('<input id="sendForm" class="btn btn-default btn-sm" type="submit" value="Save">');
	$().appendButtonListener();
};

$.fn.showFeedback = function(feedback) {
	var modal = $('.modal_feedback');
	modal.html('');
	modal.html(feedback);
};

$.fn.appendButtonListener = function() {
	$('#question_form').on('submit',function(e){
		e.preventDefault();
		$().debugPrinter('IVQV Ajax', $(this).serialize());
		$.ajax({
			type     : "POST",
			cache    : false,
			url      : question_post_url,
			data     : $(this).serialize(),
			success  : function(data) {
				//$('#ilQuestionModal').modal('hide');
				 $().showFeedback(data);
				//IVQV.player.play();
			}
		});
	});
};