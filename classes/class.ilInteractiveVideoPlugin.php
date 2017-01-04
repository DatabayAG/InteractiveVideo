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
	public function updateLanguages()
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
}