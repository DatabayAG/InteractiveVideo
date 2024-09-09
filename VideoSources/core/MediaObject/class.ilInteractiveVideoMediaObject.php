<?php
/**
 * Class ilInteractiveVideoMediaObject
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoMediaObject implements ilInteractiveVideoSource
{

	const TABLE_NAME = 'rep_robj_xvid_mobs';

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
	protected $mob_id;
	
	public $import_part_path = '';
	
	public $import_file_name = '';

	/**
	 * ilInteractiveVideoMediaObject constructor.
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
	 * @param $obj_id
	 * @return int
	 */
	public function doReadVideoSource($obj_id)
	{
		global $ilDB;
		$result = $ilDB->query('SELECT mob_id FROM '. self::TABLE_NAME .' WHERE obj_id = '.$ilDB->quote($obj_id, 'integer'));
		$row = $ilDB->fetchAssoc($result);
        if(isset($row['mob_id'])){
            return (int) $row['mob_id'];
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
		$mob = new ilObjMediaObject($this->doReadVideoSource($original_obj_id));
		$new_mob = $mob->duplicate();
		ilObjMediaObject::_saveUsage($new_mob->getId(), 'xvid', $new_obj_id);
		$this->setMobId($new_mob->getId());
		$this->saveDataToDb($new_obj_id);
	}

	/**
	 * @param $obj_id
	 */
	public function doUpdateVideoSource($obj_id)
	{
		if (isset($_FILES['video_file']))
		{
			$file = $_FILES['video_file'];
			if ($file['error'] == 0 && $this->import_file_name == '') {
				$this->uploadVideoFile($obj_id);
			}
		}
	}

	/**
	 * @param $obj_id
	 */
	public function beforeDeleteVideoSource($obj_id)
	{
        $video_source_id = $this->doReadVideoSource($obj_id);
        if($video_source_id !== null) {
            $mob = new ilObjMediaObject($video_source_id);
            ilObjMediaObject::_removeUsage($mob->getId(), 'xvid', $obj_id);
            $this->removeMobFromPluginTable($obj_id, $mob->getId());
            $mob->delete();
        }
	}

	/**
	 * @param $obj_id
	 * @return bool
	 * @throws ilException
	 */
	public function uploadVideoFile($obj_id)
	{
		/**
		 * @var $ilCtrl ilCtrl
		 */
		global $ilCtrl;

		if(!isset($_FILES) || !is_array($_FILES)|| !isset($_FILES['video_file']))
		{
			$cmd = $ilCtrl->getCmd();
			if($cmd == 'saveTarget')
			{
				// doClone .. 
				return true;
			}
			else
			{
				throw new ilException(sprintf("%s: Missing file", __METHOD__));
			}
		}

		$new_file = $_FILES['video_file'];

		$mob = new ilObjMediaObject();
		$mob->setTitle($new_file['name']);
		$mob->setDescription('');
		$mob->create();

		$mob->createDirectory();
		$mob_dir = ilObjMediaObject::_getDirectory($mob->getId());

		$media_item = new ilMediaItem();
		$mob->addMediaItem($media_item);
		$media_item->setPurpose('Standard');

		$file_name = ilObjMediaObject::fixFilename($new_file['name']);
		$file      = $mob_dir . '/' . $file_name;

		if(file_exists($new_file['tmp_name']))
		{
			ilFileUtils::moveUploadedFile($new_file['tmp_name'], $file_name, $file);
		}

		// get mime type
		$format   = ilObjMediaObject::getMimeType($file);
		$location = $file_name;

		// set real meta and object data
		$media_item->setFormat($format);
		$media_item->setLocation($location);
		$media_item->setLocationType('LocalFile');

		$mob->setDescription($format);
		$media_item->setHAlign("Left");

        ilFileUtils::renameExecutables($mob_dir);

		$mob->update();

		$this->setMobId($mob->getId());
		ilObjMediaObject::_saveUsage($mob->getId(), 'xvid', $obj_id);

		if(!$mob->getMediaItem('Standard'))
		{
			throw new ilException(sprintf("%s: No standard media item given", __METHOD__));
		}

		$format = $mob->getMediaItem('Standard')->getFormat();
		if(strpos($format, 'video') === false && strpos($format, 'audio') === false)
		{
			throw new ilException(sprintf("%s: No audio/video file given", __METHOD__));
		}

		$this->removeOldMobFiles($obj_id, $mob);

		$this->saveDataToDb($obj_id);
	}

	/**
	 * @param $obj_id
	 * @param $mob
	 */
	protected function removeOldMobFiles($obj_id, $mob)
	{
		global $ilDB;
		$res = $ilDB->queryF('SELECT mob_id FROM '. self::TABLE_NAME .' WHERE obj_id = %s',array('integer'), array($obj_id));

		$old_mob_ids = array();

		while($row = $ilDB->fetchAssoc($res))
		{
			$old_mob_ids[] = $row['mob_id'];
		}

		foreach($old_mob_ids as $mob_id)
		{
			if($mob_id != $mob->getId())
			{
				$a = $mob->getId();
				$old_mob = new ilObjMediaObject($mob_id);
				ilObjMediaObject::_removeUsage($old_mob->getId(), 'xvid', $obj_id);
				$this->removeMobFromPluginTable($obj_id, $mob_id);
				$old_mob->delete();
			}
		}
	}

	/**
	 * @param $obj_id
	 */
	protected function saveDataToDb($obj_id)
	{
		global $ilDB;

		$ilDB->insert(
			self::TABLE_NAME,
			array(
				'obj_id'         => array('integer', $obj_id),
				'mob_id'         => array('integer', $this->getMobId())
			)
		);
	}

	/**
	 * @param $obj_id
	 * @param $mob_id
	 */
	protected function removeMobFromPluginTable($obj_id, $mob_id)
	{
		global $ilDB;
		$ilDB->manipulateF('DELETE FROM '. self::TABLE_NAME .' WHERE obj_id = %s AND mob_id = %s',
			array('integer', 'integer'), array($obj_id, $mob_id));
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
	 * @return ilInteractiveVideoMediaObjectGUI
	 */
	public function getGUIClass()
	{
		return new ilInteractiveVideoMediaObjectGUI();
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
		return 'VideoSources/core/MediaObject/class.ilInteractiveVideoMediaObject.php';
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
	protected function getMobId()
	{
		return $this->mob_id;
	}

	/**
	 * @param string $mob_id
	 */
	protected function setMobId($mob_id)
	{
		$this->mob_id = $mob_id;
	}

	/**
	 * @param $obj_id
	 * @return string
	 */
	public function getPath($obj_id)
	{
		$mob        = new ilObjMediaObject($this->doReadVideoSource($obj_id));
		$mob_id     = $mob->getId();
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		return $mob_dir . '/' . $media_item['location'];
	}

	/**
	 * @param int $obj_id
	 * @param ilXmlWriter $xml_writer
	 * @param string $export_path
	 */
	public function doExportVideoSource($obj_id, $xml_writer, $export_path)
	{
		$mob = new ilObjMediaObject($this->doReadVideoSource($obj_id));
		$mob->exportXML($xml_writer);
		ilFileUtils::makeDirParents($export_path . '/objects');
		$mob->exportFiles($export_path);
	}

	/**
	 *
	 */
	public function getVideoSourceImportParser()
	{
		return 'ilInteractiveVideoMediaObjectXMLParser';
	}

	/**
	 * @param $obj_id
	 * @param $import_dir
	 */
	public function afterImportParsing($obj_id, $import_dir)
	{
		$mob = new ilObjMediaObject();
		$mob->setTitle($this->import_file_name);
		$mob->setDescription('');
		$mob->create();

		$mob->createDirectory();
		$mob_dir = ilObjMediaObject::_getDirectory($mob->getId());

		$media_item = new ilMediaItem();
		$mob->addMediaItem($media_item);
		$media_item->setPurpose('Standard');

		$file_name = ilObjMediaObject::fixFilename($this->import_file_name);
		$file      = $mob_dir . '/' . $file_name;

		$tmp_file = $import_dir .'/Plugins/xvid/set_1/expDir_1/objects/' . $this->import_part_path .'/'. $this->import_file_name;
		if(file_exists($tmp_file))
		{
			copy($tmp_file, $file);
			$this->setMobId($mob->getId());
			// get mime type
			$format   = ilObjMediaObject::getMimeType($file);
			$location = $file_name;

			// set real meta and object data
			$media_item->setFormat($format);
			$media_item->setLocation($location);
			$media_item->setLocationType('LocalFile');

			$mob->setDescription($format);
			$media_item->setHAlign("Left");

			ilFileUtils::renameExecutables($mob_dir);

			$mob->update();

			$this->setMobId($mob->getId());
			ilObjMediaObject::_saveUsage($mob->getId(), 'xvid', $obj_id);
			$this->saveDataToDb($obj_id);
		}
	}

	public function hasOwnPlayer()
	{
		return false;
	}
}