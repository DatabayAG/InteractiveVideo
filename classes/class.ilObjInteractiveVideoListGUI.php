<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPluginListGUI.php';

/**
 * Class ilObjInteractiveVideoListGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoListGUI extends ilObjectPluginListGUI
{
	/**
	 * @return string
	 */
	public function getGuiClass()
	{
		return 'ilObjInteractiveVideoGUI';
	}

	/**
	 * @return array
	 */
	public function initCommands()
	{
		return array
		(
			array(
				'permission' => 'read',
				'cmd'        => 'showContent',
				'default'    => true
			),
			array(
				'permission' => 'write',
				'cmd'        => 'editProperties',
				'txt'        => $this->lng->txt('edit'),
				'default'    => false
			),
		);
	}

	/**
	 * 
	 */
	public function initType()
	{
		$this->setType('xvid');
	}

	/**
	 * @param string $a_item
	 * @return array
	 */
	public function getProperties($a_item = '')
	{
		$props = array();

		$this->plugin->includeClass('class.ilObjInteractiveVideoAccess.php');
		if(!ilObjInteractiveVideoAccess::checkOnline($this->obj_id))
		{
			$props[] = array(
				'alert' => true, 'property' => $this->txt('status'),
				'value' => $this->txt('offline')
			);
		}
		return $props;
	}
}