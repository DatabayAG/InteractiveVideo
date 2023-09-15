<?php
/**
 * Class ilInteractiveVideoLPUsersTableGUI
 */
class ilInteractiveVideoLPUsersTableGUI extends ilTrObjectUsersPropsTableGUI
{
	/**
	 * ilInteractiveVideoLPUsersTableGUI constructor.
	 * @param        $a_parent_obj
	 * @param string $a_parent_cmd
	 * @param string $a_obj_id
	 * @param        $a_ref_id
	 * @param bool   $a_print_view
	 */
	function __construct(?object $a_parent_obj, string $a_parent_cmd, int $a_obj_id, int $a_ref_id, $a_print_view = false)
	{
		parent::__construct($a_parent_obj, $a_parent_cmd, $a_obj_id, $a_ref_id, true); 
		$this->setPrintMode($a_print_view);
		$this->setRowTemplate("tpl.object_users_props_row.html", $this->parent_obj->plugin->getDirectory());
		if(!$a_print_view)
		{
			$this->addColumn($this->lng->txt("actions"), "");
		}
	}

	/**
	 * {@inheritdoc}
	 */
	protected function parseTitle($a_obj_id, $action, $a_user_id = false): void
	{
		/**
		 * @var $lng ilLanguage
		 * @var $ilObjDataCache ilObjectDataCache
		 * @var $ilUser ilObjUser
		 */
		global $lng, $ilObjDataCache, $ilUser;

		$user = '';
		if($a_user_id)
		{
			if($a_user_id != $ilUser->getId())
			{
				$a_user = ilObjectFactory::getInstanceByObjId($a_user_id);
			}
			else
			{
				$a_user = $ilUser;
			}
			$user .= ', '.$a_user->getFullName();
		}

		$this->setTitle($lng->txt($action).': '.$ilObjDataCache->lookupTitle($a_obj_id).$user);
		$olp = ilObjectLP::getInstance($a_obj_id);
		$this->setDescription($this->lng->txt('trac_mode').': '.$olp->getModeText($this->parent_obj->object->getLearningProgressMode()));
	}

	/**
	 * {@inheritdoc}
	 */
    protected function isPercentageAvailable(int $a_obj_id): bool
	{
		if($this->isLearningProgressDeactivated())
		{
			return false;
		}

		return true;
	}

	/**
	 * {@inheritdoc}
	 */
    public function searchFilterListener(int $a_ref_id, array $a_data): bool
	{
		$status = parent::searchFilterListener($a_ref_id, $a_data);

		if(
			$status &&
			$this->isLearningProgressDeactivated()
		)
		{
			$status = false;
		}

		return $status;
	}

	/**
				 * {@inheritdoc}
				 * @return mixed[]
				 */
				protected function getSelectableUserColumns(
        int $a_in_course = 0,
        int $a_in_group = 0
    ): array
	{
		$columns = parent::getSelectableUserColumns($a_in_course, $a_in_group);

		if($this->isLearningProgressDeactivated())
		{
			unset($columns['status']);
			unset($columns['status_changed']);
		}

		return $columns;
	}

	/**
				 * {@inheritdoc}
				 * @return mixed[]
				 */
				public function getSelectableColumns(): array
	{
		$columns = parent::getSelectableColumns();

		if($this->isLearningProgressDeactivated())
		{
			unset($columns['status']);
			unset($columns['status_changed']);
		}

		return $columns;
	}

	protected function isLearningProgressDeactivated(): bool
	{
		return in_array($this->parent_obj->object->getLearningProgressMode(), [ilObjInteractiveVideo::LP_MODE_DEACTIVATED]);
	}

	/**
	 * {@inheritdoc}
	 */
    public function initFilter(): void
	{
		$this->filter = [];
	}

	/**
	 * {@inheritdoc}
	 */
    protected function fillRow(array $a_set): void
	{
		/**
		 * @var $lng    ilLanguage
		 */
		global $lng;

		foreach ($this->getSelectedColumns() as $c)
		{
			if($c == 'status' && $a_set[$c] != ilLPStatus::LP_STATUS_COMPLETED_NUM)
			{
				$timing = $this->showTimingsWarning($this->ref_id, $a_set["usr_id"]);
				if($timing)
				{
					if($timing !== true)
					{
						$timing = ": ".ilDatePresentation::formatDate(new ilDate($timing, IL_CAL_UNIX));
					}
					else
					{
						$timing = "";
					}
					$this->tpl->setCurrentBlock('warning_img');
					$this->tpl->setVariable('WARNING_IMG', ilUtil::getImagePath('time_warn.svg'));
					$this->tpl->setVariable('WARNING_ALT', $this->lng->txt('trac_time_passed').$timing);
					$this->tpl->parseCurrentBlock();
				}
			}

			// #7694
			if($c == 'login' && !$a_set["active"])
			{
				$this->tpl->setCurrentBlock('inactive_bl');
				$this->tpl->setVariable('TXT_INACTIVE', $lng->txt("inactive"));
				$this->tpl->parseCurrentBlock();
			}

			$this->tpl->setCurrentBlock("user_field");
			$val = $this->parseValue($c, $a_set[$c], "user");
			$this->tpl->setVariable("VAL_UF", $val);
			$this->tpl->parseCurrentBlock();
		}

		$this->getParentObject()->getCtrl()->setParameter($this->getParentObject(), "user_id", $a_set["usr_id"]);
		if(!$this->getPrintMode())
		{
			$this->tpl->setCurrentBlock("item_command");
			$this->tpl->setVariable("HREF_COMMAND", $this->getParentObject()->getCtrl()->getLinkTarget($this->getParentObject(), "editUser"));
			$this->tpl->setVariable("TXT_COMMAND", $lng->txt('edit'));
			$this->tpl->parseCurrentBlock();
		}
		$this->getParentObject()->getCtrl()->setParameter($this->getParentObject(), "user_id", '');
	}
}
