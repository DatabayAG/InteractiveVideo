<?php
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
    protected ilLanguage $lng;

    /**
     * @var ilCtrlInterface|ilCtrl
     */
    protected ilCtrlInterface $ctrl;

    /**
     * @var ilGlobalTemplateInterface|mixed
     */
    protected ilGlobalTemplateInterface $tpl;

    /**
     * @var ilInteractiveVideoPlugin
     */
    public $plugin;

    /**
     * ilInteractiveVideoLearningProgressGUI constructor.
     * @param ilObjInteractiveVideoGUI $gui
     * @param ilObjInteractiveVideo $object
     */
    public function __construct(ilObjInteractiveVideoGUI $gui, ilObjInteractiveVideo $object)
    {
        global $tpl, $lng, $ilCtrl;

        $this->gui = $gui;
        $this->object = $object;
        $this->plugin = $this->gui->getPluginInstance();

        $this->tpl = $tpl;
        $this->lng = $lng;
        $this->ctrl = $ilCtrl;
    }

    /**
     *
     */
    public function executeCommand(): void
    {
        $cmd = $this->ctrl->getCmd();
        $this->$cmd();
    }

    /** LP related methods, maybe these could be move to another ilCtrl enabled class **/
    /**
     * @return int
     */
    public function getObjId(): int
    {
        return $this->object->getId();
    }

    /**
     * @throws ilCtrlException
     */
    private function addLearningProgressSubTabs(): void
    {
        /**
         * @var $ilTabs ilTabsGUI
         */
        global $ilTabs;

        if ($this->gui->hasPermission('write') || $this->gui->hasPermission('read_learning_progress')) {
            if ($this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED) {
                $ilTabs->addSubTab('lp_users', $this->gui->getPluginInstance()->txt('lp_users'),
                    $this->ctrl->getLinkTarget($this, 'showLPUsers'));
                $ilTabs->addSubTab('lp_summary', $this->gui->getPluginInstance()->txt('lp_summary'),
                    $this->ctrl->getLinkTarget($this, 'showLPSummary'));
            }
            $ilTabs->addSubTab('lp_settings', $this->lng->txt('trac_settings'),
                $this->ctrl->getLinkTarget($this, 'showLPSettings'));
        } else {
            if ($this->gui->hasPermission('read') && $this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED) {
                $ilTabs->addSubTab('lp_users', $this->gui->getPluginInstance()->txt('lp_users'),
                    $this->ctrl->getLinkTarget($this, 'showLPUserDetails'));
            }
        }
    }

    /**
     * @param ilPropertyFormGUI|null $form
     * @throws ilCtrlException
     * @throws ilException
     * @throws ilObjectException
     */
    public function showLPSettings(ilPropertyFormGUI $form = null): void
    {
        /**
         * @var $ilTabs ilTabsGUI
         */
        global $ilTabs;

        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        $this->addLearningProgressSubTabs();
        $ilTabs->activateSubTab('lp_settings');

        if (!($form instanceof ilPropertyFormGUI)) {
            $form = $this->getLearningProgressSettingsForm();
        }

        $this->tpl->setContent($form->getHTML());
    }

    /**
     * Init property form
     * @return ilPropertyFormGUI $form
     * @throws ilCtrlException
     * @throws ilException
     */
    public function getLearningProgressSettingsForm(): ilPropertyFormGUI
    {
        $form = new ilPropertyFormGUI();
        $form->setTitle($this->lng->txt('tracking_settings'));
        $form->setFormAction($this->ctrl->getFormAction($this, 'saveLearningProgressSettings'));

        $mod = new ilRadioGroupInputGUI($this->lng->txt('trac_mode'), 'modus');
        $mod->setRequired(true);
        $form->addItem($mod);

        foreach ($this->object->getLPValidModes() as $mode) {
            if ($this->object->isCoreLPMode($mode)) {
                $opt = new ilRadioOption(
                    ilLPObjSettings::_mode2Text($mode),
                    $mode,
                    ilLPObjSettings::_mode2InfoText($mode)
                );
            } else {
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
     * Save learning progress settings
     * @throws ilCtrlException
     * @throws ilCtrlException
     */
    public function saveLearningProgressSettings(): void
    {
        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        $form = $this->getLearningProgressSettingsForm();
        if ($form->checkInput()) {
            $this->addLearningProgressSubTabs();

            $new_mode = (int) $form->getInput('modus');
            $old_mode = $this->object->getLearningProgressMode();
            $mode_changed = ($old_mode != $new_mode);

            $this->object->setLearningProgressMode($new_mode);
            $this->object->update();

            $this->tpl->setOnScreenMessage("success", $this->lng->txt('trac_settings_saved'), true);

            if ($mode_changed) {
                $this->ctrl->redirect($this, 'refreshStatusAndShowLPSettings');
            }

            $this->ctrl->redirect($this, 'showLPSettings');
        }

        $form->setValuesByPost();
        $this->showLPSettings($form);
    }

    /**
     * 
     */
    public function refreshStatusAndShowLPSettings(): void
    {
        $this->object->refreshLearningProgress();

        $this->showLPSettings();
    }

    /**
     *
     */
    public function showLPUsers(): void
    {
        /**
         * @var $ilTabs ilTabsGUI
         */
        global $ilTabs;

        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        $this->addLearningProgressSubTabs();
        $ilTabs->activateSubTab('lp_users');

        $table = new ilInteractiveVideoLPUsersTableGUI($this, 'showLPUsers', $this->object->getId(),
            $this->object->getRefId(), false);
        $this->tpl->setContent(implode('<br />', [$table->getHTML(), $this->__getLegendHTML()]));
    }

    /**
     *
     */
    public function showLPSummary(): void
    {
        /**
         * @var $ilTabs ilTabsGUI
         */
        global $ilTabs;

        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        $this->addLearningProgressSubTabs();
        $ilTabs->activateSubTab('lp_summary');

        $table = new ilInteractiveVideoLPSummaryTableGUI($this, 'showLPSummary', $this->object->getRefId());
        $this->tpl->setContent(implode('<br />', [$table->getHTML(), $this->__getLegendHTML()]));
    }

    /**
     * @throws ilObjectNotFoundException
     * @throws ilCtrlException
     * @throws ilDatabaseException
     * @throws ilDateTimeException
     */
    public function showLPUserDetails(): void
    {
        /**
         * @var $ilTabs ilTabsGUI
         * @var $ilUser ilObjuser
         */
        global $ilTabs, $ilUser;

        $this->gui->ensurePermission('read');

        $this->addLearningProgressSubTabs();
        $ilTabs->activateSubTab('lp_summary');

        if ($this->object->getLearningProgressMode() == ilObjInteractiveVideo::LP_MODE_DEACTIVATED) {
            $this->ctrl->redirect($this->gui, $this->gui->getStandardCmd());
        }

        $cloned_controller = clone $this;
        $cloned_controller->object = null;
        $info = new ilInfoScreenGUI($cloned_controller);
        $info->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
        $info->addSection($this->lng->txt('trac_learning_progress'));
        $status = ilLearningProgressBaseGUI::__readStatus($this->object->getId(), $ilUser->getId());
        $status_path = ilLearningProgressBaseGUI::_getImagePathForStatus($status);
        $status_text = ilLearningProgressBaseGUI::_getStatusText($status);
        $info->addProperty($this->lng->txt('trac_status'),
            ilUtil::img($status_path, $status_text) . " " . $status_text);
        if (strlen($mark = ilLPMarks::_lookupMark($ilUser->getId(), $this->object->getId()))) {
            $info->addProperty($this->lng->txt('trac_mark'), $mark);
        }
        if (strlen($comment = ilLPMarks::_lookupComment($ilUser->getId(), $this->object->getId()))) {
            $info->addProperty($this->lng->txt('trac_comment'), $comment);
        }

        $this->tpl->setContent(implode('<br />', [$info->getHTML(), $this->__getLegendHTML()]));
    }

    /**
     * @param ilPropertyFormGUI|null $form
     * @return void|null
     * @throws ilCtrlException
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

        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        $this->addLearningProgressSubTabs();
        $ilTabs->activateSubTab('lp_users');

        if (!isset($_GET['user_id'])) {
            return $this->showLPUsers();
        }

        $user = ilObjectFactory::getInstanceByObjId((int) $_GET['user_id'], false);
        if (!$user instanceof ilObjUser) {
            return $this->showLPUsers();
        }

        $cloned_controller = clone $this;
        $cloned_controller->object = null;
        $info = new ilInfoScreenGUI($cloned_controller);
        $info->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
        $info->addSection($this->lng->txt('trac_user_data'));
        $info->addProperty($this->lng->txt('last_login'),
            ilDatePresentation::formatDate(new ilDateTime($user->getLastLogin(), IL_CAL_DATETIME)));
        $info->addProperty($this->lng->txt('trac_total_online'),
            ilDatePresentation::secondsToString(ilOnlineTracking::getOnlineTime($user->getId())));

        if (!$form instanceof ilPropertyFormGUI) {
            $form = $this->getLPMarksForm($user);

            $marks = new ilLPMarks($this->object->getId(), $user->getId());

            $form->setValuesByArray([
                'comment' => $marks->getComment(),
                'mark' => $marks->getMark()
            ]);
        }

        $this->tpl->setContent(implode('<br />', [$form->getHtml(), $info->getHTML()]));
    }

    /**
     * @param ilObjUser $user
     * @return ilPropertyFormGUI
     * @throws ilCtrlException
     */
    protected function getLPMarksForm(ilObjUser $user): ilPropertyFormGUI
    {
        $form = new ilPropertyFormGUI();
        $this->ctrl->setParameter($this, 'user_id', $user->getId());
        $form->setFormAction($this->ctrl->getFormAction($this, 'editUser'));
        $form->setTitle($this->lng->txt('edit') . ': ' . $this->lng->txt('trac_learning_progress_tbl_header') . $user->getFullname());
        $form->setDescription($this->lng->txt('trac_mode') . ': ' . ilLPObjSettings::_mode2Text($this->object->getLearningProgressMode()));

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
     * @throws ilObjectNotFoundException
     * @throws ilCtrlException
     * @throws ilDatabaseException
     * @throws ilObjectException
     * @throws ilDateTimeException
     */
    public function updateLPUsers()
    {
        $this->gui->ensureAtLeastOnePermission(['write', 'read_learning_progress']);

        if (!isset($_GET['user_id'])) {
            return $this->showLPUsers();
        }

        $user = ilObjectFactory::getInstanceByObjId((int) $_GET['user_id'], false);
        if (!$user instanceof ilObjUser) {
            return $this->showLPUsers();
        }

        $form = $this->getLPMarksForm($user);
        if ($form->checkInput()) {
            $marks = new ilLPMarks($this->object->getId(), $user->getId());
            $marks->setMark($form->getInput('mark'));
            $marks->setComment($form->getInput('comment'));
            $marks->update();
            $this->tpl->setOnScreenMessage("success", $this->lng->txt('trac_update_edit_user'), true);
            return $this->showLPUsers();
        }

        $form->setValuesByPost();
        $this->editUser($form);
    }

    public function getCtrl(): ilCtrlInterface
    {
        return $this->ctrl;
    }
}
