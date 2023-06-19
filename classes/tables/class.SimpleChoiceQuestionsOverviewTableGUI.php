<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionsOverviewTableGUI
 */
class SimpleChoiceQuestionsOverviewTableGUI extends ilTable2GUI
{
	/**
	 * @var ilCtrl
	 */
    protected ilCtrl $ctrl;

	/**
	 * @param ilObjectGUI $a_parent_obj
	 * @param string      $a_parent_cmd
	 */
	public function __construct($a_parent_obj, $a_parent_cmd)
	{
		/**
		 * @var $ilCtrl ilCtrl
		 */
		global $ilCtrl;

		$this->ctrl = $ilCtrl;

		$this->setId('xvid_questions_' . $a_parent_obj->getObject()->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);

		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('cid');

		$this->setTitle($a_parent_obj->plugin->txt('question_results'));
		$this->setRowTemplate('tpl.row_questions.html', $a_parent_obj->plugin->getDirectory());

		$this->addColumn('', 'question_id');
		$this->addColumn($a_parent_obj->plugin->txt('title_of_question'), 'title_of_question');
		$this->addColumn($a_parent_obj->plugin->txt('user_answered'), 'user_answered');
		$this->addColumn($a_parent_obj->plugin->txt('neutral_question'), 'neutral_question');
		$this->addColumn($a_parent_obj->plugin->txt('user_correct'), 'user_correct');
		$this->addColumn($a_parent_obj->plugin->txt('percentage'), 'percentage');
		$this->setSelectAllCheckbox('question_id');
		$this->addMultiCommand('confirmDeleteQuestionsResults', $this->lng->txt('delete'));

		$this->setShowRowsSelector(false);
	}

	/**
	 * @param string $column
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
	 */
    protected function fillRow(array $a_set): void
	{

		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $a_set['user_id']);
		
		$this->tpl->setVariable('QUESTION_ID', ilUtil::formCheckbox(0, 'question_id[]', $a_set['question_id']));
		$this->tpl->setVariable('COMMENT_TITLE', $a_set['comment_title']);
		$this->tpl->setVariable('USER_ANSWERED', $a_set['answered']);
		$txt_value =  $a_set['neutral_question'] == 1 ? 'yes' : 'no';
		$value = $this->lng->txt($txt_value);
		$this->tpl->setVariable('NEUTRAL_QUESTION', $value);
		$this->tpl->setVariable('USER_ANSWERED_CORRECT', $a_set['correct']);
		if($a_set['percentage'] != '' || ($a_set['neutral_question'] != 1 && $a_set['percentage'] == 0.0))
		{
			$this->tpl->setVariable('PERCENTAGE', $a_set['percentage'] . '%');
		}
		else
		{
			$this->tpl->setVariable('PERCENTAGE',  '');
		}

		$this->ctrl->setParameter($this->parent_obj, 'user_id', $a_set['user_id']);
	}
}
