<?php
require_once 'Services/Component/classes/class.ilPluginDBUpdate.php';

/**
 * Class ilInteractiveVideoDbUpdater
 */
class ilInteractiveVideoDbUpdater extends ilPluginDBUpdate
{

	/**
	 * @var ilDB
	 */
	protected $db;

	/**
	 * @var array
	 */
	protected $update_files;

	/**
	 * @var bool
	 */
	protected $newer_version_found = false;

	/**
	 * @var array
	 */
	protected $update_map = array();

	/**
	 * @var string
	 */
	protected $plugin_id;

	/** @noinspection PhpMissingParentConstructorInspection */
	/**
	 * ilInteractiveVideoDbUpdater constructor.
	 * @param int  $a_db_handler
	 * @param bool $tmp_flag
	 */
	public function __construct($a_db_handler = 0, $tmp_flag = false)
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$this->db = $ilDB;
		$this->collectUpdateFiles();
		$this->iterateThroughUpdateFiles();
	}

	
	protected function iterateThroughUpdateFiles()
	{
		foreach($this->update_files as $file)
		{
			$this->LAST_UPDATE_FILE = $file;
			if($this->readLastUpdateFile())
			{
				$actual_version = $this->readFileVersion();
				$this->plugin_id = $this->replaceFolderNameWithDbVersion($file, $actual_version);
				if($actual_version > $this->getCurrentVersion())
				{
					$this->newer_version_found = true;
				}
			}
		}

	}

	protected function collectUpdateFiles()
	{
		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/../VideoSources'));
		$this->update_files = array();
		/** @var SplFileInfo $file */
		foreach($rii as $file)
		{
			if($file->isDir())
			{
				continue;
			}
			if($file->getFilename() === 'dbupdate.php')
			{
				$folder = './Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/' . basename(dirname(dirname(dirname($file->getPathName())))) . '/' . basename(dirname(dirname($file->getPathName()))) . '/' ;
				$this->getPluginFolder($folder);
				$this->update_files[] = $folder . basename(dirname($file->getPathName())) . '/' . $file->getBasename();
			}
		}
	}

	/**
	 * @return int
	 */
	public function getCurrentVersion()
	{
		$res = $this->db->queryF(
			'SELECT db_update FROM rep_robj_xvid_sources WHERE plugin_id = %s',
			array('text'),
			array($this->plugin_id)
		);
		$row = $this->db->fetchAssoc($res);
		return (int) $row['db_update'];
	}

	/**
	 * @param $a_version
	 * @return bool
	 */
	function setCurrentVersion($a_version)
	{
		$this->db->update('rep_robj_xvid_sources',
			array(
				'db_update' 	=> array('integer', (int)$a_version)
			),
			array(
				'plugin_id' => array('text', $this->plugin_id)
			)
		);
		return true;
	}
	/**
	 * @return bool
	 */
	public function isNewerVersionFound()
	{
		return $this->newer_version_found;
	}

	/**
	 * @param $a_version
	 * @return string
	 */
	function getFileForStep($a_version)
	{
		return $this->LAST_UPDATE_FILE;
	}

	public function applyPluginUpdates()
	{
		$overall_success = true;
		$error = '';
		foreach($this->update_files as $file)
		{
			$this->getCurrentVersion();

			$this->plugin_id = $this->getPluginId(dirname(dirname($file)). '/');
			$this->getFileForStep($this->currentVersion + 1);
			$this->LAST_UPDATE_FILE	= $file;
			$this->DB_UPDATE_FILE	= $file;
			$this->current_file		=$file;

			$this->readDBUpdateFile();
			$this->readLastUpdateFile();
			$version = $this->readFileVersion();
			$return_value = $this->applyUpdate();
			if($return_value)
			{
				$this->setCurrentVersion($version);
			}
			else
			{
				$error .= $return_value;
				if($overall_success)
				{
					$overall_success = false;
				}
			}
		}
		if($overall_success)
		{
			ilUtil::sendSuccess(ilInteractiveVideoPlugin::getInstance()->txt('db_update_worked'));
		}
		else
		{
			ilUtil::sendFailure(sprintf(ilInteractiveVideoPlugin::getInstance()->txt('db_update_failed'), $error));
		}
	}

	/**
	 * @return bool
	 */
	function loadXMLInfo()
	{
		return true;
	}

	/**
	 * @param $folder
	 */
	protected function getPluginFolder($folder)
	{
		$plugin_id = $this->getPluginId($folder);
		if(file_exists($folder . 'sql/dbupdate.php'))
		{
			$this->update_map[$plugin_id] = $folder . 'sql/dbupdate.php'; 
		}
	}

	/**
	 * @param $file
	 * @param $file_version
	 * @return int|string
	 */
	protected function replaceFolderNameWithDbVersion($file, $file_version)
	{
		foreach($this->update_map as $key => $value)
		{
			if($file == $value)
			{
				$this->plugin_id = $key;
				$this->update_map[$key]= array('file' => $file_version, 'installed'	=> $this->getCurrentVersion());
				return $key;
			}
		}
	}

	/**
	 * @return array
	 */
	public function getMap()
	{
		return $this->update_map;
	}

	/**
	 * @param $folder
	 * @return string
	 */
	protected function getPluginId($folder)
	{
		$file = $folder . 'version.php';
		if(file_exists($file))
		{
			include($file);
			return $id;
		}
	}
}