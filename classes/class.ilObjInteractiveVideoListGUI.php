<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPluginListGUI.php';

/**
 * Class ilObjInteractiveVideoListGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoListGUI extends ilObjectPluginListGUI
{
	function getGuiClass()
	{
		return 'ilObjInteractiveVideoGUI';
	}

	function initCommands()
	{
		$this->copy_enabled = false;

		return array
		(
			array(
				'permission' => 'visible',
				'cmd'        => 'showContent',
				'default'    => true
			),
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

	function initType()
	{
		$this->setType('xvid');
	}

}