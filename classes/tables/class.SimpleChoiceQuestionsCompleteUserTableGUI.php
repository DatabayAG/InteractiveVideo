<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
require_once dirname(__FILE__) . '/../class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

/**
 * Class SimpleChoiceQuestionsCompleteUserTableGUI
 */
class SimpleChoiceQuestionsCompleteUserTableGUI extends ilTable2GUI
{
	/**
	 * @var ilCtrl
	 */
	protected $ctrl;

	/**
	 * SimpleChoiceQuestionsCompleteUserTableGUI constructor.
	 * @param        $a_parent_obj
	 * @param string $a_parent_cmd
	 * @param array  $colum_head
	 */
	public function __construct($a_parent_obj, $a_parent_cmd, $colum_head)
	{
		/**
		 * @var $ilCtrl ilCtrl
		 */
		global $ilCtrl, $lng;

		$this->ctrl = $ilCtrl;

		$this->setId('xvid_questions_' . $a_parent_obj->object->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);
		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setTitle($a_parent_obj->plugin->txt('complete_question_results'));
		$this->setRowTemplate('tpl.dynamic_question_row.html', $a_parent_obj->plugin->getDirectory());
		$this->addCommandButton('completeCsvExport', $a_parent_obj->plugin->txt('csv_export'));
		$this->addColumn($lng->txt('name'));
		foreach($colum_head as $key => $value)
		{
			$this->addColumn($value);
		}
		$this->addColumn($a_parent_obj->plugin->txt('answered'));
		$this->addColumn($a_parent_obj->plugin->txt('sum'));
		$this->setShowRowsSelector(false);

	}

	/**
	 * @param string $column
	 * @return bool
	 */
	public function numericOrdering($column)
	{
		if('question_id' == $column)
		{
			return true;
		}

		return false;
	}

	/**
	 * @param array $a_set
	 * @internal param array $row
	 */
	protected function fillRow($a_set)
	{
		global $lng;
		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $a_set['user_id']);
		$max_columns = count($a_set);
		$counter     = 0;
		foreach($a_set as $key => $value)
		{
			$this->tpl->setCurrentBlock('dynamic_table_column');
			if($counter != 0 && $counter != $max_columns - 2 && $counter != $max_columns - 1)
			{
				if($value == '0')
				{
					$value = $lng->txt('no');
				}
				else if($value == '1')
				{
					$value = $lng->txt('yes');
				}
			}
			$this->tpl->setVariable('VAL', $value);
			$this->tpl->parseCurrentBlock();
			$counter++;
		}
		$this->ctrl->setParameter($this->parent_obj, 'user_id', $a_set['user_id']);
	}
}