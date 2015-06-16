<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPluginAccess.php';

/**
 * Class ilObjInteractiveVideoAccess
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoAccess extends ilObjectPluginAccess
{
	/**
	 * @param string $a_cmd
	 * @param string $a_permission
	 * @param int    $a_ref_id
	 * @param int    $a_obj_id
	 * @param string $a_user_id
	 * @return bool
	 */
	public function _checkAccess($a_cmd, $a_permission, $a_ref_id, $a_obj_id, $a_user_id = '')
	{
		/**
		 * @var $ilUser   ilObjUser
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilUser, $ilAccess;

		if(!$a_user_id)
		{
			$a_user_id = $ilUser->getId();
		}
		
		switch($a_permission)
		{
			case 'read':
				if(
					!ilObjInteractiveVideoAccess::checkOnline($a_obj_id) &&
					!$ilAccess->checkAccessOfUser($a_user_id, 'write', '', $a_ref_id)
				)
				{
					return false;
				}
				break;
		}
		
		return true;
	}

	public static function checkOnline($a_id)
	{
		/**
		 * @var $ilDB iLDB
		 */
		global $ilDB;

		$set = $ilDB->query('
			SELECT is_online FROM rep_robj_xvid_objects WHERE obj_id = ' . $ilDB->quote($a_id, 'integer')
		);
		$rec = $ilDB->fetchAssoc($set);
		return (bool)$rec['is_online'];
	}
}