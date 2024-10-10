<?php

class SimpleChoiceQuestionFormEditGUI
{
	/**
	 * @var ilInteractiveVideoPlugin
	 */
	protected $plugin;

	/**
	 * @var ilCtrl $ctrl
	 */
	protected $ctrl;

	/**
	 * @var ilLanguage $lng
	 */
	protected $lng;

	/**
	 * @var 
	 */
	protected $object;

	/**
	 * ilSimpleChoiceQuestionFormEditGUI constructor.
	 * @param ilInteractiveVideoPlugin|ilPlugin $plugin
	 * @param ilObjInteractiveVideo    $object
	 */
	public function __construct(ilInteractiveVideoPlugin $plugin, ilObjInteractiveVideo $object)
	{
		/**
		 * @var ilCtrl $ctrl
		 * @var ilLanguage $lng
		 */
		global $ilCtrl, $lng;
		
		$this->ctrl   = $ilCtrl;
		$this->lng    = $lng;
		$this->plugin = $plugin;
		$this->object = $object;
	}

    /**
	 * @param bool $ajax
	 * @throws ilCtrlException
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 */
	public function initQuestionForm(bool $ajax = false): \ilPropertyFormGUI
	{
	    global $tpl;
        $plugin = ilInteractiveVideoPlugin::getInstance();

        $tpl->addJavaScript($plugin->getDirectory() .  '/libs/npm/node_modules/bootstrap-timepicker/js/bootstrap-timepicker.min.js');
        $tpl->addJavaScript($plugin->getDirectory() . '/js/InteractiveVideoQuestionCreator.js');
        $tpl->addCss($plugin->getDirectory() . '/templates/default/xvid.css');
        $tpl->addCss($plugin->getDirectory() . '/libs/npm/node_modules/bootstrap-timepicker/css/bootstrap-timepicker.css');
	    $tpl->addOnLoadCode('InteractiveVideoQuestionCreator.registerCreator();');
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction(new ilObjInteractiveVideoGUI(), 'insertQuestion'));
		$this->appendGeneralSettingsToQuestionForm($form, $plugin, $ajax);

