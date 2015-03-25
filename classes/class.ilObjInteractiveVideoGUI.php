<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Repository/classes/class.ilObjectPluginGUI.php';
require_once 'Services/PersonalDesktop/interfaces/interface.ilDesktopItemHandling.php';
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
include_once("./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.xvidUtils.php");
include_once("./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilObjComment.php");
/**
 * Class ilObjInteractiveVideoGUI
 * @author Nadia Ahmad <nahmad@databay.de>
          
 * @ilCtrl_isCalledBy 	ilObjInteractiveVideoGUI: ilRepositoryGUI, ilAdministrationGUI, ilObjPluginDispatchGUI
 * @ilCtrl_Calls 		ilObjInteractiveVideoGUI: ilPermissionGUI, ilInfoScreenGUI, ilObjectCopyGUI, ilRepositorySearchGUI, ilPublicUserProfileGUI, ilCommonActionDispatcherGUI, ilMDEditorGUI
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

//	public function __construct()
//	{
//		parent::__construct();
//		
//		$this->objComment = new ilObjComment();
//		$this->objComment->setRefId($this->ref_id);
//	}
//	
	
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
				$ilTabs->activateTab('members');
				$this->setSubTabs('members');
				require_once 'Services/User/classes/class.ilPublicUserProfileGUI.php';
				$profile_gui = new ilPublicUserProfileGUI($_GET["user"]);
				$profile_gui->setBackUrl($this->ctrl->getLinkTarget($this, 'showParticipantsGallery'));
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
							
						}	
						break;
				}
				break;
		}
	}

	public function showContent()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 * @var $lng    ilLanguage
		 * @var $ilUser ilObjUser
		 * @var $ilLog  ilLog
		 */
		global $tpl, $ilTabs, $lng, $ilUser, $ilLog;

		$ilTabs->activateTab('content');
		$tpl->getStandardTemplate();
		$tpl->addJavaScript($this->plugin->getDirectory().'/js/jquery.scrollbox.js');
		$tpl->addCss($this->plugin->getDirectory().'/templates/default/xvid.css');
		
		$video_tpl =  new ilTemplate("tpl.video_tpl.html", true, true, $this->plugin->getDirectory());
		require_once("./Services/MediaObjects/classes/class.ilObjMediaObject.php");
		require_once("./Services/MediaObjects/classes/class.ilObjMediaObjectGUI.php");

		$mob_id = $this->object->getMobIdByRefId($this->ref_id);
		
		ilObjMediaObjectGUI::includePresentationJS($tpl);

		$mob_dir = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');
		
		$video_tpl->setVariable('VIDEO_SRC', $mob_dir.'/'.$media_item['location']);
		$video_tpl->setVariable('VIDEO_TYPE', $media_item['format']);
		
		$this->objComment = new ilObjComment();
		$this->objComment->setRefId($this->ref_id);
		
		$comments = $this->objComment->getStopPoints();
		$video_tpl->setVariable('STOP_POINTS', json_encode(array_keys($comments)));
		
		$i = 1;
		foreach(array_values($comments) as $comment_text)
		{
			$video_tpl->setCurrentBlock('comments_list');
			$video_tpl->setVariable('C_INDEX', $i);
			$video_tpl->setVariable('COMMENT_TEXT', $comment_text);
			$video_tpl->parseCurrentBlock();
			$i++;
			
		}	
		
		$video_tpl->setVariable('COMMENT_FORM', $this->showCommentForm());
		
		
		$tpl->setContent($video_tpl->get());
		return;
		
	}
	
	public function showCommentForm()
	{
		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'postComment'));
		$input = new ilTextAreaInputGUI($this->lng->txt('comment'), 'comment_text');
		$form->addItem($input);
		$form->addCommandButton('postComment', $this->lng->txt('post'));
		$form->addCommandButton('showContent', $this->lng->txt('cancel'));
		
		return $form->getHTML();
		
	}	
	
	public function postComment()
	{
		global $ilUser, $lng;
		$p = $_POST;
		
		$comment_text = $_POST['comment_text'];
		$user_id = $ilUser->getId();
		
		$objComment = new ilObjComment();
		$objComment->setMobId($this->object->getMobId());
		$objComment->setRefId($this->ref_id);
		$objComment->setUserId($user_id);
		$objComment->setCommentText($comment_text);
		
		$this->showContent();
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
		$confirm->setHeaderText($lng->txt('sure_delete'));
		$confirm->setConfirm($lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($lng->txt('cancel'), 'editProperties');
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
		
		$this->editProperties();
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

		include_once $this->plugin->getDirectory().'/classes/class.ilTimeInputGUI.php';
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
		$form->addCommandButton('editProperties',$lng->txt('cancel'));

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
		$form->addCommandButton('showContent',$lng->txt('cancel'));

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
			
			$this->objComment->setRefId($this->ref_id);
			$this->objComment->setCommentText($form->getInput('comment_text'));
			$this->objComment->setInteractive((int)$form->getInput('is_interactive'));
			
			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$seconds = $comment_time['time']['h'] * 3600
			 			+ $comment_time['time']['m'] * 60
						+ $comment_time['time']['s'];
			$this->objComment->setCommentTime($seconds);
			
			$mob_id = $this->object->getMobIdByRefId($this->ref_id);
			$this->objComment->setMobId($mob_id);
			$this->objComment->setIsTutor($is_tutor);

			$this->objComment->insertComment();
		}
		
		$is_tutor ? $cmd = 'editProperties': $cmd = 'showContent';
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
		$this->object->setIsTutor(1);
		$form = $this->initCommentForm();

		$frm_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($frm_id);
		
		$form->setFormAction($this->ctrl->getFormAction($this, 'updateComment'));
		$form->setTitle($this->lng->txt('edit_comment'));
		
		$form->addCommandButton('updateComment', $lng->txt('save'));
		$form->addCommandButton('editProperties', $lng->txt('cancel'));
		
		if(isset($_GET['comment_id']))
		{
			$comment_data = $this->object->getCommentDataById((int)$_GET['comment_id']);
			$values['comment_id']	= $comment_data['comment_id'];
			$values['comment_time'] = $comment_data['comment_time'];
			$values['comment_text'] = $comment_data['comment_text'];
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
			$seconds = $comment_time['time']['h'] * 3600
				+ $comment_time['time']['m'] * 60
				+ $comment_time['time']['s'];
			$this->objComment->setCommentTime($seconds);
			
			
			$this->objComment->updateComment();
			return $this->editProperties();
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
	 * @var $lng    ilLanguage
	 * @var $ilUser ilObjUser
	 * @var $ilLog  ilLog
	 */
		global $tpl, $ilTabs, $lng, $ilUser, $ilLog;

		$ilTabs->activateTab('editProperties');
		$this->object->setIsTutor(1);
		
		$tpl->getStandardTemplate();
		$tbl_data = $this->object->getCommentsTableData();
		include_once $this->plugin->getDirectory().'/classes/class.ilInteractiveVideoCommentsTableGUI.php';
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editProperties');

		$tbl->setData($tbl_data);

		$tpl->setContent($tbl->getHTML());
		return;
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

	public function afterSave(ilObjInteractiveVideo $newObj)
	{
		include_once("./Services/MediaObjects/classes/class.ilObjMediaObject.php");
		$new_file = $_FILES['video_file'];

		if(isset($new_file) && is_array($new_file))
		{
			$mob = new ilObjMediaObject();

			$mob->setTitle($new_file['name']);
			$mob->setDescription("");
			$mob->create();
			
			$mob_dir = ilObjMediaObject::_getDirectory($mob->getId());
			if(!is_dir($mob_dir))
			{
				$mob->createDirectory();
			}

			$media_item = new ilMediaItem();
			$mob->addMediaItem($media_item);
			$media_item->setPurpose("Standard");

			$file = $mob_dir . "/" . $new_file['name'];
			ilUtil::moveUploadedFile($new_file['tmp_name'],	$new_file['name'], $file, false, $_POST["action"]);

			// get mime type
			$format   = ilObjMediaObject::getMimeType($file);
			$location = $new_file['name'];

			// set real meta and object data
			$media_item->setFormat($format);
			$media_item->setLocation($location);
			$media_item->setLocationType("LocalFile");

			$mob->setDescription($format);

			// determine width and height of known image types
			$wh = ilObjMediaObject::_determineWidthHeight(500, 400, $format,
				"File", $mob_dir . "/" . $location, $media_item->getLocation(),
				true, true, "", "");
			$media_item->setWidth($wh["width"]);
			$media_item->setHeight($wh["height"]);

			$media_item->setHAlign("Left");
			ilUtil::renameExecutables($mob_dir);
			$mob->update();
			
			$newObj->saveMobIdForRefId($mob->getId(), $newObj->getRefId());
		}
		parent::afterSave($newObj);
	}
	
	
	public function beforeDelete()
	{
		include_once("./Services/MediaObjects/classes/class.ilObjMediaObject.php");
		
		$mob = new ilObjMediaObject($this->obj_id);
		$mob->delete();
	}
	
	/**
	 * @see ilDesktopItemHandling::addToDesk()
	 */
	public function addToDeskObject()
	{
		/**
		 * @var $ilSetting ilSetting
		 * @var $lng ilLanguage
		 */
		global $ilSetting, $lng;
		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->showContent();
			return;
		}
		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::addToDesktop();
		ilUtil::sendSuccess($lng->txt('added_to_desktop'));
		$this->showContent();
	}
	/**
	 * @see ilDesktopItemHandling::removeFromDesk()
	 */
	public function removeFromDeskObject()
	{
		global $ilSetting, $lng;
		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->showContent();
			return;
		}
		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::removeFromDesktop();
		ilUtil::sendSuccess($lng->txt('removed_from_desktop'));
		$this->showContent();
	}
	
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

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$this->addPermissionTab();
		}
		return;
	}
}