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
	 * @return ilInteractiveVideoSource[]
	 */
	public function getVideoSources()
	{
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
					if($instance->isActivated())
					{
						$found_elements[$class] = $instance;
					}
				}
			}
		}
		return $found_elements;
	}
}