<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
require_once 'Services/User/classes/class.ilUserUtil.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

/**
 * Class ilInteractiveVideoCommentsTableGUI
 */
class ilInteractiveVideoCommentsTableGUI extends ilTable2GUI
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
		 * @var ilToolbarGUI $ilToolbar 
		 */
		global $ilCtrl, $ilAccess, $ilToolbar;
		$this->ctrl = $ilCtrl;

		$this->setId('xvid_comments_' . $a_parent_obj->object->getId());
		parent::__construct($a_parent_obj, $a_parent_cmd);
		if($a_parent_cmd === "editMyComments"){
            $ilToolbar->addButton(
                $a_parent_obj->plugin->txt('export_comments'),
                $ilCtrl->getLinkTarget($a_parent_obj, 'exportMyComments')
            );
        }

		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('comment_time');

		$title = $a_parent_obj->plugin->txt('questions_comments');
		if($a_parent_cmd == 'editMyComments')
		{
			$title = $a_parent_obj->plugin->txt('my_comments');
		}
		
		$this->setTitle($title);
		$this->setRowTemplate('tpl.row_comments.html', $a_parent_obj->plugin->getDirectory());

		$this->addColumn('', 'comment_id',  '1px', true);

		$this->addColumn($this->lng->txt('time'), 'comment_time');
		$this->addColumn($a_parent_obj->plugin->txt('time_end'), 'comment_time_end');
		if($a_parent_cmd == 'editComments')
		{
			$this->addColumn($this->lng->txt('user'), 'user_id');
		}
		$this->addColumn($this->lng->txt('title'), 'title');
		$this->addColumn($this->lng->txt('comment'), 'comment_text');
		if($ilAccess->checkAccess('write', '', $a_parent_obj->object->getRefId()) && $a_parent_cmd == 'editComments')
		{
			$this->addColumn($a_parent_obj->plugin->txt('type'), 'is_interactive');
			//$this->addColumn($a_parent_obj->plugin->txt('tutor'), 'is_tutor');
			
//			$this->addCommandButton('showTutorInsertCommentForm', $this->lng->txt('insert'));
		}
		else
		{
			$this->addColumn($a_parent_obj->plugin->txt('visibility'), 'is_private');
		}
		$this->addColumn($this->lng->txt('actions'), '', '10%');

		$this->setSelectAllCheckbox('comment_id');
		
		if($a_parent_cmd == 'editComments')
		{
			$this->addMultiCommand('confirmDeleteComment', $this->lng->txt('delete'));
		}
		else if($a_parent_cmd == 'editMyComments')
		{
			$this->addMultiCommand('confirmDeleteMyComment', $this->lng->txt('delete'));
		}
		
		$this->setShowRowsSelector(true);
	}

	/**
	 * @param string $column
	 * @return bool
	 */
	public function numericOrdering($column)
	{
		if('comment_time' == $column || 'comment_time' ==  $column )
		{
			return true;
		}

		return false;
	}

	/**
	 * @param array $a_set
	 */
	protected function fillRow($a_set)
	{
		foreach ($a_set as $key => $value)
		{
			if($key == 'comment_id')
			{
				$value = ilUtil::formCheckbox(0, 'comment_id[]', $value);
			}
			else if($key == 'user_id')
			{
				$value = ilUserUtil::getNamePresentation($value);
			}
			else if($key == 'comment_time')
			{
				#$time = xvidUtils::timespanArray($value);
				#$value = $time['h'].':'.$time['m'].':'.$time['s'];
			}
			else if($key == 'comment_time_end')
			{
				if($value == '00:00:00')
				{
					$value = '';
				}
			}
			else if($key == 'is_interactive')
			{
				$txt_value = $value == 1 ? 'question' : 'comment';
				$value = $this->lng->txt($txt_value);
			}
			else if($key == 'is_tutor')
			{
				continue;
			}

			$this->tpl->setVariable('VAL_'.strtoupper($key), $value);
		}

		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt('actions'));
		$current_selection_list->setId('act_' . $a_set['comment_id']);

		$this->ctrl->setParameter($this->parent_obj, 'comment_id', $a_set['comment_id']);
		
		if($a_set['is_interactive'] == 1)
		{
			$link_target =  $this->ctrl->getLinkTarget($this->parent_obj,$this->parent_cmd == 'editComments' ?  'editQuestion' : 'editComment');
		}	
		else
		{
			$link_target =  $this->ctrl->getLinkTarget($this->parent_obj,$this->parent_cmd == 'editComments' ?  'editComment' : 'editMyComment');	
		}
		
		$current_selection_list->addItem($this->lng->txt('edit'), '', $link_target);
		$this->tpl->setVariable('VAL_ACTIONS', $current_selection_list->getHTML());
	}
}
