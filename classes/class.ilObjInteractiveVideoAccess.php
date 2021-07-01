<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPluginAccess.php';
if(version_compare(ILIAS_VERSION_NUMERIC, '5.4.0', '>=')) {
	require_once 'Services/Conditions/interfaces/interface.ilConditionHandling.php';
	require_once('./Services/Conditions/classes/class.ilConditionHandler.php');
} else{
	require_once 'Services/AccessControl/interfaces/interface.ilConditionHandling.php';
	require_once 'Services/AccessControl/classes/class.ilConditionHandler.php';
}
require_once 'Services/WebAccessChecker/interfaces/interface.ilWACCheckingClass.php';

/**
 * Class ilObjInteractiveVideoAccess
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoAccess extends ilObjectPluginAccess implements ilConditionHandling, ilWACCheckingClass
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
			case 'visible':
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

	/**
	 * @param $a_id
	 * @return bool
	 */
	public static function checkOnline($a_id)
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$set = $ilDB->query('
			SELECT is_online FROM rep_robj_xvid_objects WHERE obj_id = ' . $ilDB->quote($a_id, 'integer')
		);
		$rec = $ilDB->fetchAssoc($set);
		return (bool)$rec['is_online'];
	}

	/**
	 * @inheritdoc
	 */
	public static function getConditionOperators()
	{
		return array(
			ilConditionHandler::OPERATOR_LP
		);
	}

	/**
	 * @param int $a_trigger_obj_id
	 * @param type $a_operator
	 * @param type $a_value
	 * @param int $a_usr_id
	 * @return bool
	 */
	public static function checkCondition($a_trigger_obj_id, $a_operator, $a_value, $a_usr_id)
	{
		switch($a_operator)
		{
			case ilConditionHandler::OPERATOR_LP:
				// Not necessary, handled in \ilConditionHandler::_checkCondition
				require_once './Services/Tracking/classes/class.ilLPStatus.php';
				return ilLPStatus::_hasUserCompleted($a_trigger_obj_id, $a_usr_id);
				break;
		}

		return false;
	}

	/**
	 * @param ilWACPath $ilWACPath
	 *
	 * @return bool
	 */
	public function canBeDelivered(ilWACPath $ilWACPath) {
		/**
		 * @var $ilAccess ilAccess
		 */
		global $ilAccess;
		preg_match("/\\/xvid_([\\d]*)\\//uism", $ilWACPath->getPath(), $results);

		foreach (ilObject2::_getAllReferences($results[1]) as $ref_id) {
			if ($ilAccess->checkAccess('read', '', $ref_id)) {
				return true;
			}
		}

		return false;
	}
	
	
}