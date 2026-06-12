InteractiveVideoQuestionCreator = (function () {
	'use strict';

	let pub = {}, pro = {};

	pro.appendMultiListener = function() {
		$('.text_field').on('blur', function (){
			let pos = parseInt($(this).attr('meta'), 10);
      if($(this).val() !== undefined) {
        IVQuestionCreator.JSON[pos].answer = $(this).val();
      }

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
					'value': value.answer,
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
			$('#il_prop_cont_show_comment_field').css("display","flex");
			if( $('#show_best_solution').is(':checked')){
				$('#subform_show_best_solution').show();
			}
			$('#il_prop_cont_limit_attempts').hide();
      il.InteractiveVideoEditor.createInstance("show_best_solution_text");
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
			$('#il_prop_cont_limit_attempts').show();
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

	pro.stripHtmlContent = function(html) {
		if (!html) {
			return '';
		}
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ').trim();
	};

	pro.getQuestionForm = function() {
		let form = $('input[name="cmd[insertQuestion]"], input[name="cmd[confirmUpdateQuestion]"]').closest('form');
		if (form.length === 0) {
			form = $('input[name="comment_title"]').closest('form');
		}
		return form;
	};

	pro.getTitleValue = function() {
		return $.trim(pro.getQuestionForm().find('input[name="comment_title"]').val() || '');
	};

	pro.getQuestionTextValue = function() {
		if (typeof il !== 'undefined' && il.InteractiveVideoEditor) {
			let editor = il.InteractiveVideoEditor.getEditorInstanceById('question_text');
			if (editor && typeof editor.getData === 'function') {
				return pro.stripHtmlContent(editor.getData());
			}
		}
		if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances.question_text) {
			return pro.stripHtmlContent(CKEDITOR.instances.question_text.getData());
		}
		let textarea = pro.getQuestionForm().find('textarea[name="question_text"]');
		if (textarea.length) {
			return pro.stripHtmlContent(textarea.val());
		}
		let editable = document.querySelector('#il_prop_cont_question_text .ck-editor__editable, #question_text + .ck-editor .ck-editor__editable');
		if (editable) {
			return pro.stripHtmlContent(editable.innerHTML);
		}
		return '';
	};

	pro.areMandatoryFieldsFilled = function() {
		return pro.getTitleValue() !== '' && pro.getQuestionTextValue() !== '';
	};

	pro.needsCorrectAnswerWarning = function() {
		return $('#question_type').val() !== '2' &&
			$('#neutral_type').val() !== '1' &&
			$('.correct_solution:checked').length === 0;
	};

	pub.Init = function () {
		if(IVQuestionCreator.JSON.length === 0 && IVQuestionCreator.type !== 2)
		{
			InteractiveVideoQuestionCreator.appendEmptyJSON();
		}
		let question_form = $('#addQuestion');
		$('#is_interactive').parent().parent().parent().parent().append(question_form);
		pro.createQuestionForm();
		pro.appendSingleListener();
		$('input[name="cmd[insertQuestion]"], input[name="cmd[confirmUpdateQuestion]"]')
			.off('click.questionCreatorValidation')
			.on('click.questionCreatorValidation', function (evt)
		{
			if (!pro.areMandatoryFieldsFilled()) {
				return;
			}
			if (!pro.needsCorrectAnswerWarning()) {
				return;
			}
			evt.preventDefault();
			evt.stopImmediatePropagation();
				if($('#ilInteractiveVideoAjaxModal').length >= 1 && $('#ilInteractiveVideoAjaxModal').is(':visible'))
				{
					if($('.alert_ex_modal').length == 0)
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
		});

		pro.showHideFormElementsForReflectionType();
	};

	pro.submitAnyway = function ()
	{
		$('#simple_question_warning').modal('hide');
		$('.alert_ex_modal').remove();
		$('input[name="cmd[insertQuestion]"], input[name="cmd[confirmUpdateQuestion]"]')
			.off('click.questionCreatorValidation');
		$('input[name="cmd[insertQuestion]"], input[name="cmd[confirmUpdateQuestion]"]').first().click();
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

	pub.registerCreator = function() {
		$('#addQuestion').show();
		InteractiveVideoQuestionCreator.Init();
		$('.question_type').val(IVQuestionCreator.type);
		InteractiveVideoQuestionCreator.protect.showHideFormElementsPointsForNeutralAnswers();
	}

	pub.protect = pro;
	return pub;

}());