		$this->appendQuestionSettingsToQuestionForm($form);

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('feedback'));
		$form->addItem($section_header);
		$this->appendCorrectFeedbackToQuestionForm($form);
		$this->appendFeedbackWrongToQuestionForm($form);

		$show_response_frequency = new ilCheckboxInputGUI($this->plugin->txt('show_response_frequency'), 'show_response_frequency');
		$show_response_frequency->setInfo($this->plugin->txt('show_response_frequency_info'));
		$form->addItem($show_response_frequency);

		$show_comment_field = new ilCheckboxInputGUI($this->plugin->txt('show_comment_field'), 'show_comment_field');
		$show_comment_field->setInfo($this->plugin->txt('show_comment_field_info'));
		$form->addItem($show_comment_field);

		$this->appendHiddenQuestionFormValues($form);

		$this->appendWarningModalToQuestionForm($form);

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @param bool              $ajax
	 */
	protected function appendGeneralSettingsToQuestionForm(ilPropertyFormGUI $form, $plugin, bool $ajax = false): void
	{
		if(!$ajax)
		{
			$form->setTitle($this->plugin->txt('insert_question'));
		}

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		$title->setInfo($this->plugin->txt('comment_title_info'));
		$title->setRequired(true);
		$form->addItem($title);

		$time = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'comment_time');

		if(isset($_POST['comment_time']))
		{
			$seconds = $_POST['comment_time'];
			$time->setValueByArray(['comment_time' => $seconds]);
		}


		$form->addItem($time);

		$repeat_question = new ilCheckboxInputGUI($this->plugin->txt('repeat_question'), 'repeat_question');
		$repeat_question->setInfo($this->plugin->txt('repeat_question_info'));
		$repeat_question->setChecked(true);
		$form->addItem($repeat_question);

		$limit_attempts = new ilCheckboxInputGUI($this->plugin->txt('limit_attempts'), 'limit_attempts');
		$limit_attempts->setInfo($this->plugin->txt('limit_attempts_info'));
		$form->addItem($limit_attempts);

        $compulsory_question = new ilCheckboxInputGUI($plugin->txt('compulsory_question'), 'compulsory_question');
        $compulsory_question->setInfo($plugin->txt('compulsory_question_info'));
        $form->addItem($compulsory_question);

        $show_best_solution = new ilCheckboxInputGUI($plugin->txt('show_best_solution'), 'show_best_solution');
        $show_best_solution->setInfo($plugin->txt('show_best_solution_info'));

        $show_best_solution_text = xvidUtils::constructTextAreaFormElement('best_solution_text', 'show_best_solution_text');
        $show_best_solution_text->setInfo($plugin->txt('best_solution_text_info'));
        $show_best_solution->addSubItem($show_best_solution_text);

        $form->addItem($show_best_solution);

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('question'));
		$form->addItem($section_header);
	}

    /**
     * @param ilPropertyFormGUI $form
     * @throws ilDatabaseException
     * @throws ilObjectNotFoundException
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     * @throws ilWACException
     */
	protected function appendQuestionSettingsToQuestionForm(ilPropertyFormGUI $form): void
	{
		$question_type = new ilSelectInputGUI($this->plugin->txt('question_type'), 'question_type');
		$type_options  = [
			0 => $this->plugin->txt('single_choice'),
			1 => $this->plugin->txt('multiple_choice'),
			2 => $this->plugin->txt('reflection')
        ];
		$question_type->setOptions($type_options);
		$question_type->setInfo($this->plugin->txt('question_type_info'));
		$form->addItem($question_type);

		$question_text = xvidUtils::constructTextAreaFormElement('question_text', 'question_text');
		$question_text->setRequired(true);
		$form->addItem($question_text);

		$this->appendImageUploadForm($this->plugin, $form);

		$neutral_type         = new ilSelectInputGUI($this->plugin->txt('neutral_type'), 'neutral_type');
		$neutral_type_options = [
			0 => $this->plugin->txt('with_correct'),
			1 => $this->plugin->txt('neutral')
        ];
		$neutral_type->setOptions($neutral_type_options);
		$neutral_type->setInfo($this->plugin->txt('neutral_type_info'));
		$form->addItem($neutral_type);

		$answer = new ilCustomInputGUI($this->lng->txt('answers'), 'answer_text');

		$answer->setHtml($this->getInteractiveForm());
		$form->addItem($answer);
	}

	/**
	 * @param ilInteractiveVideoPlugin $plugin
	 * @param ilPropertyFormGUI        $form
	 */
	protected function appendImageUploadForm(ilInteractiveVideoPlugin $plugin, ilPropertyFormGUI $form): void
	{
        global $DIC;

        $comment_id_post = $DIC->http()->wrapper()->post()->has('comment_id');
        if($comment_id_post) {
            $comment_id_post = $DIC->http()->wrapper()->post()->retrieve('comment_id', $DIC->refinery()->kindlyTo()->string());
            if($comment_id_post !== '') {
                $comment_id_post = (int) $comment_id_post;
            }
        }
        $comment_id_get = $DIC->http()->wrapper()->query()->has('comment_id');
        if($comment_id_get) {
            $comment_id_get = $DIC->http()->wrapper()->query()->retrieve('comment_id', $DIC->refinery()->kindlyTo()->int());
        }
		$image_upload  = new ilInteractiveVideoPreviewPicker($plugin->txt('question_image'), 'question_image');
		if($comment_id_post || $comment_id_get)
		{
            if(is_int($comment_id_post)) {
                $comment_id = $comment_id_post;
            } elseif(is_int($comment_id_get)) {
                $comment_id = $comment_id_get;
            }
			if($comment_id != 0)
			{
				$question_data = $this->object->getQuestionDataById($comment_id);
				if(array_key_exists('question_data', $question_data))
				{
                    if($question_data['question_data'] != null && array_key_exists('question_image', $question_data['question_data'])){
                        if( $question_data['question_data']['question_image'] !== null) {
                            $image_upload->setValue($question_data['question_data']['question_image']);
                            $image_upload->setImage($question_data['question_data']['question_image']);
                        }
                    }
				}
			}
		}
		$factory = new ilInteractiveVideoSourceFactory();
		$source = $factory->getVideoSourceObject($this->object->getSourceId());
		if($source->isFileBased())
		{
			$image_upload->setPathToVideo($source->getPath($this->object->getId()));
		}
		else
		{
			$image_upload->setCanExtractImages(false);
		}

		$form->addItem($image_upload);
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	protected function appendCorrectFeedbackToQuestionForm(ilPropertyFormGUI $form): void
	{
		$feedback_correct  = xvidUtils::constructTextAreaFormElement('feedback_correct', 'feedback_correct');
		$show_correct_icon = new ilCheckboxInputGUI($this->plugin->txt('show_correct_icon'), 'show_correct_icon');
		$show_correct_icon->setInfo($this->plugin->txt('show_correct_icon_info'));
		$show_correct_icon->setChecked(true);

		$feedback_correct->addSubItem($show_correct_icon);
		$is_jump_correct = new ilCheckboxInputGUI($this->plugin->txt('is_jump_correct'), 'is_jump_correct');
		$is_jump_correct->setInfo($this->plugin->txt('is_jump_correct_info'));

		$jump_correct_ts = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'jump_correct_ts');

		if(isset($_POST['jump_correct_ts']))
		{
			$seconds = $_POST['jump_correct_ts'];
			$jump_correct_ts->setValueByArray(['jump_correct_ts' => (int)$seconds]);
		}
		$is_jump_correct->addSubItem($jump_correct_ts);
		$feedback_correct->addSubItem($is_jump_correct);
		//$this->appendRepositorySelector($feedback_correct, 'feedback_correct_obj');
		$form->addItem($feedback_correct);
	}

    /**
     * @param ilPropertyFormGUI $form
     * @throws ilCtrlException
     */
	protected function appendFeedbackWrongToQuestionForm(ilPropertyFormGUI $form): void
	{
		$feedback_one_wrong = xvidUtils::constructTextAreaFormElement('feedback_one_wrong', 'feedback_one_wrong');
		$show_wrong_icon    = new ilCheckboxInputGUI($this->plugin->txt('show_wrong_icon'), 'show_wrong_icon');
		$show_wrong_icon->setInfo($this->plugin->txt('show_wrong_icon_info'));
		$show_wrong_icon->setChecked(true);

		$feedback_one_wrong->addSubItem($show_wrong_icon);

		$is_jump_wrong = new ilCheckboxInputGUI($this->plugin->txt('is_jump_wrong'), 'is_jump_wrong');
		$is_jump_wrong->setInfo($this->plugin->txt('is_jump_wrong_info'));
		$jump_wrong_ts = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'jump_wrong_ts');

		if(isset($_POST['jump_wrong_ts']))
		{
			$seconds = $_POST['jump_wrong_ts'];
			$jump_wrong_ts->setValueByArray(['jump_correct_ts' => (int)$seconds]);
		}
		$is_jump_wrong->addSubItem($jump_wrong_ts);
		$feedback_one_wrong->addSubItem($is_jump_wrong);
		$this->appendRepositorySelector($feedback_one_wrong, 'feedback_wrong_obj');
		$form->addItem($feedback_one_wrong);
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	protected function appendHiddenQuestionFormValues(ilPropertyFormGUI $form): void
	{
		$is_interactive = new ilHiddenInputGUI('is_interactive');
		$is_interactive->setValue(1);
		$form->addItem($is_interactive);

		$comment_text = new ilHiddenInputGUI('comment_text');
		$comment_text->setValue('dummy text');
		$form->addItem($comment_text);

		$comment_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($comment_id);
	}

    /**
     * @param ilPropertyFormGUI $form
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	protected function appendWarningModalToQuestionForm(ilPropertyFormGUI $form): void
	{
		//Todo: what to do with the modal?
		$modal = ilModalGUI::getInstance();
		$modal->setId('simple_question_warning');
		$modal->setType(ilModalGUI::TYPE_MEDIUM);
		$modal->setHeading($this->plugin->txt('save_without_correct'));
		$warning_dialog = new ilTemplate("tpl.question_edit_modal.html", true, true, $this->plugin->getDirectory());
		$warning_dialog->setVariable('INFO_TEXT', $this->plugin->txt('save_without_correct_detail'));
		$warning_dialog->setVariable('SAVE_ANYWAY', $this->plugin->txt('save_anyway'));
		$warning_dialog->setVariable('CANCEL', $this->plugin->txt('CANCEL'));
		$modal->setBody($warning_dialog->get());
		$mod = new ilCustomInputGUI('', '');
		$mod->setHtml($modal->getHTML());
		$form->addItem($mod);
	}

    /**
     * @param ilPropertyFormGUI|ilSubEnabledFormPropertyGUI $form
     * @param                                               $post_var
     * @throws ilCtrlException
     */
	protected function appendRepositorySelector($form, string $post_var): void
	{
		$this->ctrl->setParameterByClass('ilformpropertydispatchgui', 'postvar', $post_var);
		$explorer_gui = new ilInteractiveVideoSelectionExplorerGUI(
			['ilpropertyformgui', 'ilformpropertydispatchgui', 'ilInteractiveVideoRepositorySelectorInputGUI'],
			'handleExplorerCommand'
		);
		$explorer_gui->setId($post_var);

		$root_ref_id = new ilInteractiveVideoRepositorySelectorInputGUI(
			$this->plugin->txt($post_var),
			$post_var, $explorer_gui, false
		);

		$root_ref_id->setInfo($this->plugin->txt($post_var . '_info'));
		$form->addSubItem($root_ref_id);
	}

    /**
	 * @throws ilDatabaseException
	 * @throws ilObjectNotFoundException
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 * @throws ilWACException
	 */
	public function getInteractiveForm(): string
	{
        global $DIC;
		$simple_choice = new SimpleChoiceQuestion();
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$question_id   = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);

		$question      = new ilTemplate("tpl.simple_questions.html", true, true, $this->plugin->getDirectory());

		$ck = new ilTextAreaInputCkeditor($this->plugin);
		$ck->appendCkEditorToTemplate($question);

		$question->setVariable('ANSWER_TEXT',		$this->plugin->txt('answer_text'));
		$question->setVariable('CORRECT_SOLUTION', 	$this->plugin->txt('correct_solution'));
		if($question_id > 0)
		{
            $get = $DIC->http()->wrapper()->query();
            $cid = $get->retrieve('comment_id', $DIC->refinery()->kindlyTo()->int());
            $ajax_question_object = json_decode($ajax_object->getJsonForCommentId($cid));
			$question->setVariable('JSON', json_encode($ajax_question_object->answers));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
			$question->setVariable('QUESTION_TEXT', $simple_choice->getQuestionTextQuestionId($question_id));
		}
		else
		{
			$answers = [];

            $post = $DIC->http()->wrapper()->post();
            if($post->has('answer'))
			{
				$post_answers = ilArrayUtil::stripSlashesRecursive($post->retrieve('answer', $DIC->refinery()->kindlyTo()->listOf($DIC->refinery()->kindlyTo()->string())));
                $post_correct = [];
                if($post->has('correct')) {
                    $post_correct = $post->retrieve('correct', $DIC->refinery()->kindlyTo()->dictOf($DIC->refinery()->kindlyTo()->string()));
                }


                foreach($post_answers as $key => $value)
				{
					$correct = 0;
					if(is_array($post_correct) && array_key_exists($key, $post_correct))
					{
						$correct = 1;
					}
					array_push($answers, ['answer' => $value, 'correct' => $correct]);
				}
			}
			$question->setVariable('JSON', json_encode($answers));
            $post_type = 0;
            if($post->has('question_type')) {
                $post_type = $post->retrieve('question_type', $DIC->refinery()->kindlyTo()->int());
            }
			$question->setVariable('QUESTION_TYPE', $post_type);
			$question->setVariable('QUESTION_TEXT');
		}
		$question->setVariable('LABEL_FEEDBACK_NEUTRAL',		json_encode($this->plugin->txt('feedback_neutral')));
		$question->setVariable('LABEL_JUMP_NEUTRAL',			json_encode($this->plugin->txt('feedback_jump_neutral')));
		$question->setVariable('LABEL_JUMP_NEUTRAL_INFO',		json_encode($this->plugin->txt('feedback_jump_neutral_info')));
		$question->setVariable('LABEL_REPOSITORY_NEUTRAL',		json_encode($this->plugin->txt('feedback_repository_neutral')));
		$question->setVariable('LABEL_REPOSITORY_NEUTRAL_INFO',	json_encode($this->plugin->txt('feedback_repository_neutral_info')));
		$question->setVariable('LABEL_FEEDBACK_CORRECT',		json_encode($this->plugin->txt('feedback_correct')));
		$question->setVariable('LABEL_JUMP_CORRECT',			json_encode($this->plugin->txt('is_jump_correct')));
		$question->setVariable('LABEL_JUMP_CORRECT_INFO',		json_encode($this->plugin->txt('is_jump_correct_info')));
		$question->setVariable('LABEL_REPOSITORY_CORRECT',		json_encode($this->plugin->txt('feedback_correct_obj')));
		$question->setVariable('LABEL_REPOSITORY_CORRECT_INFO',	json_encode($this->plugin->txt('feedback_correct_obj_info')));
		$question->setVariable('LABEL_TIME',	json_encode($this->plugin->txt('time_for_preview')));
		$question->setVariable('QUESTION_ID', $question_id);
		return $question->get();
	}
}
