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
		global $ilTabs, $tpl;
		$tpl->setDescription($this->object->getDescription());

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
					case 'updateProperties':
					case 'editProperties':
					case 'confirmDeleteComment':
					case 'deleteComment':
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
		$tpl_json = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);
		$simple_choice = new SimpleChoiceQuestion();
		$tpl_json->setVariable('JSON', $simple_choice->getJsonForCommentId((int) $_GET['comment_id']));
		$tpl_json->show("DEFAULT", false, true );
		exit();
	}

	public function postAnswerPerAjax()
	{
		$simple_choice = new SimpleChoiceQuestion();
		$simple_choice->saveAnswer((int) $_POST['qid'], ilUtil::stripSlashesRecursive($_POST['answer']));
		exit();
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
		global $tpl, $ilTabs;

		$ilTabs->activateTab('content');

		$tpl->addCss($this->plugin->getDirectory() . '/templates/default/xvid.css');
		ilObjMediaObjectGUI::includePresentationJS($tpl);

		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $this->plugin->getDirectory());

		$mob_id = $this->object->getMobId();
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$video_tpl->setVariable('VIDEO_SRC', $mob_dir . '/' . $media_item['location']);
		$video_tpl->setVariable('VIDEO_TYPE', $media_item['format']);

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());

		$stop_points = $this->objComment->getStopPoints();
		$comments = $this->objComment->getComments();
		$video_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('comment'));
		$video_tpl->setVariable('TXT_POST', $this->plugin->txt('post'));
		$video_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));

		$video_tpl->setVariable('STOP_POINTS', json_encode($stop_points));
		$video_tpl->setVariable('COMMENTS', json_encode($comments));

		$video_tpl->setVariable('FORM_ACTION', $this->ctrl->getFormAction($this, 'postComment'));
		require_once("./Services/UIComponent/Modal/classes/class.ilModalGUI.php");
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());
		$video_tpl->setVariable('QUESTION_GET_URL', $this->ctrl->getLinkTarget($this, 'getQuestionPerAjax', '', true, false));
		$video_tpl->setVariable('QUESTION_POST_URL', $this->ctrl->getLinkTarget($this, 'postAnswerPerAjax', '', true, false));
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionViewer.js');
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

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim(ilUtil::stripSlashes($_POST['comment_text'])));
		$comment->setCommentTime((float)$_POST['comment_time']);
		$comment->create();

		ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
		$this->showContent();
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

		$ilTabs->activateTab('editProperties');

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
		
		$comment_ids = $this->object->getCommentIdsByObjId($this->obj_id);
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

		$comment_ids = $this->object->getCommentIdsByObjId($this->obj_id);
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($this->lng->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure('invalid_comment_ids');
		}
		$this->editComments();
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	private function initCommentForm()
	{
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
		$form->setTitle($this->plugin->txt('insert_comment'));

		$this->plugin->includeClass('class.ilTimeInputGUI.php');
		$time = new ilTimeInputGUI($this->lng->txt('time'), 'comment_time');
		$time->setShowTime(true);
		$time->setShowSeconds(true);
		$form->addItem($time);

		$comment = new ilTextAreaInputGUI($this->lng->txt('comment'), 'comment_text');
		$comment->setRequired(true);
		$form->addItem($comment);

		$interactive = new ilCheckboxInputGUI($this->plugin->txt('interactive'), 'is_interactive');
		$form->addItem($interactive);
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

		$this->setSubTabs('editProperties');

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('editComments');

		$form = $this->initCommentForm();

		$form->addCommandButton('insertTutorComment', $this->lng->txt('insert'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
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
			$this->objComment->setInteractive((int)$form->getInput('is_interactive'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $comment_time['time']['h'] * 3600
				+ $comment_time['time']['m'] * 60
				+ $comment_time['time']['s'];
			$this->objComment->setCommentTime($seconds);
			$this->objComment->setIsTutor($is_tutor);
			$this->objComment->create();

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
		}
		else
		{
			$form->setValuesByPost();
			ilUtil::sendFailure($this->lng->txt('err_check_input'));
			return $this->showTutorInsertCommentForm();
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
	 * 
	 */
	public function editComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editProperties');
		$form = $this->initCommentForm();

		$frm_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($frm_id);

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateComment'));
		$form->setTitle($this->plugin->txt('edit_comment'));

		$form->addCommandButton('updateComment', $this->lng->txt('save'));
		$form->addCommandButton('editProperties', $this->lng->txt('cancel'));

		if(isset($_GET['comment_id']))
		{
			$comment_data             = $this->object->getCommentDataById((int)$_GET['comment_id']);
			$values['comment_id']     = $comment_data['comment_id'];
			$values['comment_time']   = $comment_data['comment_time'];
			$values['comment_text']   = $comment_data['comment_text'];
			$values['is_interactive'] = $comment_data['is_interactive'];

			$form->setValuesByArray($values, true);
		}
		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionCreator.js');
		$tpl->addCss($this->plugin->getDirectory() . '/templates/default/xvid.css');
		$simple_choice = new SimpleChoiceQuestion();
		$question_id = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);
		$question = new ilTemplate("tpl.simple_questions.html", true, true, $this->plugin->getDirectory());
		$question->setVariable('SINGLE_CHOICE', 'single_choice');
		$question->setVariable('MULTIPLE_CHOICE', 'multiple_choice');
		$question->setVariable('ANSWER_TEXT', 'answer_text');
		$question->setVariable('CORRECT_SOLUTION', 'correct_solution');	
		if($question_id > 0)
		{
			$question->setVariable('JSON', $simple_choice->getJsonForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
			$question->setVariable('QUESTION_TEXT', $simple_choice->getQuestionTextQuestionId($question_id));
		}
		else
		{
			$question->setVariable('JSON', json_encode(array()));
			$question->setVariable('QUESTION_TYPE', 0);
			$question->setVariable('QUESTION_TEXT', '');
		}
		$question->setVariable('QUESTION_ID', $question_id);
		$tpl->setContent($form->getHTML() . $question->get());
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
			$this->objComment->setInteractive((int)$form->getInput('is_interactive'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds      = $comment_time['time']['h'] * 3600
				+ $comment_time['time']['m'] * 60
				+ $comment_time['time']['s'];
			$this->objComment->setCommentTime($seconds);
			$this->objComment->update();
			$this->editComments();
			if((int)$form->getInput('is_interactive') === 1)
			{
				$question_id = $form->getInput('question_id');
				$question = new SimpleChoiceQuestion();
				if($question->checkInput())
				{
					$question->deleteQuestion($question_id);
					$question->create();
				}
				else
				{
					#$form->setValuesByPost();
					#ilUtil::sendFailure($this->lng->txt('err_check_input'));
					#return $this->editComment();
				}

			}
			else
			{
				$question = new SimpleChoiceQuestion();
				$question_id = $question->existQuestionForCommentId($comment_id);
				if($question_id > 0)
				{
					$question->deleteQuestion($question_id);
				}
			}
		}
		else
		{
			$form->setValuesByPost();
			$this->editComment();
		}
	}

	/**
	 *
	 */
	public function editComments()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editProperties');

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('editComments');

		$tbl_data = $this->object->getCommentsTableData();
		$this->plugin->includeClass('class.ilInteractiveVideoCommentsTableGUI.php');
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editComments');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function showResults()
	{
		global $tpl, $ilTabs;
		
		$this->setSubTabs('editProperties');

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('showResults');

		$simple = new SimpleChoiceQuestion();
		$tbl_data = $simple->getPointsForUsers($this->obj_id);
		$this->plugin->includeClass('class.SimpleChoiceQuestionsTableGUI.php');
		$tbl = new SimpleChoiceQuestionsTableGUI($this, 'showResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());

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
		// @todo: Store the new file (delegate to application class)
		if($a_form->getInput('video_file'))
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
		$upload_field->setSuffixes(array('mp4', 'mov'));
		$upload_field->setRequired(true);
		$form->addItem($upload_field);

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

		$this->setSubTabs('editProperties');

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('editProperties');

		$upload_field = new ilFileInputGUI($this->plugin->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov'));
		$a_form->addItem($upload_field);
	}

	/**
	 * @param array $a_values
	 */
	protected function getEditFormCustomValues(array &$a_values)
	{
		$a_values['video_file'] = ilObject::_lookupTitle($this->object->getMobId());
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
			$ilTabs->addTab('editProperties', $this->lng->txt('edit'), $this->ctrl->getLinkTarget($this, 'editProperties'));
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
		global $ilTabs;

		switch($a_tab)
		{
			case 'editProperties':
				$ilTabs->addSubTab('editProperties', $this->lng->txt('settings'),$this->ctrl->getLinkTarget($this,'editProperties'));
				$ilTabs->addSubTab('editComments', $this->plugin->txt('comments'),$this->ctrl->getLinkTarget($this,'editComments'));
				$ilTabs->addSubTab('showResults', $this->plugin->txt('results'),$this->ctrl->getLinkTarget($this,'showResults'));
				break;
		}
	}
}