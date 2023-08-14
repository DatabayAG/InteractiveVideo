<?php
/**
 * Class ilInteractiveVideoLPSummaryTableGUI
 */
class ilInteractiveVideoLPSummaryTableGUI extends ilTrSummaryTableGUI
{
	/**
	 * {@inheritdoc}
	 */
	protected function parseTitle($a_obj_id, $action, $a_user_id = false)
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

	/**
	 * @return bool
	 */
	protected function isLearningProgressDeactivated()
	{
		return in_array($this->parent_obj->object->getLearningProgressMode(), array(ilObjInteractiveVideo::LP_MODE_DEACTIVATED));
	}

	/**
	 * {@inheritdoc}
	 */
    protected function fillRow(array $a_set): void
	{
		/**
		 * $lng ilLanguage
		 */
		global $lng;

		$this->tpl->setVariable("ICON", ilObject::_getIcon(0, "tiny", $a_set["type"]));
		$this->tpl->setVariable("ICON_ALT", $lng->txt($a_set["type"]));
		$this->tpl->setVariable("TITLE", $a_set["title"]);

		if($a_set["offline"])
		{
			$this->tpl->setCurrentBlock("offline");
			$this->tpl->setVariable("TEXT_STATUS", $this->lng->txt("status"));
			$this->tpl->setVariable("TEXT_OFFLINE", $this->lng->txt("offline"));
			$this->tpl->parseCurrentBlock();
		}

		foreach ($this->getSelectedColumns() as $c)
		{
			switch($c)
			{
				case "country":
				case "gender":
				case "city":
				case "language":
				case "status":
				case "mark":
				case "sel_country":
					$this->renderPercentages($c, $a_set[$c]);
					break;

				case "percentage_avg":
					if((int)$a_set[$c] === 0 || !$this->isPercentageAvailable($a_set["obj_id"]))
					{
						$this->tpl->setVariable(strtoupper($c), "");
					}
					break;
				default:
					$value = $this->parseValue($c, $a_set[$c], $a_set["type"]);
					$this->tpl->setVariable(strtoupper($c), $value);
					break;
			}
		}

		if($this->is_root)
		{
			$path = $this->buildPath($a_set["ref_ids"]);
			if($path)
			{
				$this->tpl->setCurrentBlock("item_path");
				foreach($path as $ref_id => $path_item)
				{
					$this->tpl->setVariable("PATH_ITEM", $path_item);

					

					$this->tpl->parseCurrentBlock();
				}
			}

			$this->tpl->touchBlock("path_action");
		}
	}

	/**
	 * {@inheritdoc}
	 */
    public function initFilter(): void
	{
		$this->filter = array();
	}
} 
