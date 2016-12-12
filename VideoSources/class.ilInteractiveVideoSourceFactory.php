<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSource.php';
/**
 * Class ilInteractiveVideoSourceFactory
 */
class ilInteractiveVideoSourceFactory
{
	/**
	 * @var ilInteractiveVideoSource[]
	 */
	protected static $native_type;

	/**
	 * @var ilInteractiveVideoSource[]
	 */
	protected static $plugin_type;

	/**
	 * @var array
	 */
	protected $sources_settings = array();

	/**
	 * @return ilInteractiveVideoSource[]
	 */
	public function getVideoSources()
	{
		$this->readSourceSettings();
		$this->getNativeVideoSources();
		$this->getPluginVideoSources();
		return array_merge(self::$native_type, self::$plugin_type);
	}

	/**
	 * @return ilInteractiveVideoSource[]
	 */
	protected function getNativeVideoSources()
	{
		if(null !== self::$native_type)
		{
			return self::$native_type;
		}

		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/core'));
		self::$native_type = $this->exploreDirectory($rii, 'ilInteractiveVideoSource');
		return self::$native_type;
	}


	/**
	 * @return ilInteractiveVideoSource[]
	 */
	protected function getPluginVideoSources()
	{
		if(null !== self::$plugin_type)
		{
			return self::$plugin_type;
		}

		$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__FILE__) . '/plugin'));
		self::$plugin_type = $this->exploreDirectory($rii, 'ilInteractiveVideoSource');
		return self::$plugin_type;
	}

	/**
	 * @param RecursiveIteratorIterator $rii
	 * @param $interface
	 * @return array
	 */
	protected function exploreDirectory($rii, $interface)
	{
		$found_elements = array();
		/** @var SplFileInfo $file */
		foreach($rii as $file)
		{
			if($file->isDir())
			{
				continue;
			}
			if($file->getExtension() === 'php')
			{
				require_once $file;
				$class      = str_replace(array('class.', '.php'), '', $file->getBasename());
				$reflection = new ReflectionClass($class);
				if(
					!$reflection->isAbstract() &&
					$reflection->implementsInterface($interface)
				)
				{
					/** @var $instance ilInteractiveVideoSource */
					$instance = new $class();
					$found_elements[$class] = $instance;
				}
			}
		}
		return $found_elements;
	}

	/**
	 * @param $class
	 * @return bool
	 */
	public function isActive($class)
	{
		return (bool) $this->sources_settings[$class]['active'];
	}

	/**
	 * @return string
	 */
	public function getDefaultVideoSource()
	{
		return 'ilInteractiveVideoMediaObject';
	}

	protected function readSourceSettings()
	{
		/**
		 * @var ilDB		$ilDb;
		 */
		global $ilDB;
		$res = $ilDB->query('SELECT * FROM rep_robj_xvid_sources');

		while($row = $ilDB->fetchAssoc($res))
		{
			$this->sources_settings[$row['plugin_name']] = array('active'		=> $row['is_activated'],
																 'db_update'	=> $row['db_update'],
																 'version'		=> $row['version']);
		}
	}

	/**
	 * @param $settings
	 */
	public function saveSourceSettings($settings)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;

		$flip = array_keys($settings);
		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_sources 
		WHERE 	' . $ilDB->in('plugin_name', $flip, false, 'text'));

		foreach($settings as $key => $value)
		{
			$ilDB->insert('rep_robj_xvid_sources', array('plugin_name' => array('text', $key), 'is_activated' => array('integer', $value)));
		}
	}
}