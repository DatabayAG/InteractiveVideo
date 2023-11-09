<?php
/**
 * Class ilInteractiveVideoSimpleUrl
 */
class ilInteractiveVideoSimpleUrl implements ilInteractiveVideoSource
{
	const FORM_URL_FIELD = 'simple_url';

	const TABLE_NAME = 'rep_robj_xvid_surl';

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
	protected $core_folder;

	/**
	 * @var string
	 */
	protected $simple_url;

	/**
	 * ilInteractiveVideoYoutube constructor.
	 */
	public function __construct()
	{
		if (is_file(dirname(__FILE__) . '/version.php'))
		{
			include(dirname(__FILE__) . '/version.php');
			$this->version = $version;
			$this->id = $id;
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
	 * @param int $obj_id
	 */
	public function doReadVideoSource($obj_id)
	{
		global $ilDB;
		$result = $ilDB->query('SELECT simple_url FROM '.self::TABLE_NAME.' WHERE obj_id = '.$ilDB->quote($obj_id, 'integer'));
		$row = $ilDB->fetchAssoc($result);
        if(isset($row['simple_url'])){
            $this->setSimpleUrl($row['simple_url']);
        }
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
		$this->doReadVideoSource($original_obj_id);
		$this->saveData($new_obj_id, $this->getSimpleUrl());
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
	 * @param $obj_id
	 */
	public function doUpdateVideoSource($obj_id)
	{
		if(ilUtil::stripSlashes($_POST['simple_url']))
		{
			$simple_url =ilUtil::stripSlashes($_POST['simple_url']);
		}
		else
		{
			$simple_url = $this->getSimpleUrl();
		}
		$this->removeEntryFromTable($obj_id);
		$this->saveData($obj_id, $simple_url);
	}

	/**
	 * @param $obj_id
	 * @param $simple_url
	 */
	protected function saveData($obj_id, $simple_url)
	{
		global $ilDB;
		$ilDB->insert(
			self::TABLE_NAME,
			array(
				'obj_id'     => array('integer', $obj_id),
				'simple_url'    => array('text', $simple_url)
			)
		);
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
	 * @return ilInteractiveVideoSimpleUrlGUI
	 */
	public function getGUIClass()
	{
		require_once dirname(__FILE__) . '/class.ilInteractiveVideoSimpleUrlGUI.php';
		return new ilInteractiveVideoSimpleUrlGUI();
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
		return 'VideoSources/core/SimpleUrl/class.ilInteractiveVideoSimpleUrl.php';
	}

	/**
	 * @return string
	 */
	public function getVersion()
	{
		return $this->version;
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
	 * @return string
	 */
	public function getSimpleUrl()
	{
		return $this->simple_url;
	}

	/**
	 * @param string $simple_url
	 */
	public function setSimpleUrl($simple_url)
	{
		$this->simple_url = $simple_url;
	}

	/**
	 * @param int $obj_id
	 * @param ilXmlWriter $xml_writer
	 * @param string $export_path
	 */
	public function doExportVideoSource($obj_id, $xml_writer, $export_path)
	{
		$this->doReadVideoSource($obj_id);
		$xml_writer->xmlElement('SimpleURL', null, (string)$this->getSimpleUrl());
	}

	/**
	 *
	 */
	public function getVideoSourceImportParser()
	{
		return 'ilInteractiveVideoSimpleUrlXMLParser';
	}

	/**
	 * @param $obj_id
	 * @param $import_dir
	 */
	public function afterImportParsing($obj_id, $import_dir)
	{

	}

	public function hasOwnPlayer()
	{
		return false;
	}

}