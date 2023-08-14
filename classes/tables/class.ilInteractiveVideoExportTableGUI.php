<?php
/**
 * Class ilInteractiveVideoExportTableGUI
 */
class ilInteractiveVideoExportTableGUI extends ilExportTableGUI
{
	/**
	 * ilInteractiveVideoExportTableGUI constructor.
	 * @param object $a_parent_obj
	 * @param string $a_parent_cmd
	 * @param string $a_exp_obj
	 */
	public function __construct($a_parent_obj, $a_parent_cmd, $a_exp_obj)
	{
		parent::__construct($a_parent_obj, $a_parent_cmd, $a_exp_obj);

		// NOT REQUIRED ANYMORE, PROBLEM NOW FIXED IN THE ROOT
		// KEEP CODE, JF OPINIONS / ROOT FIXINGS CAN CHANGE
		//$this->addCustomColumn($this->lng->txt('actions'), $this, 'formatActionsList');
	}

	/**
	 * 
	 */
    protected function initMultiCommands(): void
	{
		$this->addMultiCommand('confirmDeletion', $this->lng->txt('delete'));
	}
} 
