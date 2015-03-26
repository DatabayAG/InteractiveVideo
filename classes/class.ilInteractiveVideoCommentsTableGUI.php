<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once './Services/Table/classes/class.ilTable2GUI.php';
include_once("./Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php");
include_once("./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.xvidUtils.php");
/**
 * Class ilInteractiveVideoCommentsTableGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 * @version $Id$
 * 
 */
class ilInteractiveVideoCommentsTableGUI extends ilTable2GUI
{
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

		$this->setId('xvid_comments');
		
		parent::__construct($a_parent_obj, $a_parent_cmd);
		
		$this->setFormAction($this->ctrl->getFormAction($a_parent_obj, $a_parent_cmd));
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('comment_time');

		$this->setTitle($a_parent_obj->plugin->txt('comments'));
		$this->setRowTemplate('tpl.row_comments.html', './Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo');
		
		$this->addColumn('', 'comment_id',  '1px', true);

		$this->addColumn($this->lng->txt('time'), 'comment_time');
		$this->addColumn($this->lng->txt('user'), 'user_id');
		$this->addColumn($this->lng->txt('comment'), 'comment_text');
		$this->addColumn($a_parent_obj->plugin->txt('interactive'), 'is_interactive');
		$this->addColumn($a_parent_obj->plugin->txt('tutor'), 'is_tutor');
		$this->addColumn($this->lng->txt('actions'), 'actions', '10%');
		
		$this->setSelectAllCheckbox('comment_id');	
		$this->addMultiCommand('confirmDeleteComment', $this->lng->txt('delete'));
		
		$this->addCommandButton('showTutorInsertCommentForm', $this->lng->txt('insert'));
		
		$this->setShowRowsSelector(true);
	}

	/**
	 * @param string $column
	 * @return bool
	 */
	public function numericOrdering($column)
	{
		if('comment_time' == $column)
		{
			return true;
		}
		return false;
	}

	protected function fillRow($row)
	{
		foreach ($row as $key => $value)
		{
			if($key == "comment_id")
			{
				$value = ilUtil::formCheckbox(0, 'comment_id[]', $value);
			}
			if($key == 'user_id')
			{
				$value = ilObjUser::_lookupLogin($value);
			}

			if($key == "comment_time")
			{
				$time = xvidUtils::timespanArray($value);
				$value = $time['h'].':'.$time['i'].':'.$time['s'];
			}

			$this->tpl->setVariable("VAL_".strtoupper($key), $value);
		}

		$current_selection_list = new ilAdvancedSelectionListGUI();
		$current_selection_list->setListTitle($this->lng->txt("actions"));
		$current_selection_list->setId("act_" . $row['comment_id']);

		$this->ctrl->setParameter($this->parent_obj, 'comment_id',$row['comment_id'] );
		$current_selection_list->addItem($this->lng->txt("edit"), '', $this->ctrl->getLinkTarget($this->parent_obj, "editComment"));
		$this->tpl->setVariable("VAL_ACTIONS", $current_selection_list->getHTML());
	}
}
