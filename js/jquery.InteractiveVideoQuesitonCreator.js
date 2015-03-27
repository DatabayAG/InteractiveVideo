var IVQuestionCreator = {
	JSON : [
			{answer :'Answer 1', correct: true},
			{answer :'Answer 2', correct: false},
			{answer :'Answer 3', correct: true},
			{answer :'Answer 4', correct: false}
		   ],
	type : 'single_choice'
};

$.fn.initQuestionEditor = function() {
	var question_form = $('#addQuestion');
	$('#is_interactive').parent().parent().append(question_form);	
	$().addClickListenerForCheckbox();
	$().createQuestionForm();
};

$.fn.addClickListenerForCheckbox = function() {
	$('#is_interactive').click(function(){
		$('#addQuestion').slideToggle();
	});
	if(IVQuestionCreator.JSON.length === 0)
	{
		$('#addQuestion').hide();
	}
};

$.fn.createQuestionForm = function() {
	var prototype 	= $('#inner_question_editor_prototype');
	var table		= $('#table_body_question_editor'); 
	var inner		= '';
	table.html('');
	$.each(IVQuestionCreator.JSON, function(l,value){
		prototype.clone().attr({id: 'inner_' + l }).appendTo(table);
		inner = $('#inner_' + l);
		inner.find('.text_field').attr(
			{
				'value': value.answer,
				'name' : 'answer[' + l + ']',
				'meta' : l
			}
		);
		inner.find('.correct_solution').attr(
			{
				'name' : 'correct[' + l + ']',
				'meta' : l
			}
		);
		if(value.correct === true )
		{
			inner.find('.correct_solution').attr('checked' , 'checked');
		}
		inner.find('.clone_fields_add').parent().attr('meta', l);
	});
};

$('.text_field').live('blur', function (){
		var pos = parseInt($(this).attr('meta'), 10)
		IVQuestionCreator.JSON[pos].answer = $(this).val();
});
$('.correct_solution').live('click', function (){
	var pos = parseInt($(this).attr('meta'), 10)
	var bool= false;
	if($(this).attr('checked'))
	{
		bool = true;
	}
	IVQuestionCreator.JSON[pos].correct = bool;
	console.log(pos,$(this).val())
});
$('.clone_fields_add').live('click', function ()
{
	var insert = new Object({
		answer  : '',
		correct: false
	});
	IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 0, insert);
	$().createQuestionForm();
	return false;
});

$('.clone_fields_remove').live('click', function ()
{
	IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 1);
	$().createQuestionForm();
	return false;
});

$( document ).ready(function() {
	$().initQuestionEditor();
});
