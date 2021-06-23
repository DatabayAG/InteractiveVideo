InteractiveVideoQuestionCreator = (function () {
	'use strict';

	let pub = {}, pro = {};

	pro.appendMultiListener = function() {
		$('.text_field').on('blur', function (){
			let pos = parseInt($(this).attr('meta'), 10);
			IVQuestionCreator.JSON[pos].answer = $(this).val();
		});
		$('#show_best_solution').on('click', function (){
			pro.showHideFormElementsForReflectionType();
		});
		$('.correct_solution').on('click', function (){
			let pos = parseInt($(this).attr('meta'), 10);
			let bool= 0;
			if($(this).is(':checked'))
			{
				bool = 1;
			}
			IVQuestionCreator.JSON[pos].correct = bool;
		});
		$('.clone_fields_add').on('click', function ()
		{
			let insert = new Object({
				answer  : '',
				correct: 0
			});
			IVQuestionCreator.JSON.splice(parseInt($(this).parent().attr('meta'), 10) + 1, 0, insert);
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
		pro.showHideFormElementsPointsForNeutralAnswers();
	};

	pro.createQuestionForm = function() {
		let prototype 	= $('#inner_question_editor_prototype');
		let table		= $('#table_body_question_editor');
		let inner		= '';
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
			$('#il_prop_cont_show_response_frequency').hide();
			$('#il_prop_cont_neutral_type').hide();
			$('#il_prop_cont_show_comment_field').show();
			if( $('#show_best_solution').is(':checked')){
				$('#subform_show_best_solution').show();
			}
		}
		else
		{
			$('#il_prop_cont_answer_text').show();
			$('#il_prop_cont_feedback_correct').show().prev('.ilFormHeader').show();
			$('#il_prop_cont_feedback_one_wrong').show();
			$('#il_prop_cont_show_response_frequency').show();
			$('#il_prop_cont_neutral_type').show();
			$('#il_prop_cont_show_comment_field').hide();
			$('#subform_show_best_solution').hide();
		}
	};

	pro.showHideFormElementsPointsForNeutralAnswers = function()
	{
		var value = parseInt($('#neutral_type').val(), 10);
		if(IVQuestionCreator.type !== 2){
			if( value === 0)
			{
				$('label[for="feedback_correct"]').html(IVQuestionCreator.lang.correct.label_feedback);
				$('label[for="is_jump_correct"]').html(IVQuestionCreator.lang.correct.label_jump);
				$('#il_prop_cont_is_jump_correct .help-block').html(IVQuestionCreator.lang.correct.label_jump_info);
				$('label[for="feedback_correct_obj"]').html(IVQuestionCreator.lang.correct.label_repository);
				$('#il_prop_cont_feedback_correct_obj .help-block').html(IVQuestionCreator.lang.correct.label_repository_info);
				$('.correct_solution').show();
				$('#il_prop_cont_show_correct_icon').show();
				$('#il_prop_cont_feedback_one_wrong').show();
				$('#il_prop_cont_show_best_solution').show();
				$('#answer_table').find('th').eq(1).show();
			}
			else
			{
				$('label[for="feedback_correct"]').html(IVQuestionCreator.lang.neutral.label_feedback);
				$('label[for="is_jump_correct"]').html(IVQuestionCreator.lang.neutral.label_jump);
				$('#il_prop_cont_is_jump_correct .help-block').html(IVQuestionCreator.lang.neutral.label_jump_info);
				$('label[for="feedback_correct_obj"]').html(IVQuestionCreator.lang.neutral.label_repository);
				$('#il_prop_cont_feedback_correct_obj .help-block').html(IVQuestionCreator.lang.neutral.label_repository_info);

				$('.correct_solution').hide();
				$('#il_prop_cont_feedback_one_wrong').hide();
				$('#il_prop_cont_show_correct_icon').hide();
				$('#il_prop_cont_show_best_solution').hide();
				$('#answer_table').find('th').eq(1).hide();
			}
		}
	};

	pro.appendSingleListener = function() {
		$('#question_type').on('change', function (){
			IVQuestionCreator.type = parseInt($(this).val(),10);
			pro.showHideFormElementsForReflectionType();
		});

		$('#neutral_type').on('change', function ()
		{
			pro.showHideFormElementsPointsForNeutralAnswers();
		});
	};

	pub.Init = function () {
		let question_form = $('#addQuestion');
		$('#is_interactive').parent().parent().parent().parent().append(question_form);
		pro.createQuestionForm();
		pro.appendSingleListener();
		$('input[name="cmd[insertQuestion]"], input[name="cmd[confirmUpdateQuestion]"]').on('click', function (evt)
		{
			if($('#question_type').val() != 2 && $('#neutral_type').val() != 1 && $('.correct_solution:checked').length == 0)
			{
				evt.preventDefault();
				$('#simple_question_warning').modal('show');
				$('.question_save_anyway').on('click', function (evt)
				{
					pro.submitAnyway();
				});				
				$('.question_cancel_saving').on('click', function (evt)
				{
					$('#simple_question_warning').modal('hide');
				});
			}
		});

		pro.showHideFormElementsForReflectionType();
	};

	pro.submitAnyway = function () 
	{
		$('#simple_question_warning').modal('hide');
		$( 'input[name="cmd[insertQuestion]"]' ).off('click');
		$( 'input[name="cmd[insertQuestion]"]' ).click();
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

$( document ).ready(function() {

	$('#addQuestion').show();

	if(IVQuestionCreator.JSON.length === 0)
	{
		InteractiveVideoQuestionCreator.appendEmptyJSON();
	}
	InteractiveVideoQuestionCreator.Init();
	$('.question_type').val(IVQuestionCreator.type);
	InteractiveVideoQuestionCreator.protect.showHideFormElementsPointsForNeutralAnswers();
});
