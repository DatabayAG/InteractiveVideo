<?php
require_once 'Services/Component/classes/class.ilPluginDBUpdate.php';

/**
 * Class ilInteractiveVideoDbUpdater
 */
class ilInteractiveVideoDbUpdater extends ilPluginDBUpdate
{
    //TODO: cleanup class
    private mixed $LAST_UPDATE_FILE = null;
    private mixed $DB_UPDATE_FILE = null;
    private mixed $current_file = null;
    protected ilDBInterface $db;

	/**
	 * @var array
	 */
	protected $update_files = null;

	/**
	 * @var bool
	 */
	protected $newer_version_found = false;

	/**
	 * @var array
	 */
	protected $update_map = [];

	/**
	 * @var string
	 */
	protected $plugin_id;

    protected $tpl;

    protected $xvid_instance;


    private string $db_update_file;
    private ?int $current_version = null;
    private ?int $file_version = null;

	/** @noinspection PhpMissingParentConstructorInspection */
	/**
	 * ilInteractiveVideoDbUpdater constructor.
	 * @param int  $a_db_handler
	 * @param bool $tmp_flag
	 */
	public function __construct($a_db_handler = 0, $tmp_flag = false)
	{
		global $DIC;

        $this->tpl = $DIC->ui()->mainTemplate();
		$this->db = $DIC->database();
        $component_repository = $DIC["component.repository"];
        foreach ($component_repository->getPlugins() as $plugin) {
            if($plugin->getId() === 'xvid') {
                $this->xvid_instance = $plugin;
            }
        }
        $this->collectUpdateFiles();
        $this->iterateThroughUpdateFiles();
        $class_map = require ILIAS_ABSOLUTE_PATH . '/libs/composer/vendor/composer/autoload_classmap.php';
        $this->ctrl_structure_iterator = new ilCtrlArrayIterator($class_map);
	}

	
	protected function iterateThroughUpdateFiles(): void
	{
		foreach($this->update_files as $file)
		{
            $this->db_update_file = $file;
            $this->plugin_id = $this->replaceFolderNameWithDbVersion($file, $this->file_version);
            $this->readDBUpdateFile();
            $this->readFileVersion();
            $current = $this->getCurrentVersion();
            if($this->file_version > $current)
			{
                $this->newer_version_found = true;
			}
		}

	}

	protected function collectUpdateFiles(): void
	{
		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/../VideoSources'));
		$this->update_files = [];
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
    public function getCurrentVersion(): int
	{
		$res = $this->db->queryF(
			'SELECT db_update FROM rep_robj_xvid_sources WHERE plugin_id = %s',
			['text'],
			[$this->plugin_id]
		);
		$row = $this->db->fetchAssoc($res);
        if($row !== null && isset($row['db_update'])) {
            return (int) $row['db_update'];
        } else {
            return 0;
        }

	}

    /**
     * @param int $a_version
     * @return void
     */
    public function setCurrentVersion(?int $a_version): void
	{
		$this->db->update('rep_robj_xvid_sources',
			[
				'db_update' 	=> ['integer', $a_version]
            ],
			[
				'plugin_id' => ['text', $this->plugin_id]
            ]
		);
	}
	public function isNewerVersionFound(): bool
	{
		return $this->newer_version_found;
	}

    /**
     * @param int $a_version
     * @return string
     */
    public function getFileForStep(int $a_version /* doesn't matter */): string
	{
		return $this->LAST_UPDATE_FILE;
	}

	public function applyPluginUpdates(): void
	{
		$overall_success = true;
		$error = '';
		foreach($this->update_files as $file)
		{
			$this->LAST_UPDATE_FILE	= $file;
			$this->DB_UPDATE_FILE	= $file;
            $this->db_update_file   = $file;
			$this->current_file		= $file;
            $folder = dirname($file, 2) . '/';
            $this->plugin_id = $this->getPluginId($folder);
            $this->getFileForStep($this->current_version + 1);
			$this->readDBUpdateFile();
			$this->readFileVersion();
			$return_value = $this->applyUpdate();
			if(is_null($return_value) || $return_value === true)
			{
				$this->setCurrentVersion($this->file_version);
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
            $this->tpl->setOnScreenMessage("success", sprintf(ilInteractiveVideoPlugin::getInstance()->txt('db_update_worked'), $error), true);
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", sprintf(ilInteractiveVideoPlugin::getInstance()->txt('db_update_failed'), $error), true);
		}
	}

	/**
	 * @return bool
	 */
    public function loadXMLInfo(): bool
	{
		return true;
	}

	/**
	 * @param $folder
	 */
	protected function getPluginFolder($folder): void
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
				$this->update_map[$key]= ['file' => $file_version, 'installed'	=> $this->getCurrentVersion()];
				return $key;
			}
		}
	}

	/**
	 * @return mixed[]
	 */
	public function getMap(): array
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

    private function readDBUpdateFile(): void
    {
        if (!file_exists($this->db_update_file)) {
            $this->error = 'no_db_update_file';
            $this->filecontent = [];
            return;
        }

        $this->filecontent = @file($this->db_update_file);
    }

    private function readFileVersion(): void
    {
        //go through filecontent and search for last occurence of <#x>
        reset($this->filecontent);
        $regs = [];
        $version = 0;
        foreach ($this->filecontent as $row) {
            if (preg_match('/^\<\#([0-9]+)>/', $row, $regs)) {
                $version = $regs[1];
            }
        }

        $this->file_version = (int) $version;
    }

    public function applyUpdate()
    {
        $ilCtrlStructureReader = null;
        $ilDB = null;
        $this->initGlobalsRequiredForUpdateSteps($ilCtrlStructureReader, $ilDB);

        $file_version = $this->file_version;
        $current_version = $this->current_version;

        $this->updateMsg = 'no_changes';
        if ($current_version < $file_version) {
            $msg = [];
            for ($i = ($current_version + 1); $i <= $file_version; $i++) {
                if ($this->applyUpdateNr($i) === false) {
                    $msg[] = 'msg: update_error - ' . $this->error . '; nr: ' . $i . ';';
                    $this->updateMsg = implode("\n", $msg);

                    return false;
                }

                $msg[] = 'msg: update_applied; nr: ' . $i . ';';
            }

            $this->updateMsg = implode('\n', $msg);
        }
    }

}
