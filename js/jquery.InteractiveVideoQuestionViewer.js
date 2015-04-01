var IVQV = {};
$( document ).ready(function() {
	
});

$.fn.getQuestionPerAjax = function(comment_id) {
	$.when(
		$.ajax({url: question_url + '&comment_id=' + comment_id,
				type: 'GET', dataType: 'json'})
		).then(function (array) {
			IVQV = array;
			$().buildQuestionForm();
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
	$().addButtons();
};

$.fn.addAnswerPossibilities = function(input_type) {
	var html = '';
	$.each(IVQV.answers, function(l,value){
		html += '<label for="answer_' + value.answer_id + '">' +
				'<input type="' + input_type + '" id="answer_' + value.answer_id + '" name="answer" value="' + value.answer + '">' +
				 value.answer + '</label><br/>';		
	});
	$('.modal-body').append(html);
};

$.fn.addButtons = function() {
	$('.modal-body').append('<input id="sendForm" class="btn btn-default btn-sm" type="submit" value="Save">');
};