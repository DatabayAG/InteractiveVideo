<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Repository/classes/class.ilObjectPluginGUI.php';
require_once 'Services/PersonalDesktop/interfaces/interface.ilDesktopItemHandling.php';
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObject.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObjectGUI.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php'; 
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionAjaxHandler.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionStatistics.php');
/**
 * Class ilObjInteractiveVideoGUI
 * @author               Nadia Ahmad <nahmad@databay.de>
 * @ilCtrl_isCalledBy    ilObjInteractiveVideoGUI: ilRepositoryGUI, ilAdministrationGUI, ilObjPluginDispatchGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilPermissionGUI, ilInfoScreenGUI, ilObjectCopyGUI, ilRepositorySearchGUI, ilPublicUserProfileGUI, ilCommonActionDispatcherGUI, ilMDEditorGUI
 */
class ilObjInteractiveVideoGUI extends ilObjectPluginGUI implements ilDesktopItemHandling
{
	/**
	 * @object $objComment ilObjComment
	 */
	public $objComment;

	/**
	 * @param $comment_time
	 * @return mixed
	 */
	protected function getSecondsFromCommentTimeArray($comment_time)
	{
		$seconds = $comment_time['time']['h'] * 3600
				+ $comment_time['time']['m'] * 60
				+ $comment_time['time']['s'];
		return $seconds;
	}

	/**
	 * Functions that must be overwritten
	 */
	public function getType()
	{
		return 'xvid';
	}

	/**
	 * Cmd that will be redirected to after creation of a new object.
	 */
	public function getAfterCreationCmd()
	{
		return 'editProperties';
	}

	public function getStandardCmd()
	{
		return 'showContent';
	}

	/**
	 * @param string $cmd
	 * @throws ilException
	 */
	public function performCommand($cmd)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 * @var $tpl    ilTemplate
		 */
		global $ilTabs;
		$this->setTitleAndDescription();

		$next_class = $this->ctrl->getNextClass($this);
		switch($next_class)
		{
			case 'ilmdeditorgui':
				$this->checkPermission('write');
				require_once 'Services/MetaData/classes/class.ilMDEditorGUI.php';
				$md_gui = new ilMDEditorGUI($this->object->getId(), 0, $this->object->getType());
				$md_gui->addObserver($this->object, 'MDUpdateListener', 'General');
				$ilTabs->setTabActive('meta_data');
				$this->ctrl->forwardCommand($md_gui);
				break;

			case 'ilpublicuserprofilegui':
				require_once 'Services/User/classes/class.ilPublicUserProfileGUI.php';
				$profile_gui = new ilPublicUserProfileGUI((int)$_GET['user']);
				$profile_gui->setBackUrl($this->ctrl->getLinkTarget($this, 'showContent'));
				$this->tpl->setContent($this->ctrl->forwardCommand($profile_gui));
				break;

			case 'ilcommonactiondispatchergui':
				require_once 'Services/Object/classes/class.ilCommonActionDispatcherGUI.php';
				$gui = ilCommonActionDispatcherGUI::getInstanceFromAjaxCall();
				$this->ctrl->forwardCommand($gui);
				break;

			default:
				switch($cmd)
				{
					case 'showTutorInsertForm':
						$this->checkPermission('write');
						$cmd = $_POST['cmd'];
						if(method_exists($this, $cmd))
						{
							$this->$cmd();
						}
						else  $this->editComments();
						break;
					
					case 'updateProperties':
					case 'editProperties':
					case 'confirmDeleteComment':
					case 'deleteComment': 
					case 'editComments':  
				    case 'editQuestion': 
					case 'confirmUpdateQuestion': 	
				    case 'insertQuestion':
                    case 'completeCsvExport':
                    $this->checkPermission('write');
						$this->$cmd();
						break;

					case 'redrawHeaderAction':
					case 'addToDesk':
					case 'removeFromDesk':
					case 'showContent':
						if(in_array($cmd, array('addToDesk', 'removeFromDesk')))
						{
							$cmd .= 'Object';
						}
						$this->checkPermission('read');
						$this->$cmd();
						break;
					case 'getQuestionPerAjax':
					case 'postAnswerPerAjax':
						$this->checkPermission('read');
						$this->$cmd();
						break;
					default:
						if(method_exists($this, $cmd))
						{
							$this->checkPermission('read');
							$this->$cmd();
						}
						else
						{
							throw new ilException(sprintf("Unsupported plugin command %s ind %s", $cmd, __METHOD__));
						}
						break;
				}
				break;
		}

