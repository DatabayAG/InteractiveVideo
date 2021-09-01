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
	 * @return ilInteractiveVideoPlugin | ilPlugin
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

    protected function beforeActivation()
    {
        $return = parent::beforeActivation();

        require_once 'Services/Migration/DBUpdate_3560/classes/class.ilDBUpdateNewObjectType.php';
        $type = 'xvid';
        $typeId = ilDBUpdateNewObjectType::getObjectTypeId($type);
        $readLpOpsId = ilDBUpdateNewObjectType::getCustomRBACOperationId('read_learning_progress');
        $editLpOpsId = ilDBUpdateNewObjectType::getCustomRBACOperationId('edit_learning_progress');
        $writeOpsId = ilDBUpdateNewObjectType::getCustomRBACOperationId('write');
        if ($readLpOpsId && $editLpOpsId && $writeOpsId) {
            $readLpAdded = ilDBUpdateNewObjectType::addRBACOperation($typeId, $readLpOpsId);
            $editLpAdded = ilDBUpdateNewObjectType::addRBACOperation($typeId, $editLpOpsId);
            if ($readLpAdded) {
                ilDBUpdateNewObjectType::cloneOperation($type, $writeOpsId, $readLpOpsId);
            }

            if ($editLpAdded) {
                ilDBUpdateNewObjectType::cloneOperation($type, $writeOpsId, $editLpOpsId);
            }
        }

        return $return;
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
        /** @var $ilDB ilDBInterface */
        global $ilDB;

        $drop_table_list = array(
            'rep_robj_xvid_answers',
            'rep_robj_xvid_comments',
            'rep_robj_xvid_lp',
            'rep_robj_xvid_objects',
            'rep_robj_xvid_question',
            'rep_robj_xvid_qus_text',
            'rep_robj_xvid_score',
            'rep_robj_xvid_sources',
            'rep_robj_xvid_subtitle',
            'rep_robj_xvid_youtube',
            'rep_robj_xvid_surl',
            'rep_robj_xvid_mobs',
            'rep_robj_xvid_vimeo'
        );

        $drop_sequence_list = array(
            'rep_robj_xvid_comments',
            'rep_robj_xvid_question',
            'rep_robj_xvid_qus_text'
        );

        foreach ($drop_table_list as $key => $table) {
            if ($ilDB->tableExists($table)) {
                $ilDB->dropTable($table);
            }
        }

        foreach ($drop_sequence_list as $key => $sequence) {
            if ($ilDB->sequenceExists($sequence)) {
                $ilDB->dropSequence($sequence);
            }
        }

        $ilDB->queryF('DELETE FROM il_wac_secure_path WHERE path = %s ',
            array('text'), array('xvid'));
    }

	/**
	 * @param RecursiveIteratorIterator $rii
	 * @return array
	 */
	protected function exploreDirectory($rii)
	{
		$found_elements = array(dirname(__FILE__) . '/../lang');
		/** @var SplFileInfo $file */
		foreach($rii as $file)
		{
			if($file->isDir())
			{
				if(basename($file->getPath()) === 'lang')
				{
					$found_elements[] = $file;
				}
			}
		}
		return $found_elements;
	}

	/**
	 * Update plugin and sub plugins
	 */
	public function updateLanguages($a_lang_keys = NULL)
	{
		ilGlobalCache::flushAll();
		include_once("./Services/Language/classes/class.ilObjLanguage.php");

		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/../VideoSources'));
		$directories = $this->exploreDirectory($rii);
		$lang_array = array();
		$prefix = $this->getPrefix();
		foreach($directories as $dir)
		{
			$languages = $this->getAvailableLangFiles($dir);

			foreach($languages as $lang)
			{
				$txt = file($dir."/".$lang["file"]);
				if (is_array($txt))
				{
					foreach ($txt as $row)
					{
						if ($row[0] != "#" && strpos($row, "#:#") > 0)
						{
							$a = explode("#:#",trim($row));
							$lang_array[$lang["key"]][$prefix."_".trim($a[0])] = trim($a[1]);
							ilObjLanguage::replaceLangEntry($prefix, $prefix."_".trim($a[0]), $lang["key"], trim($a[1]));
						}
					}
				}
			}
		}
		
		foreach($lang_array as $lang => $elements)
		{
			ilObjLanguage::replaceLangModule($lang, $prefix, $elements);
		}
	}

	/**
	 * @return bool
	 */
	public function isCoreMin52()
	{
		return version_compare(ILIAS_VERSION_NUMERIC, '5.2.0', '>=');
	}

	public function allowCopy()
	{
		return true;
	}
}