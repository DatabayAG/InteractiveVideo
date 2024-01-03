<?php
/**
 * Class ilInteractiveVideoSourceFactory
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoSourceFactory
{
	const TABLE_NAME = 'rep_robj_xvid_sources';

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
	 * @var null | array
	 */
	protected static $video_sources;

	/**
	 * @return ilInteractiveVideoSource[]
	 */
	public function getVideoSources()
	{
		$this->readSourceSettings();
		if(self::$video_sources == null)
		{
			$this->getNativeVideoSources();
			$this->getPluginVideoSources();
			self::$video_sources = array_merge(self::$native_type, self::$plugin_type);
		}

		return self::$video_sources;
	}

	/**
	 * @param $source_id
	 * @return ilInteractiveVideoSource
	 */
	public function getVideoSourceObject($source_id)
	{
		$sources = $this->getVideoSources();
		foreach($sources as $class => $object)
		{
			if($source_id === $object->getId())
			{
				return $object;
			}
		}
		return null;
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
			if($file->getExtension() === 'php' && $file->getFilename() !== 'version.php'  && $file->getFilename() !== 'dbupdate.php')
			{
				$class      = str_replace(array('class.', '.php'), '', $file->getBasename());
				$reflection = new ReflectionClass($class);
				if( !$reflection->isAbstract() && $reflection->implementsInterface($interface))
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
	 * @param $class
	 * @return bool
	 */
	public function getVersion($class)
	{
		return $this->sources_settings[$class]['version'];
	}

	/**
	 * @return string
	 */
	public function getDefaultVideoSource()
	{
		return 'imo';
	}

	/**
	 * @param $source_id
	 * @return array|null
	 */
	public function getSourceSettings($source_id)
	{
		$sources = $this->sources_settings;
		foreach($sources as $class => $settings)
		{
			if($source_id === $settings['plugin_id'])
			{
				return $settings;
			}
		}
		return null;
	}

	protected function readSourceSettings()
	{
		/**
		 * @var ilDB		$ilDb;
		 */
		global $ilDB;
		$res = $ilDB->query('SELECT * FROM ' . self::TABLE_NAME);

		while($row = $ilDB->fetchAssoc($res))
		{
			$this->sources_settings[$row['plugin_name']] = array('active'		=> $row['is_activated'],
																 'db_update'	=> $row['db_update'],
																 'plugin_id'	=> $row['plugin_id'],
																 'class_path'	=> $row['class_path'],
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
		global $ilDB, $DIC;

		$this->readSourceSettings();
		$flip = array_keys($settings['settings']);
		$mapping = $settings['mappings'];
        $db_settings = new ilSetting('xvid');
		$ilDB->manipulate('
		DELETE FROM ' . self::TABLE_NAME  . ' 
		WHERE 	' . $ilDB->in('plugin_name', $flip, false, 'text'));

		foreach($settings['settings'] as $key => $value)
		{
            if(strlen($key) > 0
                && array_key_exists($key, $mapping)
                && array_key_exists('id', $mapping[$key]))
            {
                $ilDB->insert(self::TABLE_NAME, array('plugin_name'		=> array('text', $key),
                    'is_activated'	=> array('integer', $value),
                    'plugin_id'		=> array('text', $mapping[$key]['id']),
                    'db_update'		=> array('text', $this->sources_settings[$key]['db_update']),
                    'class_path'	=> array('text', $mapping[$key]['path'])
                ));
            } else if($key === 'activate_marker'){
                if((int) $value === 1){
                    $db_settings->set('xvid_activate_marker', 1);
                } else {
                    $db_settings->delete('xvid_activate_marker');
                }
            }

		}
	}
}