		$this->addHeaderAction();
	}

	public function getQuestionPerAjax()
	{
		$ajax_object = new SimpleChoiceQuestionAjaxHandler();

		$existUserAnswer = SimpleChoiceQuestion::existUserAnswer((int)$_GET['comment_id']);
		
		$is_repeat_question = SimpleChoiceQuestion::isRepeatQuestionEnabled((int)$_GET['comment_id']);
		$tpl_json      = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);
		if(($is_repeat_question == true)  
		|| ($is_repeat_question == false && $existUserAnswer == false))
		{
			$tpl_json->setVariable('JSON', $ajax_object->getJsonForCommentId((int)$_GET['comment_id']));
			$tpl_json->show("DEFAULT", false, true);
			exit();
		}
		return;
	}

	public function postAnswerPerAjax()
	{
		if(SimpleChoiceQuestion::isLimitAttemptsEnabled((int)$_POST['qid']) == false)
		{
			$answer = is_array($_POST['answer']) ? ilUtil::stripSlashesRecursive($_POST['answer']) : array();
			$simple_choice = new SimpleChoiceQuestion();
			$simple_choice->saveAnswer((int) $_POST['qid'], $answer);
		}
		else if(SimpleChoiceQuestion::existUserAnswerForQuestionId((int)$_POST['qid']) == false)
		{
			$answer = is_array($_POST['answer']) ? ilUtil::stripSlashesRecursive($_POST['answer']) : array();
			$simple_choice = new SimpleChoiceQuestion();
			$simple_choice->saveAnswer((int) $_POST['qid'], $answer);
		}
		$this->showFeedbackPerAjax();
		exit();
	}

	public function showFeedbackPerAjax()
	{
		$tpl_json = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$feedback      = $ajax_object->getFeedbackForQuestion($_POST['qid']);
		$tpl_json->setVariable('JSON', $feedback);	
		return $tpl_json->show("DEFAULT", false, true );
	}
	
	/**
	 * 
	 */
	public function showContent()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs, $ilUser;

		$ilTabs->activateTab('content');

		ilObjMediaObjectGUI::includePresentationJS($tpl);

		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $this->plugin->getDirectory());

		$mob_id = $this->object->getMobId();
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$video_tpl->setVariable('VIDEO_SRC', $mob_dir . '/' . $media_item['location']);
		$video_tpl->setVariable('VIDEO_TYPE', $media_item['format']);
		
		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());
		$this->objComment->setIsPublic($this->object->isPublic());
		$this->objComment->setIsAnonymized($this->object->isAnonymized());
		$this->objComment->setIsRepeat($this->object->isRepeat());
		require_once("./Services/UIComponent/Modal/classes/class.ilModalGUI.php");
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());

		$video_tpl->setVariable('COMMENT_TIME_END', $this->plugin->txt('time_end'));
		$video_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment'));
		$video_tpl->setVariable('TXT_ENDTIME_WARNING', $this->plugin->txt('endtime_warning'));
		$video_tpl->setVariable('TXT_NO_TEXT_WARNING', $this->plugin->txt('no_text_warning'));
		$video_tpl->setVariable('TXT_IS_PRIVATE', $this->plugin->txt('is_private_comment'));
		$video_tpl->setVariable('TXT_COMMENTS', $this->plugin->txt('comments'));
		$video_tpl->setVariable('SHOW_ALL_COMMENTS', $this->plugin->txt('show_all_comments'));
		$video_tpl->setVariable('AUTHOR_FILTER', $this->plugin->txt('author_filter'));

		$video_tpl->setVariable('TXT_POST', $this->lng->txt('save'));
		$video_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));
		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig());
		
		$tpl->setContent($video_tpl->get());
	}

	/**
	 * 
	 */
	public function postComment()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		if(
			!isset($_POST['comment_text']) ||
			!is_string($_POST['comment_text']) ||
			!strlen(trim(ilUtil::stripSlashes($_POST['comment_text'])))
		)
		{
			ilUtil::sendFailure($this->plugin->txt('missing_comment_text'));
			$this->showContent();
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure($this->plugin->txt('missing_stopping_point'));
			$this->showContent();
			return;
		}
		
		if(isset($_POST['comment_time_end_h']))
		{
			$seconds_end = $this->getSecondsFromCommentTimeArray(array('time' => array(
																			'h' => (int) $_POST['comment_time_end_h'],
																			'm' => (int) $_POST['comment_time_end_m'],
																			's' => (int) $_POST['comment_time_end_s']
			)));
		}
		else
		{
			$seconds_end = 0;
		}
		
		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim(ilUtil::stripSlashes($_POST['comment_text'])));
		$comment->setCommentTime((float)$_POST['comment_time']);
		$comment->setCommentTimeEnd($seconds_end);
		
		if($ilUser->getId() == ANONYMOUS_USER_ID)
		{
			// NO private-flag for Anonymous!!
			$comment->setIsPrivate(0);
		}
		else
		{	
			$is_private = 0;
			if( $_POST['is_private'] == "true" )
				{
					$is_private = 1; 
				}

			$comment->setIsPrivate($is_private );
		}
		$comment->create();
		exit();
	}

	/**
	 * 
	 */
	public function confirmDeleteComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editComments');

		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteComment'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editComments');

		$post_ids = $_POST['comment_id'];
		
		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
	}

	/**
	 * 
	 */
	public function deleteComment()
	{
		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($this->plugin->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
		$this->editComments();
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	private function initCommentForm()
	{
		global $ilUser;
		
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
		$form->setTitle($this->plugin->txt('insert_comment'));

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		//Todo: why is the title on comments forced again?
		//$title->setRequired(true);
		$form->addItem($title);
		
		$this->plugin->includeClass('class.ilTimeInputGUI.php');
		$time = new ilTimeInputGUI($this->lng->txt('time'), 'comment_time');
		$time->setShowTime(true);
		$time->setShowSeconds(true);
		
		if(isset($_POST['comment_time']))
		{
			$seconds = $_POST['comment_time'];
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);
		
		$time_end = new ilTimeInputGUI($this->plugin->txt('time_end'), 'comment_time_end');
		$time_end->setShowTime(true);
		$time_end->setShowSeconds(true);

		if(isset($_POST['comment_time_end']))
		{
			$seconds = $_POST['comment_time_end'];
			$time_end->setValueByArray(array('comment_time_end' => (int)$seconds));
		}
		$form->addItem($time_end);

		if($ilUser->getId() != ANONYMOUS_USER_ID)
		{
			$is_private = new ilCheckboxInputGUI($this->plugin->txt('is_private_comment'), 'is_private');
			$form->addItem($is_private);
		}
		
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('comment'));
		$form->addItem($section_header);
		
		$comment = new ilTextAreaInputGUI($this->lng->txt('comment'), 'comment_text');
		$comment->setRequired(true);
		$form->addItem($comment);
		/** tags are deactivated for the moment
		$tags = new ilTextAreaInputGUI($this->plugin->txt('tags'), 'comment_tags');
		$form->addItem($tags);
		**/
		$frm_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($frm_id);
		
		return $form;
	}

	/**
	 * 
	 */
	public function showTutorInsertCommentForm()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		$form = $this->initCommentForm();
		
		$form->addCommandButton('insertTutorComment', $this->lng->txt('insert'));
		$form->addCommandButton('cancelComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}
	
	public function cancelComments()
	{
		$this->ctrl->redirect($this, 'editComments');
	}
	
	public function initQuestionForm()
	{
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertQuestion'));
		$form->setTitle($this->plugin->txt('insert_question'));
		
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		$title->setRequired(true);
		$form->addItem($title);

		$this->plugin->includeClass('class.ilTimeInputGUI.php');
		$time = new ilTimeInputGUI($this->lng->txt('time'), 'comment_time');
		$time->setShowTime(true);
		$time->setShowSeconds(true);

		if(isset($_POST['comment_time']))
		{
			$seconds = $_POST['comment_time'];
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);

		/*$time_end = new ilTimeInputGUI($this->plugin->txt('time_end'), 'comment_time_end');
		$time_end->setShowTime(true);
		$time_end->setShowSeconds(true);

		if(isset($_POST['comment_time_end']))
		{
			$seconds = $_POST['comment_time_end'];
			$time_end->setValueByArray(array('comment_time_end' => (int)$seconds));
		}
		$form->addItem($time_end);
		*/
		$repeat_question = new ilCheckboxInputGUI($this->plugin->txt('repeat_question'), 'repeat_question');
		$repeat_question->setInfo($this->plugin->txt('repeat_question_info'));
		$form->addItem($repeat_question);

		$limit_attempts = new ilCheckboxInputGUI($this->plugin->txt('limit_attempts'), 'limit_attempts');
		$limit_attempts->setInfo($this->plugin->txt('limit_attempts_info'));
		$form->addItem($limit_attempts);
		
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('question'));
		$form->addItem($section_header);
		
		$question_type = new ilSelectInputGUI($this->plugin->txt('question_type'), 'question_type');
		$type_options = array(0 => $this->plugin->txt('single_choice'), 1 => $this->plugin->txt('multiple_choice'), 2 => $this->plugin->txt('reflection'));

		$question_type->setOptions($type_options);
		$question_type->setInfo($this->plugin->txt('question_type_info'));
		$form->addItem($question_type);
		
		$question_text = new ilTextAreaInputGUI($this->plugin->txt('question_text'), 'question_text');
		$question_text->setRequired(true);
		$form->addItem($question_text);

		$answer = new ilCustomInputGUI($this->lng->txt('answers'), 'answer_text');
		$answer->setHtml($this->getInteractiveForm());
		$form->addItem($answer);
		
		//New Section: Feedback

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('feedback'));
		$form->addItem($section_header);

		// Feedback correct
		$feedback_correct = new ilTextAreaInputGUI($this->plugin->txt('feedback_correct'), 'feedback_correct');
		$show_correct_icon = new ilCheckboxInputGUI($this->plugin->txt('show_correct_icon'), 'show_correct_icon');
		$show_correct_icon->setInfo($this->plugin->txt('show_correct_icon_info'));
		$show_correct_icon->setChecked(true);
		
		
		$feedback_correct->addSubItem($show_correct_icon);
		$is_jump_correct = new ilCheckboxInputGUI($this->plugin->txt('is_jump_correct'), 'is_jump_correct');
		$is_jump_correct->setInfo($this->plugin->txt('is_jump_correct_info'));

		$jump_correct_ts = new ilTimeInputGUI($this->lng->txt('time'), 'jump_correct_ts');
		$jump_correct_ts->setShowTime(true);
		$jump_correct_ts->setShowSeconds(true);

		if(isset($_POST['jump_correct_ts']))
		{
			$seconds = $_POST['jump_correct_ts'];
			$time->setValueByArray(array('jump_correct_ts' => (int)$seconds));
		}
		$is_jump_correct->addSubItem($jump_correct_ts);
		$feedback_correct->addSubItem($is_jump_correct);
		$form->addItem($feedback_correct);

		// Feedback wrong
		$feedback_one_wrong = new ilTextAreaInputGUI($this->plugin->txt('feedback_one_wrong'), 'feedback_one_wrong');
		$show_wrong_icon = new ilCheckboxInputGUI($this->plugin->txt('show_wrong_icon'), 'show_wrong_icon');
		$show_wrong_icon->setInfo($this->plugin->txt('show_wrong_icon_info'));
		$show_wrong_icon->setChecked(true);
		
		$feedback_one_wrong->addSubItem($show_wrong_icon);

		$is_jump_wrong = new ilCheckboxInputGUI($this->plugin->txt('is_jump_wrong'), 'is_jump_wrong');
		$is_jump_wrong->setInfo($this->plugin->txt('is_jump_wrong_info'));
		$jump_wrong_ts = new ilTimeInputGUI($this->lng->txt('time'), 'jump_wrong_ts');
		$jump_wrong_ts->setShowTime(true);
		$jump_wrong_ts->setShowSeconds(true);

		if(isset($_POST['jump_wrong_ts']))
		{
			$seconds = $_POST['jump_wrong_ts'];
			$time->setValueByArray(array('jump_correct_ts' => (int)$seconds));
		}
		$is_jump_wrong->addSubItem($jump_wrong_ts);
		$feedback_one_wrong->addSubItem($is_jump_wrong);
		$form->addItem($feedback_one_wrong);

		$show_response_frequency = new ilCheckboxInputGUI($this->plugin->txt('show_response_frequency'), 'show_response_frequency');
		$show_response_frequency->setInfo($this->plugin->txt('show_response_frequency_info'));
		$form->addItem($show_response_frequency);
		
		$is_interactive = new ilHiddenInputGUI('is_interactive');
		$is_interactive->setValue(1);
		$form->addItem($is_interactive);
		
		$comment_text = new ilHiddenInputGUI('comment_text');
		$comment_text->setValue('dummy text');
		$form->addItem($comment_text);
		
		$comment_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($comment_id);

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function showTutorInsertQuestionForm(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');

		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initQuestionForm();	
		}
		
		$form->addCommandButton('insertQuestion', $this->lng->txt('insert'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}

	
	public function insertQuestion()
	{
		$form = $this->initQuestionForm();

		if($form->checkInput())
		{
			$this->objComment = new ilObjComment();

			$this->objComment->setObjId($this->object->getId());
			$this->objComment->setCommentText($form->getInput('question_text'));
			$this->objComment->setInteractive(1);

			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setIsPrivate(0);

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time);
			$this->objComment->setCommentTime($seconds);
			$comment_time_end = $form->getInput('comment_time_end');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time_end);
			$this->objComment->setCommentTimeEnd($seconds);
			$this->objComment->setIsTutor(1);
			$this->objComment->create();
			
			$this->performQuestionRefresh($this->objComment->getCommentId(), $form);
			
			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->ctrl->redirect($this, 'editComments');
		}
		else
		{
			$form->setValuesByPost();
			ilUtil::sendFailure($this->lng->txt('err_check_input'));
			$this->showTutorInsertQuestionForm($form);
		}
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editQuestion(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		
		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initQuestionForm();
			$form->setValuesByArray($this->getQuestionFormValues(),true);
		}
	
		$this->getAnswerDefinitionsJSON();
		
		$form->addCommandButton('confirmUpdateQuestion', $this->lng->txt('update'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param int $comment_id
	 */
	private function getQuestionFormValues($comment_id = 0)
	{
		if($comment_id == 0)
		{
			if(!isset($_GET['comment_id']) && !isset($_POST['comment_id']))
			{
				ilUtil::sendFailure($this->plugin->txt('no_comment_id_given'), true);
				return $this->editComments();
			}
			else
			{
				$comment_id = (int)$_GET['comment_id'] ? (int)$_GET['comment_id'] : (int)$_POST['comment_id'];
			}
		}

		$comment_data				= $this->object->getCommentDataById((int)$comment_id);
		$values['comment_id']		= $comment_data['comment_id'];
		$values['comment_time']		= $comment_data['comment_time'];
		$values['comment_time_end']	= $comment_data['comment_time_end'];
		$values['comment_text']		= $comment_data['comment_text'];
		$values['is_interactive']	= $comment_data['is_interactive'];
		$values['comment_title']	= $comment_data['comment_title'];
		$values['comment_tags']		= $comment_data['comment_tags'];

		$question_data = $this->object->getQuestionDataById((int)$comment_id);

		$values['question_text']      = $question_data['question_data']['question_text'];
		$values['question_type']      = $question_data['question_data']['type'];
		$values['feedback_correct']   = $question_data['question_data']['feedback_correct'];
		$values['is_jump_correct']    = $question_data['question_data']['is_jump_correct'];
		$values['show_correct_icon']  = $question_data['question_data']['show_correct_icon'];
		$values['jump_correct_ts']    = $question_data['question_data']['jump_correct_ts'];
		$values['feedback_one_wrong'] = $question_data['question_data']['feedback_one_wrong'];
		$values['show_response_frequency'] = $question_data['question_data']['show_response_frequency'];
		$values['is_jump_wrong']      = $question_data['question_data']['is_jump_wrong'];
		$values['show_wrong_icon']    = $question_data['question_data']['show_wrong_icon'];
		$values['jump_wrong_ts']      = $question_data['question_data']['jump_wrong_ts'];
		$values['limit_attempts']     = $question_data['question_data']['limit_attempts'];
		$values['repeat_question']    = $question_data['question_data']['repeat_question'];
//		$values['question_correct']   = $question_data['question_data']['question_correct']; //marko

		return $values;
}
	
	
	public function confirmUpdateQuestion()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;
		$ilTabs->activateTab('editComments');
		
		$comment_id = (int)$_POST['comment_id'];
		
		if(!$chk =  SimpleChoiceQuestion::existUserAnswer($comment_id))
		{
			$this->updateQuestion();
		}	
		else
		{
			require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
			$confirm = new ilConfirmationGUI();
			$confirm->setFormAction($this->ctrl->getFormAction($this, 'updateQuestion'));
			$confirm->setHeaderText($this->plugin->txt('sure_update_question'));

			$confirm->setCancel($this->lng->txt('cancel'), 'editComments');
			$confirm->setConfirm($this->lng->txt('update'), 'updateQuestion');
			foreach($_POST as $key=>$value)
			{
				//@todo .... very quick ... very dirty .... 
				if($key != 'cmd')
				{
					$form_values[$key] = $value;
				}
			}
			$confirm->addHiddenItem('form_values', serialize($form_values));

			$tpl->setContent($confirm->getHTML());
		}
	}

	public function updateQuestion()
	{
		$form = $this->initQuestionForm();
		if(isset($_POST['form_values']))
		{
			//@todo .... very quick ... very wtf .... 
			$_POST = unserialize($_POST['form_values']);
		}
		
		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);
			}
			$this->objComment->setCommentText($form->getInput('question_text'));
			$this->objComment->setInteractive((int)$form->getInput('is_interactive'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time);
			$this->objComment->setCommentTime($seconds);
			$comment_time_end = $form->getInput('comment_time_end');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time_end);
			$this->objComment->setCommentTimeEnd($seconds);
			$this->objComment->update();

			$this->performQuestionRefresh($comment_id, $form);

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editQuestion($form);
		}
	}

	/**
	 * @param $comment_id
	 * @param $form
	 */
	private function performQuestionRefresh($comment_id, $form)
	{
		$question    = new SimpleChoiceQuestion($comment_id);
		$question_id = $question->existQuestionForCommentId($comment_id);
		
		$question->setCommentId($comment_id);
		$question->setType((int)$form->getInput('question_type'));
		$question->setQuestionText(ilUtil::stripSlashes($form->getInput('question_text')));
		$question->setFeedbackCorrect(ilUtil::stripSlashes($form->getInput('feedback_correct')));
		$question->setFeedbackOneWrong(ilUtil::stripSlashes($form->getInput('feedback_one_wrong')));
		
		$question->setLimitAttempts((int)$form->getInput('limit_attempts'));
		$question->setIsJumpCorrect((int)$form->getInput('is_jump_correct'));
		$question->setShowCorrectIcon((int)$form->getInput('show_correct_icon'));
		
		$jmp_correct_time = $form->getInput('jump_correct_ts');
		$correct_seconds  = $jmp_correct_time['time']['h'] * 3600
		+ $jmp_correct_time['time']['m'] * 60
		+ $jmp_correct_time['time']['s'];
		$question->setJumpCorrectTs($correct_seconds);
		
		$question->setIsJumpWrong((int)$form->getInput('is_jump_wrong'));
		$question->setShowWrongIcon((int)$form->getInput('show_wrong_icon'));
		$jmp_wrong_time = $form->getInput('jump_wrong_ts');
		$wrong_seconds  = $jmp_wrong_time['time']['h'] * 3600
		+ $jmp_wrong_time['time']['m'] * 60
		+ $jmp_wrong_time['time']['s'];
		$question->setJumpWrongTs($wrong_seconds);

		$question->setShowResponseFrequency((int)$form->getInput('show_response_frequency'));
		$question->setRepeatQuestion((int)$form->getInput('repeat_question'));
		$question->deleteQuestionsIdByCommentId($comment_id);
		$question->create();

	}
	
	/**
	 * 
	 */
	public function insertTutorComment()
	{
		$this->insertComment(1);
	}

	/**
	 * @param int $is_tutor
	 */
	private function insertComment($is_tutor = 0)
	{
		$form = $this->initCommentForm();

		if($form->checkInput())
		{
			$this->objComment = new ilObjComment();

			$this->objComment->setObjId($this->object->getId());
			$this->objComment->setCommentText($form->getInput('comment_text'));
			$this->objComment->setInteractive(0);
			
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time		= $form->getInput('comment_time');
			$seconds			= $this->getSecondsFromCommentTimeArray($comment_time);
			$this->objComment->setCommentTime($seconds);
			$comment_time_end	= $form->getInput('comment_time_end');
			$seconds			= $this->getSecondsFromCommentTimeArray($comment_time_end);
			$this->objComment->setCommentTimeEnd($seconds);
			$this->objComment->setIsTutor($is_tutor);
			
			$this->objComment->create();

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->ctrl->redirect($this, 'editComments');
		}
		else
		{
			$form->setValuesByPost();
			ilUtil::sendFailure($this->lng->txt('err_check_input'),true);
			$this->ctrl->redirect($this, 'showTutorInsertCommentForm');
		}

		if($is_tutor)
		{
			$this->editComments();
		}
		else
		{
			$this->showContent();
		}
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editMyComment(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editMyComments');
		
		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initCommentForm();
			$form->setValuesByArray($this->getCommentFormValues(), true);
		}	

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateMyComment'));
		$form->setTitle($this->plugin->txt('edit_comment'));

		$form->addCommandButton('updateMyComment', $this->lng->txt('save'));
		$form->addCommandButton('editMyComments', $this->lng->txt('cancel'));
			
		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editComment(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initCommentForm();
			$form->setValuesByArray($this->getCommentFormValues(), true);
		}

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateComment'));
		$form->setTitle($this->plugin->txt('edit_comment'));
		$form->addCommandButton('updateComment', $this->lng->txt('save'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param int $comment_id
	 */
	private function getCommentFormValues($comment_id = 0)
	{
		if($comment_id == 0)
		{
			if(!isset($_GET['comment_id']) && !isset($_POST['comment_id']))
			{
				ilUtil::sendFailure($this->plugin->txt('no_comment_id_given'), true);
				return $this->showContent();
			}
			else
			{
				$comment_id = (int)$_GET['comment_id'] ? (int)$_GET['comment_id'] : (int)$_POST['comment_id'] ;
			}
		}
		
		$comment_data				= $this->object->getCommentDataById($comment_id);
		$values['comment_id']		= $comment_data['comment_id'];
		$values['comment_time']		= $comment_data['comment_time'];
		$values['comment_time_end']	= $comment_data['comment_time_end'];
		$values['comment_text']		= $comment_data['comment_text'];
		$values['is_interactive']	= $comment_data['is_interactive'];
		$values['comment_title']	= $comment_data['comment_title'];
		$values['comment_tags']		= $comment_data['comment_tags'];
		$values['is_private']		= $comment_data['is_private'];
		
		return $values;
	}	
		
	public function getAnswerDefinitionsJSON()
	{
		$simple_choice = new SimpleChoiceQuestion();
        $ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$question_id = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);
		$question = new ilTemplate("tpl.simple_questions.html", true, true, $this->plugin->getDirectory());
		if($question_id > 0)
		{
			$question->setVariable('JSON', $ajax_object->getJsonForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
		}
		else
		{
			$question->setVariable('JSON', json_encode(array()));
			$question->setVariable('QUESTION_TYPE', 0);
		}
		return $question->get();
	}
	
	public function getInteractiveForm()
	{
		global $tpl;
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionCreator.js');
		$tpl->addCss($this->plugin->getDirectory() . '/templates/default/xvid.css');
		$simple_choice = new SimpleChoiceQuestion();
        $ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$question_id = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);
		$question = new ilTemplate("tpl.simple_questions.html", true, true, $this->plugin->getDirectory());
		
		$question->setVariable('ANSWER_TEXT',		$this->plugin->txt('answer_text'));
		$question->setVariable('CORRECT_SOLUTION', 	$this->plugin->txt('correct_solution'));
		if($question_id > 0)
		{
			$question->setVariable('JSON', $ajax_object->getJsonForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
			$question->setVariable('QUESTION_TEXT', $simple_choice->getQuestionTextQuestionId($question_id));
		}
		else
		{
			$answers = array();
			if(array_key_exists('answer', $_POST) && sizeof($_POST['answer'] > 0))
			{
				$post_answers = ilUtil::stripSlashesRecursive($_POST['answer']);
				foreach($post_answers as $key => $value)
				{
					$correct = 0;
					if(array_key_exists($key, $_POST['correct']))
					{
						$correct = 1;
					}
					array_push($answers, array('answer' => $value, 'correct' => $correct));
				}
			}
			$question->setVariable('JSON', json_encode($answers));
			$question->setVariable('QUESTION_TYPE', 0);
			$question->setVariable('QUESTION_TEXT', '');
		}
		$question->setVariable('QUESTION_ID', $question_id);
		return $question->get();
	}
	
	/**
	 * 
	 */
	public function updateComment()
	{
		$form = $this->initCommentForm();
		
		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);

			}
			$this->objComment->setCommentText($form->getInput('comment_text'));
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time);
			$this->objComment->setCommentTime($seconds);
			$comment_time_end = $form->getInput('comment_time_end');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time_end);
			$this->objComment->setCommentTimeEnd($seconds);
			$this->objComment->update();

			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editComment($form);
		}
	}

	/**
	 *
	 */
	public function editComments($current_time = 0)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;
		
		//Todo: fix double tabs after question editing
		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		
		ilObjMediaObjectGUI::includePresentationJS($tpl);

		$video_tpl = new ilTemplate("tpl.edit_comment.html", true, true, $this->plugin->getDirectory());

		$video_tpl->setVariable('SCREEN_INFO', $this->plugin->txt('screen_info'));

		$mob_id = $this->object->getMobId();
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');
		
		$video_tpl->setVariable('FORM_ACTION', $this->ctrl->getFormAction($this,'showTutorInsertForm'));
		$video_tpl->setVariable('VIDEO_SRC', $mob_dir . '/' . $media_item['location']);
		$video_tpl->setVariable('VIDEO_TYPE', $media_item['format']);

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());


		$video_tpl->setVariable('TXT_INS_COMMENT', $this->plugin->txt('insert_comment'));
		$video_tpl->setVariable('TXT_INS_QUESTION', $this->plugin->txt('insert_question'));

		require_once("./Services/UIComponent/Modal/classes/class.ilModalGUI.php");
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());
		
		$video_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postTutorComment', '', false, false));

		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig());

		$tbl_data = $this->object->getCommentsTableData();
		$this->plugin->includeClass('class.ilInteractiveVideoCommentsTableGUI.php');
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editComments');
		$tbl->setData($tbl_data);
		$video_tpl->setVariable('TABLE', $tbl->getHTML());
		$tpl->setContent($video_tpl->get());
	}

	protected function initPlayerConfig()
	{
		global $ilUser, $tpl;

		$tpl->addCss($this->plugin->getDirectory() . '/templates/default/xvid.css');
		$tpl->addCss($this->plugin->getDirectory() . '/libs/Bootstraptoggle/bootstrap2-toggle.min.css');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/libs/Bootstraptoggle/bootstrap2-toggle.min.js');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionViewer.js');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.InteractiveVideoMediaElementPlayer.js');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/InteractiveVideoPlayerComments.js');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/InteractiveVideoPlayerFunctions.js');
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/InteractiveVideoPlayerAbstract.js');

		$config_tpl = new ilTemplate("tpl.video_config.html", true, true, $this->plugin->getDirectory());
		$config_tpl->setVariable('QUESTION_GET_URL', $this->ctrl->getLinkTarget($this, 'getQuestionPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_POST_URL', $this->ctrl->getLinkTarget($this, 'postAnswerPerAjax', '', true, false));
		$config_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postComment', '', true, false));
		$config_tpl->setVariable('SEND_BUTTON', $this->plugin->txt('send'));
		$config_tpl->setVariable('CLOSE_BUTTON', $this->plugin->txt('close'));
		$config_tpl->setVariable('FEEDBACK_JUMP_TEXT', $this->plugin->txt('feedback_jump_text'));
		$config_tpl->setVariable('LEARNING_RECOMMENDATION_TEXT', $this->plugin->txt('learning_recommendation'));
		$config_tpl->setVariable('ALREADY_ANSWERED_TEXT', $this->plugin->txt('already_answered'));
		$config_tpl->setVariable('QUESTION_TEXT', $this->plugin->txt('question'));
		$config_tpl->setVariable('PRIVATE_TEXT', $this->plugin->txt('is_private_comment'));
		$config_tpl->setVariable('RESET_TEXT', $this->plugin->txt('reset'));
		$config_tpl->setVariable('AUTHOR_FILTER', $this->plugin->txt('author_filter'));
		$config_tpl->setVariable('SWITCH_ON', $this->plugin->txt('switch_on'));
		$config_tpl->setVariable('SWITCH_OFF', $this->plugin->txt('switch_off'));
		$config_tpl->setVariable('IS_CHRONOLOGIC_VALUE', $this->object->isChronologic());

		$simple_choice = new SimpleChoiceQuestion();
		$ignore = $simple_choice->getAllNonRepeatAnsweredQuestion($ilUser->getId());
//		$repeatCorrect = 1;  //switch this: 1 --> repeat questons disregarding status, 0 --> only repeat incorrectly answered
		if($this->object->isRepeat())
		{
			$correct_question_id = $simple_choice->getAllRepeatCorrectlyAnsweredQuestion($ilUser->getId()); //marko - only show remaining incorrectly answered questions
			$ignore = array_merge($ignore,$correct_question_id);  //marko - see above
		}
		$config_tpl->setVariable('IGNORE_QUESTIONS', json_encode($ignore));

		if($this->object->isAnonymized())
		{
			$config_tpl->setVariable('USERNAME', '');
		}
		else
		{
			$config_tpl->setVariable('USERNAME', ilUserUtil::getNamePresentation($ilUser->getId()));
		}
		

		$stop_points = $this->objComment->getStopPoints();
		$comments = $this->objComment->getContentComments();

		$config_tpl->setVariable('STOP_POINTS', json_encode($stop_points));
		$config_tpl->setVariable('COMMENTS', json_encode($comments));
		
		return $config_tpl->get();
	}
	
	/**
	 *
	 */
	public function editMyComments()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editMyComments');

		$tbl_data = $this->object->getCommentsTableDataByUserId();
		$this->plugin->includeClass('class.ilInteractiveVideoCommentsTableGUI.php');
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editMyComments');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}
	/**
	 *
	 */
	public function updateMyComment()
	{
		$form = $this->initCommentForm();
		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);

			}
			$this->objComment->setCommentText($form->getInput('comment_text'));
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time);
			$this->objComment->setCommentTime($seconds);
			
			$comment_time_end = $form->getInput('comment_time_end');
			$seconds      = $this->getSecondsFromCommentTimeArray($comment_time_end);
			$this->objComment->setCommentTimeEnd($seconds);
			$this->objComment->update();

			$this->editMyComments();
		}
		else
		{
			$form->setValuesByPost();
			return $this->editMyComment($form);
		}
	}

	/**
	 *
	 */
	public function confirmDeleteMyComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editMyComments');

		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteMyComment'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteMyComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editMyComments');

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
	}

	/**
	 *
	 */
	public function deleteMyComment()
	{
		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editMyComments();
			return;
		}

		$post_ids = $_POST['comment_id'];
		$comments = $this->object->getCommentIdsByObjId($this->obj_id);
		$comment_ids = array_keys($comments);
		$user_ids = array_unique($comments);
		
		if(count($user_ids)> 1)
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
			$this->editMyComments();
		}
			
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($this->plugin->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
		$this->ctrl->redirect($this, 'editMyComment');
	}
	
	/**
	 *
	 */
	public function postTutorComment()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		if(
			!isset($_POST['comment_text']) ||
			!is_string($_POST['comment_text']) ||
			!strlen(trim(ilUtil::stripSlashes($_POST['comment_text'])))
		)
		{
			ilUtil::sendFailure($this->plugin->txt('missing_comment_text'));
			$this->editComments();
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure($this->plugin->txt('missing_stopping_point'));
			$this->editComments();
			return;
		}

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim(ilUtil::stripSlashes($_POST['comment_text'])));
		$comment->setCommentTime((float)$_POST['comment_time']);
		$comment->setCommentTimeEnd((float)$_POST['comment_time_end']);
		$comment->setIsTutor(true);
		$comment->create();
		
		$current_time = $comment->getCommentTime();
		$this->editComments($current_time);
	}

	public function showResults()
	{
		global $tpl, $ilTabs;
		
		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showResults');

		$simple = new SimpleChoiceQuestionStatistics();
		$tbl_data = $simple->getPointsForUsers($this->obj_id);
		$this->plugin->includeClass('class.SimpleChoiceQuestionsTableGUI.php');
		$tbl = new SimpleChoiceQuestionsTableGUI($this, 'showResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function showMyResults()
	{
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showMyResults');

		$simple = new SimpleChoiceQuestionScoring();
		$tbl_data = $simple->getMyPoints($this->obj_id);
		$this->plugin->includeClass('class.SimpleChoiceQuestionsUserTableGUI.php');
		$tbl = new SimpleChoiceQuestionsUserTableGUI($this, 'showMyResults');
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function showCompleteOverviewOverAllResults()
	{
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showCompleteOverviewOverAllResults');
		$this->plugin->includeClass('class.SimpleChoiceQuestionsCompleteUserTableGUI.php');
        $simple = new SimpleChoiceQuestionStatistics();
        $data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);
		$tbl = new SimpleChoiceQuestionsCompleteUserTableGUI($this, 'showCompleteResults', $data['question']);
		$tbl_data = $data['users'];
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());

	}
	
	public function confirmDeleteUserResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showResults');

		if(!isset($_POST['user_id']) || !is_array($_POST['user_id']) || !count($_POST['user_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showResults();
			return;
		}

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteUserResults'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteUserResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showResults');

		$user_ids = $_POST['user_id'];

		foreach($user_ids as $user_id)
		{
			$login = ilObjUser::_lookupName($user_id);
			
			$confirm->addItem('user_id[]', $user_id, $login['firstname'].' '.$login['lastname']);
		}

		$tpl->setContent($confirm->getHTML());
	}
	
	public function deleteUserResults()
	{
		if(!isset($_POST['user_id']) || !is_array($_POST['user_id']) || !count($_POST['user_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showResults();
			return;
		}

		$user_ids = $_POST['user_id'];

		if(count($user_ids) > 0)
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteUserResults($user_ids, $this->obj_id);
			ilUtil::sendSuccess($this->plugin->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_user_ids'));
		}
		$this->showResults();
	}

	public function showQuestionsResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showQuestionsResults');

		$simple = new SimpleChoiceQuestionStatistics();
		$tbl_data = $simple->getQuestionsOverview($this->obj_id);
		$this->plugin->includeClass('class.SimpleChoiceQuestionsOverviewTableGUI.php');
		$tbl = new SimpleChoiceQuestionsOverviewTableGUI($this, 'showQuestionsResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}
	
	public function confirmDeleteQuestionsResults()
	{
		/**
		* @var $tpl    ilTemplate
		* @var $ilTabs ilTabsGUI
		*/
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showQuestionsResults');


		if(!isset($_POST['question_id']) || !is_array($_POST['question_id']) || !count($_POST['question_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteQuestionsResults'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteQuestionsResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showQuestionsResults');

		$question_ids = $_POST['question_id'];

		foreach($question_ids as $question_id)
		{
			$confirm->addItem('question_id[]', $question_id, $question_id);
		}

		$tpl->setContent($confirm->getHTML());
	}

	public function deleteQuestionsResults()
	{
		if(!isset($_POST['question_id']) || !is_array($_POST['question_id']) || !count($_POST['question_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}

		$question_ids = $_POST['question_id'];

		if(count($question_ids) > 0)
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteQuestionsResults($question_ids);
			ilUtil::sendSuccess($this->plugin->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_question_ids'));
		}
		$this->showQuestionsResults();
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 * @return bool
	 */
	protected function validateCustom(ilPropertyFormGUI $a_form)
	{
		// @todo: Validate custom values (e.g. a new video file) on update and return false if the property form is invalid
		return parent::validateCustom($a_form);
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function updateCustom(ilPropertyFormGUI $a_form)
	{
		$is_anonymized = $a_form->getInput('is_anonymized');
		$this->object->setIsAnonymized((int)$is_anonymized);

		$is_repeat = $a_form->getInput('is_repeat');
		$this->object->setIsRepeat((int)$is_repeat);
		
		$is_public = $a_form->getInput('is_public');
		$this->object->setIsPublic((int)$is_public);

		$is_online = $a_form->getInput('is_online');
		$this->object->setOnline((int)$is_online);

		$is_chronologic = $a_form->getInput('is_chronologic');
		$this->object->setIsChronologic((int)$is_chronologic);
		
		$this->object->update();
		
		// @todo: Store the new file (delegate to application class)
		$file = $a_form->getInput('video_file');
		if($file['error'] == 0 )
		{
			$this->object->uploadVideoFile();
		}

		parent::updateCustom($a_form);
	}

	/**
	 * @param string $type
	 * @return array
	 */
	protected function initCreationForms($type)
	{
		return array(
			self::CFORM_NEW => $this->initCreateForm($type)
		);
	}

	/**
	 * @param string $type
	 * @return ilPropertyFormGUI
	 */
	public function  initCreateForm($type)
	{
		$form = parent::initCreateForm($type);

		$upload_field = new ilFileInputGUI($this->plugin->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov', 'mp3', 'flv', 'm4v', 'ogg', 'ogv', 'webm'));
		$upload_field->setRequired(true);
		$form->addItem($upload_field);

		$anonymized = new ilCheckboxInputGUI($this->plugin->txt('is_anonymized'), 'is_anonymized');
		$anonymized->setInfo($this->plugin->txt('is_anonymized_info'));
		$form->addItem($anonymized);

		$is_public = new ilCheckboxInputGUI($this->plugin->txt('is_public'), 'is_public');
		$is_public->setInfo($this->plugin->txt('is_public_info'));
		$is_public->setChecked(true);
		$form->addItem($is_public);

		$repeat = new ilCheckboxInputGUI($this->plugin->txt('is_repeat'), 'is_repeat');
		$repeat->setInfo($this->plugin->txt('is_repeat_info'));
		$form->addItem($repeat);

		$chrono = new ilCheckboxInputGUI($this->plugin->txt('is_chronologic'), 'is_chronologic');
		$chrono->setInfo($this->plugin->txt('is_chronologic_info'));
		$chrono->setChecked(false);
		$form->addItem($chrono);

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function initEditCustomForm(ilPropertyFormGUI $a_form)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('editProperties');

		$upload_field = new ilFileInputGUI($this->plugin->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov', 'mp3', 'flv', 'm4v', 'ogg', 'ogv', 'webm'));
		$a_form->addItem($upload_field);

		$online = new ilCheckboxInputGUI($this->lng->txt('online'), 'is_online');
		$a_form->addItem($online);
		
		$anonymized = new ilCheckboxInputGUI($this->plugin->txt('is_anonymized'), 'is_anonymized');
		$anonymized->setInfo($this->plugin->txt('is_anonymized_info'));
		$a_form->addItem($anonymized);
		
		$is_public = new ilCheckboxInputGUI($this->plugin->txt('is_public'), 'is_public');
		$is_public->setInfo($this->plugin->txt('is_public_info'));
		$a_form->addItem($is_public);
		
		$repeat = new ilCheckboxInputGUI($this->plugin->txt('is_repeat'), 'is_repeat');
		$repeat->setInfo($this->plugin->txt('is_repeat_info'));
		$a_form->addItem($repeat);

		$chrono = new ilCheckboxInputGUI($this->plugin->txt('is_chronologic'), 'is_chronologic');
		$chrono->setInfo($this->plugin->txt('is_chronologic_info'));
		$a_form->addItem($chrono);		

	}

	/**
	 * @param array $a_values
	 */
	protected function getEditFormCustomValues(array &$a_values)
	{
		$a_values['video_file'] 	= ilObject::_lookupTitle($this->object->getMobId());
		$a_values['is_anonymized'] 	= $this->object->isAnonymized();
		$a_values['is_repeat'] 		= $this->object->isRepeat();
		$a_values['is_public']     	= $this->object->isPublic();
		$a_values["is_online"]		= $this->object->isOnline();
		$a_values["is_chronologic"]	= $this->object->isChronologic();
	}

	/**
	 *
	 */
	public function editProperties()
	{
		$this->edit();
	}

	/**
	 *
	 */
	public function initEditForm()
	{
		$form = parent::initEditForm();
		$this->initEditCustomForm($form);
		return $form;
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
	public function save()
	{
		$this->saveObject();
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
	public function saveObject()
	{
		try
		{
			parent::saveObject();
		}
		catch(Exception $e)
		{
			if(
				$this->plugin->txt($e->getMessage()) != '-' . $e->getMessage() . '-' &&
				$this->plugin->txt($e->getMessage()) != '-rep_robj_xvid_' . $e->getMessage() . '-'
			)
			{
				ilUtil::sendFailure($this->plugin->txt($e->getMessage()), true);
			}
			else
			{
				ilUtil::sendFailure($e->getMessage(), true);
			}

			$this->ctrl->setParameterByClass('ilrepositorygui', 'ref_id', (int)$_GET['ref_id']);
			$this->ctrl->redirectByClass('ilrepositorygui');
		}
	}

	/**
	 * @see ilDesktopItemHandling::addToDesk()
	 */
	public function addToDeskObject()
	{
		/**
		 * @var $ilSetting ilSetting
		 */
		global $ilSetting;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::addToDesktop();
		ilUtil::sendSuccess($this->lng->txt('added_to_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @see ilDesktopItemHandling::removeFromDesk()
	 */
	public function removeFromDeskObject()
	{
		global $ilSetting;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::removeFromDesktop();
		ilUtil::sendSuccess($this->lng->txt('removed_from_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @param string $a_sub_type
	 * @param int    $a_sub_id
	 * @return ilObjectListGUI|ilObjInteractiveVideoListGUI
	 */
	protected function initHeaderAction($a_sub_type = null, $a_sub_id = null)
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		$lg = parent::initHeaderAction();
		
		if($lg instanceof ilObjInteractiveVideoListGUI)
		{
			if($ilUser->getId() != ANONYMOUS_USER_ID)
			{
				// Maybe handle notifications in future ...
			}
		}

		return $lg;
	}

	/**
	 *
	 */
	protected function setTabs()
	{
		/**
		 * @var $ilTabs   ilTabsGUI
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilTabs, $ilAccess;

		if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('content', $this->lng->txt('content'), $this->ctrl->getLinkTarget($this, 'showContent'));
		}

		$this->addInfoTab();

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editProperties', $this->lng->txt('settings'), $this->ctrl->getLinkTarget($this, 'editProperties'));
		}
		
		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', $this->plugin->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editComments'));
		}
		else if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', $this->plugin->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editMyComments'));
		}	

		$this->addPermissionTab();
	}

	/**
	 * @param string $a_tab
	 */
	public function setSubTabs($a_tab)
	{
		/**
		 * @var $ilTabs   ilTabsGUI
		 */
		global $ilTabs, $ilAccess;

		switch($a_tab)
		{
			case 'editComments':
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('editComments', $this->plugin->txt('questions_comments_sub_tab'),$this->ctrl->getLinkTarget($this,'editComments'));
				}
				$ilTabs->addSubTab('editMyComments', $this->plugin->txt('my_comments'),$this->ctrl->getLinkTarget($this,'editMyComments'));
				$ilTabs->addSubTab('showMyResults', $this->plugin->txt('show_my_results'), $this->ctrl->getLinkTarget($this, 'showMyResults'));
				
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('showResults', $this->plugin->txt('user_results'), $this->ctrl->getLinkTarget($this, 'showResults'));
					$ilTabs->addSubTab('showQuestionsResults', $this->plugin->txt('question_results'), $this->ctrl->getLinkTarget($this, 'showQuestionsResults'));
					$ilTabs->addSubTab('showCompleteOverviewOverAllResults', $this->plugin->txt('complete_question_results'), $this->ctrl->getLinkTarget($this, 'showCompleteOverviewOverAllResults'));
				}
				break;
		}
	}

    public function completeCsvExport()
    {
        
        global $lng;
        $simple = new SimpleChoiceQuestionStatistics();
        $data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);
       
        $csv = array();
        $separator = ";";

        $head_row = array();
        array_push($head_row, $lng->txt('name'));
        foreach ($data['question'] as $key => $row)
        {
            array_push($head_row, trim($row, '"'));
	        array_push($head_row, trim($row, '"') . ' ' .$this->plugin->txt('answers') );
        }
        array_push($head_row, $this->plugin->txt('answered') );
        array_push($head_row, $this->plugin->txt('sum'));
        array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
	    $ignore_colum = array('name','answerd', 'sum');
        foreach ($data['users'] as $key => $row)
        {
            $csvrow = array();
            foreach ( $row as $type => $value)
            {
	            array_push($csvrow, trim($value, '"'));
	            if(isset($data['answers'][$key][$type]))
	            {
		            array_push($csvrow, trim($data['answers'][$key][$type], '"'));
	            }
	            else if(!in_array($type, $ignore_colum))
	            {
		            array_push($csvrow, '');
	            }
            }
            array_push($csv, ilUtil::processCSVRow($csvrow, TRUE, $separator));
        }
        $csvoutput = "";
        foreach ($csv as $row)
        {
            $csvoutput .= join($row, $separator) . "\n";
        }
        ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
    }
}
