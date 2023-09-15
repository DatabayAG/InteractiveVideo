<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionsCompleteUserTableGUI
 */
class SimpleChoiceQuestionsCompleteUserTableGUI extends ilTable2GUI
{
	/**
	 * @var ilCtrl
	 */
    protected ilCtrl $ctrl;

    /**
     * SimpleChoiceQuestionsCompleteUserTableGUI constructor.
     * @param        $a_parent_obj
     * @param string $a_parent_cmd
     * @param array  $colum_head
     * @throws ilCtrlException
     * @throws ilException
     */
	public function __construct($a_parent_obj, $a_parent_cmd, $colum_head)
	{
        global $ilCtrl, $lng;

		$this->ctrl = $ilCtrl;

		$this->setId('xvid_questions_' . $a_parent_obj->getObject()->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);
		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setTitle($a_parent_obj->getPluginInstance()->txt('complete_question_results'));
		$this->setRowTemplate('tpl.dynamic_question_row.html', $a_parent_obj->getPluginInstance()->getDirectory());
		$this->addCommandButton('completeCsvExport', $a_parent_obj->getPluginInstance()->txt('csv_export'));
		$this->addColumn($lng->txt('name'));
		foreach($colum_head as $key => $value)
		{
			$this->addColumn($value);
		}
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('answered'));
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('sum'));
		$this->setShowRowsSelector(false);

	}

    /**
     * @param string $a_field
     * @return bool
     */
    public function numericOrdering(string $a_field): bool
	{
		if('question_id' == $a_field)
		{
			return true;
		}

		return false;
	}

    /**
     * @param array $a_set
     * @throws ilCtrlException
     * @throws ilTemplateException
     * @internal param array $row
     */
    protected function fillRow(array $a_set): void
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