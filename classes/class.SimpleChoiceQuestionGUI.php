<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Table/classes/class.ilTable2GUI.php';
require_once 'Services/UIComponent/AdvancedSelectionList/classes/class.ilAdvancedSelectionListGUI.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');

/**
 * Class ilInteractiveVideoCommentsTableGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 * @version $Id$
 */
class SimpleChoiceQuestionGUI extends ilTable2GUI
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
		$this->setDefaultOrderDirection('ASC');
		$this->setDefaultOrderField('cid');

		$this->setTitle($a_parent_obj->plugin->txt('user'));
		$this->setRowTemplate('tpl.row_answers.html', $a_parent_obj->plugin->getDirectory());

		$this->addColumn('', 'user_id',  '1px', true);
		$this->addColumn($this->lng->txt('username'), 'username');
		$this->addColumn($this->lng->txt('points'), 'points');

		$this->setSelectAllCheckbox('user_id');
		$this->setShowRowsSelector(false);
	}

	/**
	 * @param string $column
	 * @return bool
	 */
	public function numericOrdering($column)
	{
		if('username' == $column)
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
		$current_selection_list->setId('act_' . $row['comment_id']);

		$this->ctrl->setParameter($this->parent_obj, 'comment_id', $row['comment_id']);
		$current_selection_list->addItem($this->lng->txt('edit'), '', $this->ctrl->getLinkTarget($this->parent_obj, 'editComment'));
		$this->tpl->setVariable('VAL_ACTIONS', $current_selection_list->getHTML());
	}
}
