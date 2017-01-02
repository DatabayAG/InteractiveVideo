<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSource.php';
/**
 * Class ilInteractiveVideoYoutube
 */
class ilInteractiveVideoYoutube implements ilInteractiveVideoSource
{

	const FORM_FIELD = 'youtube_url';

	/**
	 * @var string
	 */
	protected $id;

	/**
	 * @var string
	 */
	protected $version;

	/**
	 * @var string
	 */
	protected $youtube_id;

	/**
	 * ilInteractiveVideoYoutube constructor.
	 */
	public function __construct()
	{
		if (is_file(dirname(__FILE__) . '/version.php'))
		{
			include_once(dirname(__FILE__) . '/version.php');
			$this->version = $version;
			$this->id = $id;
		}
	}

	/**
	 * @param $obj_id
	 */
	public function doCreateVideoSource($obj_id)
	{

	}

	/**
	 * @param $obj_id
	 */
	public function doReadVideoSource($obj_id)
	{
		// TODO: Implement getVideoSource() method.
	}

	/**
	 * @param $obj_id
	 */
	public function doDeleteVideoSource($obj_id)
	{
		// TODO: Implement deleteVideoSource() method.
	}

	/**
	 * @param $original_obj_id
	 * @param $new_obj_id
	 */
	public function doCloneVideoSource($original_obj_id, $new_obj_id)
	{
		// TODO: Implement cloneVideoSource() method.
	}

	/**
	 * @param $obj_id
	 */
	public function doUpdateVideoSource($obj_id)
	{
		$youtube_id = self::getYoutubeIdentifier(ilUtil::stripSlashes($_POST[self::FORM_FIELD]));
		if($youtube_id)
		{
			$this->setYoutubeId($youtube_id);
		}
	}

	/**
	 * @param $obj_id
	 */
	public function beforeDeleteVideoSource($obj_id)
	{
		// TODO: Implement cloneVideoSource() method.
	}

	/**
	 * @return string
	 */
	public function getClass()
	{
		return __CLASS__;
	}

	/**
	 * @return bool
	 */
	public function isFileBased()
	{
		return true;
	}

	/**
	 * @return string
	 */
	public function getGUIClass()
	{
		require_once dirname(__FILE__) . '/class.ilInteractiveVideoYoutubeGUI.php';
		return new ilInteractiveVideoYoutubeGUI();
	}

	/**
	 * @return string
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @return string
	 */
	public function getClassPath()
	{
		return 'VideoSources/core/Youtube/class.ilInteractiveVideoYoutube.php';
	}

	/**
	 * @return string
	 */
	public function getVersion()
	{
		return $this->version;
	}

	/**
	 * @return string
	 */
	public function getYoutubeId()
	{
		return $this->youtube_id;
	}

	/**
	 * @param string $youtube_id
	 */
	public function setYoutubeId($youtube_id)
	{
		$this->youtube_id = $youtube_id;
	}

	/**
	 * @param $value
	 * @return mixed
	 */
	public static function getYoutubeIdentifier($value)
	{
		$re  = '/(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/';
		#$str = 'https://www.youtube.com/watch?v=7ZxWg0sw_BI';
		preg_match_all($re, $value, $matches);
		if(sizeof($matches) == 2)
		{
			return $matches[1][0];
		}
		return false;
	}
}