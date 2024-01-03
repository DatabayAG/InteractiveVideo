<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class ilObjInteractiveVideoAccess
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideoAccess extends ilObjectPluginAccess implements ilConditionHandling, ilWACCheckingClass
{
    /**
     * @param string   $cmd
     * @param string   $permission
     * @param int      $ref_id
     * @param int      $obj_id
     * @param int|null $user_id
     * @return bool
     */
    public function _checkAccess(string $cmd, string $permission, int $ref_id, int $obj_id, ?int $user_id = null): bool
	{
		/**
		 * @var $ilUser   ilObjUser
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilUser, $ilAccess;

		if(!$user_id)
		{
            $user_id = $ilUser->getId();
		}
		
		switch($permission)
		{
			case 'read':
			case 'visible':
				if(
					!ilObjInteractiveVideoAccess::checkOnline($obj_id) &&
					!$ilAccess->checkAccessOfUser($user_id, 'write', '', $ref_id)
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
	 */
	public static function checkOnline($a_id): bool
	{
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
    public static function getConditionOperators(): array
	{
		return [
			ilConditionHandler::OPERATOR_LP
        ];
	}

    /**
     * @param int    $a_trigger_obj_id
     * @param string $a_operator
     * @param string $a_value
     * @param int    $a_usr_id
     * @return bool
     */
    public static function checkCondition(
        int $a_trigger_obj_id,
        string $a_operator,
        string $a_value,
        int $a_usr_id
    ): bool
	{
        // Not necessary, handled in \ilConditionHandler::_checkCondition
        if ($a_operator == ilConditionHandler::OPERATOR_LP) {
            return ilLPStatus::_hasUserCompleted($a_trigger_obj_id, $a_usr_id);
        }

		return false;
	}

	/**
	 * @param ilWACPath $ilWACPath
	 *
	 * @return bool
	 */
    public function canBeDelivered(ilWACPath $ilWACPath): bool
    {
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