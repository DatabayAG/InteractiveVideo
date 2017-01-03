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
	 * @var string
	 */
	protected $core_folder;

	/**
	 * ilInteractiveVideoYoutube constructor.
	 */
	public function __construct()
	{
		if (is_file(dirname(__FILE__) . '/version.php'))
		{
			include(dirname(__FILE__) . '/version.php');
			$this->version		= $version;
			$this->id			= $id;
			$this->core_folder	= basename(dirname(dirname(__FILE__))) . '/' .basename(dirname(__FILE__));
		}
	}

	/**
	 * @param $obj_id
	 */
	public function doCreateVideoSource($obj_id)
	{
		$this->doUpdateVideoSource($obj_id);
	}

	/**
	 * @param $obj_id
	 * @return int
	 */
	public function doReadVideoSource($obj_id)
	{
		global $ilDB;
		$result = $ilDB->query('SELECT youtube_id FROM rep_robj_xvid_youtube WHERE obj_id = '.$ilDB->quote($obj_id, 'integer'));
		$row = $ilDB->fetchAssoc($result);
		return $row['youtube_id'];
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
		global $ilDB;
		
		$youtube_id = self::getYoutubeIdentifier(ilUtil::stripSlashes($_POST[self::FORM_FIELD]));

		if($youtube_id)
		{
			$ilDB->manipulate('DELETE FROM rep_robj_xvid_youtube WHERE obj_id = ' . $ilDB->quote($obj_id, 'integer'));
			$this->setYoutubeId($youtube_id);
			$ilDB->insert(
				'rep_robj_xvid_youtube',
				array(
					'obj_id'     => array('integer', $obj_id),
					'youtube_id' => array('text', $youtube_id)
				)
			);
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
		return false;
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
	 * @return string | boolean
	 */
	public static function getYoutubeIdentifier($value)
	{
		$regex = '/(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/';
		preg_match_all($regex, $value, $matches);
		if(sizeof($matches) == 2 && array_key_exists(0, $matches[1]))
		{
			return $matches[1][0];
		}
		return false;
	}
}