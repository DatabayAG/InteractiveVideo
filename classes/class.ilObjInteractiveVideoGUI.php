<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Repository/classes/class.ilObjectPluginGUI.php';
require_once 'Services/PersonalDesktop/interfaces/interface.ilDesktopItemHandling.php';
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
include_once("./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.xvidUtils.php");
include_once("./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilObjComment.php");

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
	public $objComment = 0;

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
				return;
				break;

			case 'ilpublicuserprofilegui':
				require_once 'Services/User/classes/class.ilPublicUserProfileGUI.php';
				$profile_gui = new ilPublicUserProfileGUI($_GET['user']);
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

					default:
						if(method_exists($this, $cmd))
						{
							$this->checkPermission('read');
							$this->$cmd();
						}
						else
						{
							throw new ilException(sprintf("Unsupported command %s", $cmd));
						}
						break;
				}
				break;
		}

		$this->addHeaderAction();
	}

	public function showContent()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('content');

		$tpl->addJavaScript($this->plugin->getDirectory() . '/js/jquery.scrollbox.js');
		$tpl->addCss($this->plugin->getDirectory() . '/templates/default/xvid.css');

		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $this->plugin->getDirectory());
		require_once("./Services/MediaObjects/classes/class.ilObjMediaObject.php");
		require_once("./Services/MediaObjects/classes/class.ilObjMediaObjectGUI.php");

		$mob_id = $this->object->getMobId();

		ilObjMediaObjectGUI::includePresentationJS($tpl);

		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$video_tpl->setVariable('VIDEO_SRC', $mob_dir . '/' . $media_item['location']);
		$video_tpl->setVariable('VIDEO_TYPE', $media_item['format']);

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());

		$stop_points = $this->objComment->getStopPoints();
		$video_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('comment'));
		$video_tpl->setVariable('TXT_POST', $this->plugin->txt('post'));
		$video_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));
		
		$video_tpl->setVariable('STOP_POINTS', json_encode($stop_points));

		$comments = $this->objComment->getCommentTexts();
		
		$i = 1;
		foreach($comments as $comment_text)
		{
			$video_tpl->setCurrentBlock('comments_list');
			$video_tpl->setVariable('C_INDEX', $i);
			$video_tpl->setVariable('COMMENT_TEXT', $comment_text);
			$video_tpl->parseCurrentBlock();
			$i++;
		}

		$target = $this->ctrl->getLinkTarget($this, 'postComment', '', true, false);
		$video_tpl->setVariable('FORM_ACTION', $target);
		$tpl->setContent($video_tpl->get());
		return;

	}

	public function postComment()
	{
		global $ilUser, $lng;
		$comment_text = array();
		$comment_text = (string)$_POST['comment_text'];

		if(isset($comment_text) && strlen($comment_text) > 0)
		{
			$user_id = $ilUser->getId();

			$objComment = new ilObjComment();
			$objComment->setObjId($this->obj_id);
			$objComment->setUserId($user_id);
			$objComment->setCommentText($comment_text);
			$objComment->setCommentTime((int)$_POST['comment_time']);

			$objComment->insertComment();
		}
		return $this->showContent();
	}

	public function confirmDeleteComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 * @var $lng    ilLanguage
		 */
		global $tpl, $ilTabs, $lng;

		$ilTabs->activateTab('editProperties');
		$tpl->getStandardTemplate();
		if(!isset($_POST['comment_id']))
		{
			ilUtil::sendFailure($lng->txt('select_one'));
			$this->editProperties();
		}
		include_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteComment'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_comment'));
		$confirm->setConfirm($lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($lng->txt('cancel'), 'editComments');
		if(is_array($_POST['comment_id']))
		{
			foreach((array)$_POST['comment_id'] as $comment_id)
			{
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}
		}
		$tpl->setContent($confirm->getHTML());
	}

	public function deleteComment()
	{
		/**
		 * @var $lng    ilLanguage
		 */
		global $lng;
		if(!isset($_POST['comment_id']))
		{
			ilUtil::sendFailure($lng->txt('error_sry_error'));
		}

		if(is_array($_POST['comment_id']))
		{
			$this->object->deleteComments($_POST['comment_id']);
		}

		$this->editComments();
	}

	private function initCommentForm()
	{
		/**
		 * @var $lng    ilLanguage
		 */
		global $lng;
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
		$form->setTitle($this->lng->txt('insert_comment'));

		include_once $this->plugin->getDirectory() . '/classes/class.ilTimeInputGUI.php';
		$time = new ilTimeInputGUI($lng->txt('time'), 'comment_time');
		$time->setShowTime(true);
		$time->setShowSeconds(true);
		$form->addItem($time);

		$comment = new ilTextAreaInputGUI($this->lng->txt('comment'), 'comment_text');
		$form->addItem($comment);

		$interactive = new ilCheckboxInputGUI($this->lng->txt('interactive'), 'is_interactive');
		$form->addItem($interactive);
		return $form;
	}

	public function showTutorInsertCommentForm()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 * @var $lng    ilLanguage
		 * @var $ilUser ilObjUser
		 * @var $ilLog  ilLog
		 */
		global $tpl, $ilTabs, $lng, $ilUser, $ilLog;

		$ilTabs->activateTab('editProperties');
		$tpl->getStandardTemplate();

		$form = $this->initCommentForm();

		$form->addCommandButton('insertTutorComment', $lng->txt('insert'));
		$form->addCommandButton('editComments', $lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	public function showLearnerCommentForm()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 * @var $lng    ilLanguage
		 * @var $ilUser ilObjUser
		 * @var $ilLog  ilLog
		 */
		global $tpl, $ilTabs, $lng, $ilUser, $ilLog;

		$ilTabs->activateTab('showContent');
		$tpl->getStandardTemplate();

		$form = $this->initCommentForm();
		$form->addCommandButton('insertLearnerComment', $lng->txt('insert'));
		$form->addCommandButton('showContent', $lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	public function insertTutorComment()
	{
		$this->insertComment(1);
	}

	public function insertLearnerComment()
	{
		$this->insertComment(0);
	}

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
			$this->objComment->insertComment();
		}

		$is_tutor ? $cmd = 'editComments' : $cmd = 'showContent';
		return $this->$cmd();
	}

	public function editComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 * @var $lng    ilLanguage
		 * @var $ilUser ilObjUser
		 * @var $ilLog  ilLog
		 */
		global $tpl, $ilTabs, $lng, $ilUser, $ilLog;

		$ilTabs->activateTab('editProperties');
		$form = $this->initCommentForm();

		$frm_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($frm_id);

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateComment'));
		$form->setTitle($this->lng->txt('edit_comment'));

		$form->addCommandButton('updateComment', $lng->txt('save'));
		$form->addCommandButton('editProperties', $lng->txt('cancel'));

		if(isset($_GET['comment_id']))
		{
			$comment_data             = $this->object->getCommentDataById((int)$_GET['comment_id']);
			$values['comment_id']     = $comment_data['comment_id'];
			$values['comment_time']   = $comment_data['comment_time'];
			$values['comment_text']   = $comment_data['comment_text'];
			$values['is_interactive'] = $comment_data['is_interactive'];

			$form->setValuesByArray($values, true);
		}
		$tpl->setContent($form->getHTML());
		return;
	}

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

			$this->objComment->updateComment();
			return $this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			return $this->editComment();
		}
	}

	public function editProperties()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editProperties');
		$this->setSubTabs('editProperties');
		$ilTabs->activateSubTab('editProperties');

		$tpl->getStandardTemplate();
		
		$form = $this->initEditForm();
		
		$tpl->setContent($form->getHTML());
		return;
	}

	public function editComments()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editProperties');
		$this->setSubTabs('editProperties');
		$ilTabs->activateSubTab('editComments');

		$tpl->getStandardTemplate();
		$tbl_data = $this->object->getCommentsTableData();
		include_once $this->plugin->getDirectory() . '/classes/class.ilInteractiveVideoCommentsTableGUI.php';
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editComments');

		$tbl->setData($tbl_data);

		$tpl->setContent($tbl->getHTML());
		return;
	}

	
	public function setSubTabs($a_tab)
	{
		global $ilTabs, $lng;

		switch ($a_tab)
		{
			case 'editProperties':
				$ilTabs->addSubTab("editProperties",$lng->txt("editProperties"),$this->ctrl->getLinkTarget($this,'editProperties'));

				$ilTabs->addSubTab("editComments",$lng->txt("editComments"),$this->ctrl->getLinkTarget($this,'editComments'));
		}
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
	public function initEditForm()
	{
		$form = parent::initEditForm();

		$upload_field = new ilFileInputGUI($this->plugin->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov'));
		$upload_field->setRequired(true);
		$upload_field->setInfo('... info filename');
		$form->addItem($upload_field);

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
		/**
		 * @var $ilCtrl ilCtrl
		 */
		global $ilCtrl;

		try
		{
			parent::saveObject();
		}
		catch(Exception $e)
		{
			if($this->plugin->txt($e->getMessage()) != '-' . $e->getMessage() . '-')
			{
				ilUtil::sendFailure($this->plugin->txt($e->getMessage()), true);
			}

			$ilCtrl->setParameterByClass('ilrepositorygui', 'ref_id', (int)$_GET['ref_id']);
			$ilCtrl->redirectByClass('ilrepositorygui');
		}
	}

	/**
	 * @see ilDesktopItemHandling::addToDesk()
	 */
	public function addToDeskObject()
	{
		/**
		 * @var $ilSetting ilSetting
		 * @var $lng       ilLanguage
		 */
		global $ilSetting, $lng;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::addToDesktop();
		ilUtil::sendSuccess($lng->txt('added_to_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @see ilDesktopItemHandling::removeFromDesk()
	 */
	public function removeFromDeskObject()
	{
		global $ilSetting, $lng;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::removeFromDesktop();
		ilUtil::sendSuccess($lng->txt('removed_from_desktop'), true);
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
		 * @var $ilCtrl   ilCtrl
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilTabs, $ilCtrl, $ilAccess;

		if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('content', $this->lng->txt('content'), $ilCtrl->getLinkTarget($this, 'showContent'));
		}

		$this->addInfoTab();

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editProperties', $this->lng->txt('edit'), $ilCtrl->getLinkTarget($this, 'editProperties'));
		}

		$this->addPermissionTab();
	}
}