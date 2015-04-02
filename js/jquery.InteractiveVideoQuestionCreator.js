$( document ).ready(function() {

	if($('#is_interactive').attr('checked') == 'checked'){
		$().initQuestionEditor();
		$().createQuestionForm();
		$('#addQuestion').show();
	}
	else{
		$('#addQuestion').hide();
	}
	
	$().initQuestionEditor();
	$().appendSingleListener();
	$('.question_type').val(IVQuestionCreator.type);
});

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
		$().appendEmptyJSON();
	}
};

$.fn.appendEmptyJSON = function() {
	IVQuestionCreator.JSON = 
				 [{'answer' 	: '',
				  	'correct'	: 0,
					'answer_id'	: 0
		          }];
	IVQuestionCreator.type = 0;
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
		if(parseInt(value.correct,10) === 1 )
		{
			inner.find('.correct_solution').attr('checked' , 'checked');
		}
		inner.find('.clone_fields_add').parent().attr('meta', l);
	});

	$().appendMultiListener();
};

$.fn.appendSingleListener = function() {
	$('.question_type').on('change', function (){
		IVQuestionCreator.type = parseInt($(this).val(),10);
	});
};

$.fn.appendMultiListener = function() {
	$('.text_field').on('blur', function (){
		var pos = parseInt($(this).attr('meta'), 10)
		IVQuestionCreator.JSON[pos].answer = $(this).val();
	});

	$('.correct_solution').on('click', function (){
		var pos = parseInt($(this).attr('meta'), 10)
		var bool= false;
		if($(this).attr('checked'))
		{
			bool = true;
		}
		IVQuestionCreator.JSON[pos].correct = bool;
	});
	$('.clone_fields_add').on('click', function ()
	{
		var insert = new Object({
			answer  : '',
			correct: false
		});
		IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 0, insert);
		$().createQuestionForm();
		return false;
	});
	$('.clone_fields_remove').on('click', function ()
	{
		IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 1);
		$().createQuestionForm();
		return false;
	});
};