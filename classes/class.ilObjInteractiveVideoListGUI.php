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
		return
            [
                [
				'permission' => 'visible',
				'cmd'        => 'showContent',
				'default'    => true
                ],
                [
				'permission' => 'read',
				'cmd'        => 'showContent',
				'default'    => true
                ],
                [
				'permission' => 'write',
				'cmd'        => 'editProperties',
				'txt'        => $this->lng->txt('edit'),
				'default'    => false
                ],
            ];
	}

	/**
	 * 
	 */
	public function initType()
	{
		$this->setType('xvid');
	}

    /**
     * @return array
     */
    public function getProperties(): array
	{
		$props = [];
		if(!ilObjInteractiveVideoAccess::checkOnline($this->obj_id))
		{
			$props[] = [
				'alert' => true, 'property' => $this->txt('status'),
				'value' => $this->txt('offline')
            ];
		}
		return $props;
	}
}