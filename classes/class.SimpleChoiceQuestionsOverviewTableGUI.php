<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

class SimpleChoiceQuestionsOverviewTableGUI extends ilTable2GUI
{
	/**
	 * @var ilCtrl
	 */
	protected $ctrl;

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

		$this->setId('xvid_questions_' . $a_parent_obj->object->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);

		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('cid');

		$this->setTitle($a_parent_obj->plugin->txt('question_results'));
		$this->setRowTemplate('tpl.row_questions.html', $a_parent_obj->plugin->getDirectory());

		$this->addColumn('', 'question_id');
		$this->addColumn($a_parent_obj->plugin->txt('title_of_question'), 'title_of_question');
		$this->addColumn($a_parent_obj->plugin->txt('user_answered'), 'user_answered');
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
	public function numericOrdering($column)
	{
		if('question_id' == $column)
		{
			return true;
		}

		return false;
	}

	/**
	 * @param array $row
	 */
	protected function fillRow(array $row)
	{

		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $row['user_id']);
		
		$this->tpl->setVariable('QUESTION_ID', ilUtil::formCheckbox(0, 'question_id[]', $row['question_id']));
		$this->tpl->setVariable('COMMENT_TITLE', $row['comment_title']);
		$this->tpl->setVariable('USER_ANSWERED', $row['answered']);
		$this->tpl->setVariable('USER_ANSWERED_CORRECT', $row['correct']);
		$this->tpl->setVariable('PERCENTAGE', $row['percentage']);
		$this->ctrl->setParameter($this->parent_obj, 'user_id', $row['user_id']);
	}
}
