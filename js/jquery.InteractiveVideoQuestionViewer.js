var IVQV = {};
$( document ).ready(function() {
	
});

$.fn.getQuestionPerAjax = function(comment_id) {
	$.when(
		$.ajax({url: question_get_url + '&comment_id=' + comment_id,
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

$.fn.addButtons = function() {
	$('#question_form').append('<input id="sendForm" class="btn btn-default btn-sm" type="submit" value="Save">');
	$().appendButtonListener();
};

$.fn.appendButtonListener = function() {
	$('#question_form').on('submit',function(e){
		e.preventDefault();
		console.log($(this).serialize())
		$.ajax({
			type     : "POST",
			cache    : false,
			url      : question_post_url,
			data     : $(this).serialize(),
			success  : function(data) {
				console.log(data)
				$('#ilQuestionModal').modal('hide');
				//$(".printArea").empty().append(data).css('visibility','visible');
			}
		});
	});
};