<?php
/* Copyright (c) 1998-2017 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Tracking/classes/class.ilLPStatusFactory.php';
require_once 'Services/Tracking/classes/class.ilLPObjSettings.php';
require_once 'Services/Tracking/classes/class.ilLearningProgressBaseGUI.php';
require_once 'Services/Tracking/classes/class.ilOnlineTracking.php';

/**
 * Class ilObjComment
 * @author Michael Jansen <mjansen@databay.de>
 * @ilCtrl_Calls ilInteractiveVideoLearningProgressGUI: ilLearningProgressGUI, ilInteractiveVideoLPSummaryTableGUI, ilInteractiveVideoLPUsersTableGUI
 */
class ilInteractiveVideoLearningProgressGUI extends ilLearningProgressBaseGUI
{

	/**
	 * @var ilObjInteractiveVideoGUI
	 */
	protected $gui;

	/**
	 * @var ilObjInteractiveVideo
	 */
	public $object;

	/**
	 * @var ilLanguage
	 */
	public $lng;

	/**
	 * @var ilCtrl
	 */
	public $ctrl;

	/**
	 * @var ilTemplate
	 */
	public $tpl;

	/**
	 * @var ilInteractiveVideoPlugin
	 */
	public $plugin;

	/**
	 * ilInteractiveVideoLearningProgressGUI constructor.
	 * @param ilObjInteractiveVideoGUI $gui
	 * @param ilObjInteractiveVideo    $object
	 */
	public function __construct(ilObjInteractiveVideoGUI $gui, ilObjInteractiveVideo $object)
	{
		global $tpl, $lng, $ilCtrl;

		$this->gui    = $gui;
		$this->object = $object;
		$this->plugin = $this->gui->getPluginInstance();

		$this->tpl  = $tpl;
		$this->lng  = $lng;
		$this->ctrl = $ilCtrl;
	}

	/**
	 * 
	 */
	public function executeCommand()
	{
		$cmd = $this->ctrl->getCmd();
		$this->$cmd();
	}

	/** LP related methods, maybe these could be move to another ilCtrl enabled class **/
	/**
	 * @return int
	 */
	public function getObjId()
	{
		return $this->object->getId();
	}

