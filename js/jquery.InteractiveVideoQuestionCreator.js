$( document ).ready(function() {

	$('#addQuestion').show();

	if(IVQuestionCreator.JSON.length === 0)
	{
		InteractiveVideoQuestionCreator.appendEmptyJSON();
	}
	InteractiveVideoQuestionCreator.Init();
	$('.question_type').val(IVQuestionCreator.type);
});


var InteractiveVideoQuestionCreator = (function () {
	var pub = {}, pro = {};

	pro.appendMultiListener = function() {
		$('.text_field').on('blur', function (){
			var pos = parseInt($(this).attr('meta'), 10);
			IVQuestionCreator.JSON[pos].answer = $(this).val();
		});

		$('.correct_solution').on('click', function (){
			var pos = parseInt($(this).attr('meta'), 10);
			var bool= 0;
			if($(this).attr('checked'))
			{
				bool = 1;
			}
			IVQuestionCreator.JSON[pos].correct = bool;
		});
		$('.clone_fields_add').on('click', function ()
		{
			var insert = new Object({
				answer  : '',
				correct: 0
			});
			IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 0, insert);
			pro.createQuestionForm();
			return false;
		});
		$('.clone_fields_remove').on('click', function ()
		{
			if(IVQuestionCreator.JSON.length > 1)
			{
				IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10), 1);
				pro.createQuestionForm();
			}
			return false;
		});
		pro.showHideFormElementsForReflectionType();
	};

	pro.createQuestionForm = function() {
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
					'meta' : l,
					'class':'checkbox correct_solution'
				}
			);
			if(parseInt(value.correct,10) === 1 )
			{
				inner.find('.correct_solution').attr('checked' , 'checked');
			}
			inner.find('.clone_fields_add').parent().attr('meta', l);
		});
		pro.appendMultiListener();
	};

	pro.showHideFormElementsForReflectionType = function()
	{
		if( IVQuestionCreator.type == 2)
		{
			$('#il_prop_cont_answer_text').hide();
			$('#il_prop_cont_feedback_correct').hide().prev('.ilFormHeader').hide();
			$('#il_prop_cont_feedback_one_wrong').hide();
		}
		else
		{
			$('#il_prop_cont_answer_text').show();
			$('#il_prop_cont_feedback_correct').show().prev('.ilFormHeader').show();
			$('#il_prop_cont_feedback_one_wrong').show();
		}
	};

	pro.appendSingleListener = function() {
		$('#question_type').on('change', function (){
			IVQuestionCreator.type = parseInt($(this).val(),10);
			pro.showHideFormElementsForReflectionType();
		});
	};

	pub.Init = function () {
		var question_form = $('#addQuestion');
		$('#is_interactive').parent().parent().parent().parent().append(question_form);
		pro.createQuestionForm();
		pro.appendSingleListener();
	};

	pub.appendEmptyJSON = function () {
		IVQuestionCreator.JSON =
			[{
				'answer' 	: '',
				'correct'	: 0,
				'answer_id': 0
			}];
		IVQuestionCreator.type = 0;
	};

	pub.protect = pro;
	return pub;

}());
