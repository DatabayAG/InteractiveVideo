<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class ilObjInteractiveVideoListGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoListGUI extends ilObjectPluginListGUI
{
	/**
	 * @return string
	 */
    public function getGuiClass(): string
	{
		return 'ilObjInteractiveVideoGUI';
	}

	/**
	 * @return array
	 */
    public function initCommands(): array
	{
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
    public function getProperties(): array
	{
		$props = array();
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