	private function addLearningProgressSubTabs()
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		if($this->gui->hasPermission('write') || $this->gui->hasPermission('read_learning_progress'))
		{
			if($this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED)
			{
				$ilTabs->addSubTab('lp_users', $this->gui->getPluginInstance()->txt('lp_users'), $this->ctrl->getLinkTarget($this, 'showLPUsers'));
				$ilTabs->addSubTab('lp_summary', $this->gui->getPluginInstance()->txt('lp_summary'), $this->ctrl->getLinkTarget($this, 'showLPSummary'));
			}
			$ilTabs->addSubTab('lp_settings', $this->lng->txt('trac_settings'), $this->ctrl->getLinkTarget($this, 'showLPSettings'));
		}
		else if($this->gui->hasPermission('read') && $this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED)
		{
			$ilTabs->addSubTab('lp_users', $this->gui->getPluginInstance()->txt('lp_users'), $this->ctrl->getLinkTarget($this, 'showLPUserDetails'));
		}
	}

    /**
     * @param ilPropertyFormGUI|null $form
     * @throws ilException
     * @throws ilObjectException
     */
	public function showLPSettings(ilPropertyFormGUI $form = null)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		$this->addLearningProgressSubTabs();
		$ilTabs->activateSubTab('lp_settings');

		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->getLearningProgressSettingsForm();
		}

		$this->tpl->setContent($form->getHTML());
	}

    /**
     * @return ilPropertyFormGUI
     * @throws ilException
     */
	public function getLearningProgressSettingsForm()
	{
		$form = new ilPropertyFormGUI();
		$form->setTitle($this->lng->txt('tracking_settings'));
		$form->setFormAction($this->ctrl->getFormAction($this, 'saveLearningProgressSettings'));

		$mod = new ilRadioGroupInputGUI($this->lng->txt('trac_mode'), 'modus');
		$mod->setRequired(true);
		$form->addItem($mod);

		foreach($this->object->getLPValidModes() as $mode)
		{
			if($this->object->isCoreLPMode($mode))
			{
				$opt = new ilRadioOption(
					ilLPObjSettings::_mode2Text($mode),
					$mode,
					ilLPObjSettings::_mode2InfoText($mode)
				);
			}
			else
			{
				$opt = new ilRadioOption(
					$this->gui->getPluginInstance()->txt('lp_mode_title_' . $this->object->getInternalLabelForLPMode($mode)),
					$mode,
					$this->gui->getPluginInstance()->txt('lp_mode_desc_' . $this->object->getInternalLabelForLPMode($mode))
				);
			}

			$mod->addOption($opt);
		}
		$mod->setValue($this->object->getLearningProgressMode());

		$form->addCommandButton('saveLearningProgressSettings', $this->lng->txt('save'));

		return $form;
	}

    /**
     * @throws ilException
     * @throws ilObjectException
     */
	public function saveLearningProgressSettings()
	{
		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		$form = $this->getLearningProgressSettingsForm();
		if($form->checkInput())
		{
			$this->addLearningProgressSubTabs();

			$new_mode     = (int)$form->getInput('modus');
			$old_mode     = (int)$this->object->getLearningProgressMode();
			$mode_changed = ($old_mode != $new_mode);

			$this->object->setLearningProgressMode($new_mode);
			$this->object->update();

			if($mode_changed)
			{
				include_once 'Services/Tracking/classes/class.ilLPStatusWrapper.php';
				ilLPStatusWrapper::_refreshStatus($this->object->getId());
			}

			ilUtil::sendSuccess($this->lng->txt('trac_settings_saved'), true);
			$this->ctrl->redirect($this, 'showLPSettings');
		}

		$form->setValuesByPost();
		$this->showLPSettings($form);
	}

    /**
     * @throws ilObjectException
     */
	public function showLPUsers()
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		$this->addLearningProgressSubTabs();
		$ilTabs->activateSubTab('lp_users');

		$this->gui->getPluginInstance()->includeClass('class.ilInteractiveVideoLPUsersTableGUI.php');
		$table = new ilInteractiveVideoLPUsersTableGUI($this, 'showLPUsers', $this->object->getId(), $this->object->getRefId(), false);
		$this->tpl->setContent(implode('<br />', array($table->getHTML(), $this->__getLegendHTML())));
	}

    /**
     * @throws ilObjectException
     */
	public function showLPSummary()
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		$this->addLearningProgressSubTabs();
		$ilTabs->activateSubTab('lp_summary');

		$this->gui->getPluginInstance()->includeClass('class.ilInteractiveVideoLPSummaryTableGUI.php');
		$table = new ilInteractiveVideoLPSummaryTableGUI($this, 'showLPSummary', $this->object->getRefId(), $this->gui->getPluginInstance());
		$this->tpl->setContent(implode('<br />', array($table->getHTML(), $this->__getLegendHTML())));
	}

    /**
     * @throws ilObjectException
     */
	public function showLPUserDetails()
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 * @var $ilUser ilObjuser
		 */
		global $ilTabs, $ilUser;

		$this->gui->ensurePermission('read');

		$this->addLearningProgressSubTabs();
		$ilTabs->activateSubTab('lp_summary');

		if($this->object->getLearningProgressMode() == ilObjInteractiveVideo::LP_MODE_DEACTIVATED)
		{
			$this->ctrl->redirect($this->gui, $this->gui->getStandardCmd());
		}

		include_once('./Services/InfoScreen/classes/class.ilInfoScreenGUI.php');
		$cloned_controller = clone $this;
		$cloned_controller->object = null;
		$info = new ilInfoScreenGUI($cloned_controller);
		$info->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
		$info->addSection($this->lng->txt('trac_learning_progress'));
		include_once("./Services/Tracking/classes/class.ilLearningProgressBaseGUI.php");
		$status = ilLearningProgressBaseGUI::__readStatus($this->object->getId(), $ilUser->getId());
		$status_path = ilLearningProgressBaseGUI::_getImagePathForStatus($status);
		$status_text = ilLearningProgressBaseGUI::_getStatusText($status);
		$info->addProperty($this->lng->txt('trac_status'), ilUtil::img($status_path, $status_text)." ".$status_text);
		include_once 'Services/Tracking/classes/class.ilLPMarks.php';
		if(strlen($mark = ilLPMarks::_lookupMark($ilUser->getId(), $this->object->getId())))
		{
			$info->addProperty($this->lng->txt('trac_mark'),$mark);
		}
		if(strlen($comment = ilLPMarks::_lookupComment($ilUser->getId(), $this->object->getId())))
		{
			$info->addProperty($this->lng->txt('trac_comment'),$comment);
		}

		$this->tpl->setContent(implode('<br />', array($info->getHTML(), $this->__getLegendHTML())));
	}

    /**
     * @param ilPropertyFormGUI|null $form
     * @throws ilDatabaseException
     * @throws ilDateTimeException
     * @throws ilObjectException
     * @throws ilObjectNotFoundException
     */
	public function editUser(ilPropertyFormGUI $form = null)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		$this->addLearningProgressSubTabs();
		$ilTabs->activateSubTab('lp_users');

		if(!isset($_GET['user_id']))
		{
			return $this->showLPUsers();
		}

		$user = ilObjectFactory::getInstanceByObjId((int)$_GET['user_id'], false);
		if(!$user instanceof ilObjUser)
		{
			return $this->showLPUsers();
		}

		include_once('./Services/InfoScreen/classes/class.ilInfoScreenGUI.php');
		$cloned_controller = clone $this;
		$cloned_controller->object = null;
		$info = new ilInfoScreenGUI($cloned_controller);
		$info->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
		$info->addSection($this->lng->txt('trac_user_data'));
		$info->addProperty($this->lng->txt('last_login'), ilDatePresentation::formatDate(new ilDateTime($user->getLastLogin(), IL_CAL_DATETIME)));
		$info->addProperty($this->lng->txt('trac_total_online'), ilDatePresentation::secondsToString(ilOnlineTracking::getOnlineTime($user->getId())));

		if(!$form instanceof ilPropertyFormGUI)
		{
			$form = $this->getLPMarksForm($user);

			include_once 'Services/Tracking/classes/class.ilLPMarks.php';
			$marks = new ilLPMarks($this->object->getId(), $user->getId());

			$form->setValuesByArray(array(
				'comment' => $marks->getComment(),
				'mark'    => $marks->getMark()
			));
		}

		$this->tpl->setContent(implode('<br />', array($form->getHtml(), $info->getHTML())));
	}

	/**
	 * @param ilObjUser $user
	 * @return ilPropertyFormGUI
	 */
	protected function getLPMarksForm(ilObjUser $user)
	{
		require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
		$form = new ilPropertyFormGUI();
		$this->ctrl->setParameter($this, 'user_id', $user->getId());
		$form->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
		$form->setTitle($this->lng->txt('edit'). ': '. $this->lng->txt('trac_learning_progress_tbl_header') . $user->getFullname() );
		$form->setDescription($this->lng->txt('trac_mode').': '.ilLPObjSettings::_mode2Text($this->object->getLearningProgressMode()));

		$mark = new ilTextInputGUI($this->lng->txt('trac_mark'), 'mark');
		$mark->setSize(5);
		$form->addItem($mark);

		$comment = new ilTextInputGUI($this->lng->txt('trac_comment'), 'comment');
		$form->addItem($comment);

		$form->addCommandButton('updateLPUsers', $this->lng->txt('save'));
		$form->addCommandButton('showLPUsers', $this->lng->txt('cancel'));

		return $form;
	}

    /**
     * @throws ilDatabaseException
     * @throws ilDateTimeException
     * @throws ilObjectException
     * @throws ilObjectNotFoundException
     */
	public function updateLPUsers()
	{
		$this->gui->ensureAtLeastOnePermission(array('write', 'read_learning_progress'));

		if(!isset($_GET['user_id']))
		{
			return $this->showLPUsers();
		}

		$user = ilObjectFactory::getInstanceByObjId((int)$_GET['user_id'], false);
		if(!$user instanceof ilObjUser)
		{
			return $this->showLPUsers();
		}

		$form = $this->getLPMarksForm($user);
		if($form->checkInput())
		{
			include_once 'Services/Tracking/classes/class.ilLPMarks.php';
			$marks = new ilLPMarks($this->object->getId(), $user->getId());
			$marks->setMark($form->getInput('mark'));
			$marks->setComment($form->getInput('comment'));
			$marks->update();
			ilUtil::sendSuccess($this->lng->txt('trac_update_edit_user'));
			return $this->showLPUsers();
		}

		$form->setValuesByPost();
		$this->editUser($form);
	}
}