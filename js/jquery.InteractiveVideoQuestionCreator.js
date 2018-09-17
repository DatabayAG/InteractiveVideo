$( document ).ready(function() {
	InteractiveVideoQuestionCreator.Init();
});


var InteractiveVideoQuestionCreator = (function () {
	'use strict';

	var pub = {}, pro = {};

	pub.Init = function(){
		if (typeof IVQuestionCreator != "undefined") {
			$('#addQuestion').show();

			if(IVQuestionCreator.JSON.length === 0)
			{
				InteractiveVideoQuestionCreator.appendEmptyJSON();
			}
			InteractiveVideoQuestionCreator.buildForm();
			$('.question_type').val(IVQuestionCreator.type);

			pro.workAroundFileHelper();
		}
	};

	pro.workAroundFileHelper = function() {
		$('.btn-file :file').on('fileselect', function(event, numFiles, label) {
			console.log(event, numFiles, label)
			var input = $(this).parents('.input-group').find(':text');
			if( input.length ) {
				input.val(label);
			}
		});
	};

	pro.appendMultiListener = function() {
		$('.text_field').on('blur', function (){
			var pos = parseInt($(this).attr('meta'), 10);
			IVQuestionCreator.JSON[pos].answer = $(this).val();
		});

		$('.correct_solution').on('click', function (){
			var pos = parseInt($(this).attr('meta'), 10);
			var bool= 0;
			if($(this).prop('checked'))
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
			$('#il_prop_cont_show_response_frequency').hide();
			$('#il_prop_cont_neutral_type').hide();
			$('#il_prop_cont_show_comment_field').show();
		}
		else
		{
			$('#il_prop_cont_answer_text').show();
			$('#il_prop_cont_feedback_correct').show().prev('.ilFormHeader').show();
			$('#il_prop_cont_feedback_one_wrong').show();
			$('#il_prop_cont_show_response_frequency').show();
			$('#il_prop_cont_neutral_type').show();
			$('#il_prop_cont_show_comment_field').hide();
		}
	};

	pro.showHideFormElementsPointsForNeutralAnswers = function()
	{
		var value = parseInt($('#neutral_type').val(), 10);
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
			$('#answer_table').find('th').eq(1).hide();
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

	pro.checkIfAnswerConfigurationIsValid = function() {
		return 	$('#question_type').val() !== '2' && 
				$('#neutral_type').val()  !== '1' && 
				$('.correct_solution:checked').length === 0
	};

	pub.buildForm = function () {
		var question_form = $('#addQuestion');
		$('#is_interactive').parent().parent().parent().parent().append(question_form);
		pro.createQuestionForm();
		pro.appendSingleListener();
		$('input[name="cmd[insertQuestion]"]').on('click', function (evt)
		{
			if(pro.checkIfAnswerConfigurationIsValid())
			{
				evt.preventDefault();
				if($('#ilInteractiveVideoAjaxModal').size() >= 1)
				{
					if($('.alert_ex_modal').size() == 0)
					{
						var info = '<div class="alert_ex_modal alert alert-info" >' + 
									$('#simple_question_warning .alert.alert-info').html() + 
									'<br/>' + $('.question_warning_buttons').html() + '</div>';
						$('#ilInteractiveVideoAjaxModal .modal-body').prepend(info);
						$('#ilInteractiveVideoAjaxModal .modal-body').append(info);
						$('.question_cancel_saving').remove();
					}
				}
				else
				{
					$('#simple_question_warning').modal('show');
					
					$('.question_cancel_saving').on('click', function (evt)
					{
						$('#simple_question_warning').modal('hide');
					});
				}

				$('.question_save_anyway').on('click', function (evt)
				{
					pro.submitAnyway();
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
