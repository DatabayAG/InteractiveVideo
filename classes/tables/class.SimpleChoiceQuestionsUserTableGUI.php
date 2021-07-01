<?php

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
require_once dirname(__FILE__) . '/../class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

/**
 * Class SimpleChoiceQuestionsUserTableGUI
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
	
		$this->addColumn($this->lng->txt('question'), 'title');
		#$this->addColumn($a_parent_obj->plugin->txt('answered'), 'answered');
		$this->addColumn($a_parent_obj->plugin->txt('neutral_question'), 'neutral_question');
		$this->addColumn($a_parent_obj->plugin->txt('correct_answered'), 'correct_answered');
		
		$this->setShowRowsSelector(false);
		
	}

	/**
	 * @param array $a_set
	 */
	protected function fillRow($a_set)
	{
		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $a_set['user_id']);
		$this->tpl->setVariable('QUESTION_TITLE', $a_set['title']);
		#$this->tpl->setVariable('USER_ANSWERED', $a_set['answered']);
		if($a_set['neutral_answer'] == 1)
		{
			$txt_value = 'yes';
			$value = $this->lng->txt($txt_value);
			$points = ilInteractiveVideoPlugin::getInstance()->txt('neutral_answer');
		}
		else if($a_set['neutral_answer'] == 0 && $a_set['neutral_answer'] != '')
		{
			$txt_value = 'no';
			$value = $this->lng->txt($txt_value);
			if($a_set['points'] == 100)
			{
				$points = ilInteractiveVideoPlugin::getInstance()->txt('correct_answer');
			}
			else if($a_set['answered'] == 0)
			{
				$points = ilInteractiveVideoPlugin::getInstance()->txt('not_answered');
			}
			else
			{
				$points = ilInteractiveVideoPlugin::getInstance()->txt('wrong_answer');
			}

		}
		else
		{
			$value = '';
			$points = $a_set['points'] . '%';
		}

		$this->tpl->setVariable('NEUTRAL_QUESTION', $value);
		$this->tpl->setVariable('USER_SCORE', $points);
	}
}
