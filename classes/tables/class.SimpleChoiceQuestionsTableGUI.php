<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionsTableGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 * @version $Id$
 */
class SimpleChoiceQuestionsTableGUI extends ilTable2GUI
{
	/**
	 * @var ilCtrl
	 */
    protected ilCtrl $ctrl;

    /**
	 * @param \ilObjectGUI|null $a_parent_obj
	 * @throws ilCtrlException
	 * @throws ilException
	 */
	public function __construct(?object $a_parent_obj, string $a_parent_cmd)
	{
        global $ilCtrl;

		$this->ctrl = $ilCtrl;

		$this->setId('xvid_answers_' . $a_parent_obj->getObject()->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);

		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('name');

		$this->setTitle($a_parent_obj->getPluginInstance()->txt('user_results'));
		$this->setRowTemplate('tpl.row_answers.html', $a_parent_obj->getPluginInstance()->getDirectory());
		$this->addColumn('', 'user_id',  '1px', true);

		$this->addColumn($this->lng->txt('name'), 'name');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('answered'), 'answered');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('neutral_questions'), 'neutral_questions');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('correct'), 'correct');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('percentage'), 'percentage');

		$this->setSelectAllCheckbox('user_id');
		$this->addMultiCommand('confirmDeleteUserResults', $this->lng->txt('delete'));

		$this->setShowRowsSelector(false);
	}

    /**
     * @param array $a_set
     * @throws ilCtrlException
     */
    protected function fillRow(array $a_set): void
	{

		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $a_set['user_id']);

		$this->tpl->setVariable('USER_ID', ilLegacyFormElementsUtil::formCheckbox(0, 'user_id[]', $a_set['user_id']));
		$this->tpl->setVariable('USER_NAME', $a_set['name']);
		$this->tpl->setVariable('USER_ANSWERED', $a_set['answered']);
		$this->tpl->setVariable('NEUTRAL_QUESTIONS', $a_set['neutral_questions']);
		$this->tpl->setVariable('USER_SCORE', $a_set['correct']);
		$this->tpl->setVariable('PERCENTAGE', $a_set['percentage']);
		$this->ctrl->setParameter($this->parent_obj, 'user_id', $a_set['user_id']);
	}
}
