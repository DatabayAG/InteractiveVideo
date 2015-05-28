<?php

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

/**
 * Class ilInteractiveVideoCommentsTableGUI
 * @version $Id$
 */
class SimpleChoiceQuestionsUserTableGUI extends ilTable2GUI
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
	
		$this->setId('xvid_answers_' . $a_parent_obj->object->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);
	
		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
	
		$this->setTitle($a_parent_obj->plugin->txt('user_results'));
		$this->setRowTemplate('tpl.row_questions_user.html', $a_parent_obj->plugin->getDirectory());
		$this->addColumn('', 'question_id',  '1px', true);
	
		$this->addColumn($this->lng->txt('title'), 'title');
		$this->addColumn($a_parent_obj->plugin->txt('answered'), 'answered');
		$this->addColumn($a_parent_obj->plugin->txt('correct_answered'), 'correct_answered');
		
		$this->setShowRowsSelector(false);
		
	}

	/**
	 * @param array $row
	 */
	protected function fillRow(array $row)
	{
		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $row['user_id']);
		$this->tpl->setVariable('QUESTION_TITLE', $row['title']);
		$this->tpl->setVariable('USER_ANSWERED', $row['answered']);
		$this->tpl->setVariable('USER_SCORE', $row['points'] . '%');
	}
}
