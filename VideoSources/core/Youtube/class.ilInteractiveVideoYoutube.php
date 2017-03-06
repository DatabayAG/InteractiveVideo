<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSource.php';
/**
 * Class ilInteractiveVideoYoutube
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoYoutube implements ilInteractiveVideoSource
{

	const FORM_FIELD = 'youtube_url';
	
	const TABLE_NAME = 'rep_robj_xvid_youtube';

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
			include(dirname(__FILE__) . '/version.php');
			$this->version		= $version;
			$this->id			= $id;
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
		$result = $ilDB->query('SELECT youtube_id FROM '.self::TABLE_NAME.' WHERE obj_id = '.$ilDB->quote($obj_id, 'integer'));
		$row = $ilDB->fetchAssoc($result);
		return $row['youtube_id'];
	}

	/**
	 * @param $obj_id
	 */
	public function doDeleteVideoSource($obj_id)
	{
		$this->beforeDeleteVideoSource($obj_id);
	}

	/**
	 * @param $original_obj_id
	 * @param $new_obj_id
	 */
	public function doCloneVideoSource($original_obj_id, $new_obj_id)
	{
		$youtube_id = $this->doReadVideoSource($original_obj_id);
		$this->saveData($new_obj_id, $youtube_id);
	}

	/**
	 * @param $obj_id
	 */
	public function doUpdateVideoSource($obj_id)
	{
		if(ilUtil::stripSlashes($_POST[self::FORM_FIELD]))
		{
			$youtube_id = self::getYoutubeIdentifier(ilUtil::stripSlashes($_POST[self::FORM_FIELD]));
		}
		else
		{
			$youtube_id = $this->getYoutubeId();
		}

		if($youtube_id)
		{
			$this->removeEntryFromTable($obj_id);
			$this->setYoutubeId($youtube_id);
			$this->saveData($obj_id, $youtube_id);
		}
	}

	/**
	 * @param $obj_id
	 * @param $youtube_id
	 */
	protected function saveData($obj_id, $youtube_id)
	{
		global $ilDB;
		$ilDB->insert(
			self::TABLE_NAME,
			array(
				'obj_id'     => array('integer', $obj_id),
				'youtube_id' => array('text', $youtube_id)
			)
		);
	}

	/**
	 * @param $obj_id
	 */
	public function beforeDeleteVideoSource($obj_id)
	{
		$this->removeEntryFromTable($obj_id);
	}

	/**
	 * @param $obj_id
	 */
	public function removeEntryFromTable($obj_id)
	{
		global $ilDB;
		$ilDB->manipulateF('DELETE FROM '.self::TABLE_NAME.' WHERE obj_id = %s',
			array('integer'), array($obj_id));
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
	 * @return ilInteractiveVideoYoutubeGUI
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

	/**
	 * @param $obj_id
	 * @return string
	 */
	public function getPath($obj_id)
	{
		return '';
	}

	/**
	 * @param int $obj_id
	 * @param ilXmlWriter $xml_writer
	 * @param string $export_path
	 */
	public function doExportVideoSource($obj_id, $xml_writer, $export_path)
	{
		$youtube_id = $this->doReadVideoSource($obj_id);
		$xml_writer->xmlElement('YoutubeId', null, (string)$youtube_id);
	}

	/**
	 *
	 */
	public function getVideoSourceImportParser()
	{
		require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/class.ilInteractiveVideoYoutubeXMLParser.php';
		return 'ilInteractiveVideoYoutubeXMLParser';
	}
}