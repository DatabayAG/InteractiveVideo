<?php

/**
 * Class SimpleChoiceQuestionsUserTableGUI
 * @version $Id$
 */
class SimpleChoiceQuestionsUserTableGUI extends ilTable2GUI
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
	
		$this->setTitle($a_parent_obj->getPluginInstance()->txt('user_results'));
		$this->setRowTemplate('tpl.row_questions_user.html', $a_parent_obj->getPluginInstance()->getDirectory());
		$this->addColumn('', 'question_id',  '1px', true);
	
		$this->addColumn($this->lng->txt('question'), 'title');
		#$this->addColumn($a_parent_obj->plugin->txt('answered'), 'answered');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('neutral_question'), 'neutral_question');
		$this->addColumn($a_parent_obj->getPluginInstance()->txt('correct_answered'), 'correct_answered');
		
		$this->setShowRowsSelector(false);
		
	}

	/**
	 * @param array $a_set
	 */
    protected function fillRow(array $a_set): void
	{
		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
        if(isset($a_set['user_id'])) {
            $current_selection_list->setId('act_' . $a_set['user_id']);
        }
        if(isset($a_set['title'])) {
            $this->tpl->setVariable('QUESTION_TITLE', $a_set['title']);
        }
		#$this->tpl->setVariable('USER_ANSWERED', $a_set['answered']);
        if(isset($a_set['neutral_answer'])) {
            $points = 0;
            if(isset($a_set['points'])) {
                $points = $a_set['points'];
            }
            if($a_set['neutral_answer'] == 1)
            {
                $txt_value = 'yes';
                $value = $this->lng->txt($txt_value);
                $points_txt = ilInteractiveVideoPlugin::getInstance()->txt('neutral_answer');
            }
            else if($a_set['neutral_answer'] == 0 && $a_set['neutral_answer'] != '')
            {
                $txt_value = 'no';
                $value = $this->lng->txt($txt_value);
                if($points == 100)
                {
                    $points_txt = ilInteractiveVideoPlugin::getInstance()->txt('correct_answer');
                }
                else if($a_set['answered'] == 0)
                {
                    $points_txt = ilInteractiveVideoPlugin::getInstance()->txt('not_answered');
                }
                else
                {
                    $points_txt = ilInteractiveVideoPlugin::getInstance()->txt('wrong_answer');
                }

            }
            else
            {
                $value = '';
                $points_txt = $points . '%';
            }
        }


		$this->tpl->setVariable('NEUTRAL_QUESTION', $value);
		$this->tpl->setVariable('USER_SCORE', $points_txt);
	}
}
