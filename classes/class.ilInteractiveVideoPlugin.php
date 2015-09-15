<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilRepositoryObjectPlugin.php';

/**
 * Class ilInteractiveVideoPlugin
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilInteractiveVideoPlugin extends ilRepositoryObjectPlugin
{
	/**
	 * @var string
	 */
	const CTYPE = 'Services';

	/**
	 * @var string
	 */
	const CNAME = 'Repository';

	/**
	 * @var string
	 */
	const SLOT_ID = 'robj';

	/**
	 * @var string
	 */
	const PNAME = 'InteractiveVideo';

	/**
	 * @var ilInteractiveVideoPlugin|null
	 */
	private static $instance = null;

	/**
	 * @return ilInteractiveVideoPlugin
	 */
	public static function getInstance()
	{
		if(null === self::$instance)
		{
			require_once 'Services/Component/classes/class.ilPluginAdmin.php';
			return self::$instance = ilPluginAdmin::getPluginObject(
				self::CTYPE,
				self::CNAME,
				self::SLOT_ID,
				self::PNAME
			);
		}

		return self::$instance;
	}

	/**
	 * @return string
	 */
	public function getPluginName()
	{
		return self::PNAME;
	}

	protected function uninstallCustom()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;
		$ilDB->query('DROP TABLE 	rep_robj_xvid_comments, rep_robj_xvid_objects, 
									rep_robj_xvid_qus_text, rep_robj_xvid_question,
									rep_robj_xvid_answers, rep_robj_xvid_score');
		if($ilDB->sequenceExists('rep_robj_xvid_comments'))
		{
			$ilDB->dropSequence('rep_robj_xvid_comments');
		}
		if($ilDB->sequenceExists('rep_robj_xvid_question'))
		{
			$ilDB->dropSequence('rep_robj_xvid_question');
		}
		if($ilDB->sequenceExists('rep_robj_xvid_qus_text'))
		{
			$ilDB->dropSequence('rep_robj_xvid_qus_text');
		}
	}
}