<?php
require_once 'Services/Component/classes/class.ilPluginDBUpdate.php';

/**
 * Class ilInteractiveVideoDbUpdater
 */
class ilInteractiveVideoDbUpdater extends ilPluginDBUpdate
{

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
	 * ilInteractiveVideoDbUpdater constructor.
	 * @param int  $a_db_handler
	 * @param bool $tmp_flag
	 */
	public function __construct($a_db_handler = 0,$tmp_flag = false)
	{
		global $ilDB;
		$this->db = $ilDB;
		$this->collectUpdateFiles();
		$this->iterateThroughUpdateFiles();
	}

	
	protected function iterateThroughUpdateFiles()
	{
		$this->LAST_UPDATE_FILE = $this->update_files[0];

		if($this->readLastUpdateFile())
		{
			$actual_version = $this->readFileVersion();
			if($actual_version > $this->getCurrentVersion())
			{
				$this->newer_version_found = true;
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
				$this->update_files[] = './Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/' . basename(dirname(dirname(dirname($file->getPathName())))) . '/' . basename(dirname(dirname($file->getPathName()))) . '/' . basename(dirname($file->getPathName())) . '/' . $file->getBasename();
			}
		}
	}

	public function getCurrentVersion()
	{
		return 0;
	}

	/**
	 * @return bool
	 */
	public function isNewerVersionFound()
	{
		return $this->newer_version_found;
	}

	/**
	 * Get db update file name for db step
	 */
	function getFileForStep($a_version)
	{
		return $this->LAST_UPDATE_FILE;
	}
	
	public function applyPluginUpdates()
	{
		$this->getCurrentVersion();

		$this->getFileForStep($this->currentVersion + 1);
		$this->LAST_UPDATE_FILE = $this->update_files[0];
		$this->DB_UPDATE_FILE = $this->update_files[0];
		$this->current_file = $this->update_files[0];

		$this->readDBUpdateFile();
		$this->readLastUpdateFile();
		$this->readFileVersion();
		$this->applyUpdate();
	}

	function loadXMLInfo()
	{
		// to do: reload control structure information for plugin
		return true;
	}
}