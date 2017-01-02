<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSource.php';
/**
 * Class ilInteractiveVideoMediaObject
 */
class ilInteractiveVideoMediaObject implements ilInteractiveVideoSource
{

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

	/**
	 * ilInteractiveVideoMediaObject constructor.
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
		$this->uploadVideoFile($obj_id);
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
		// TODO: Implement cloneVideoSource() method.
	}

	/**
	 * @param $obj_id
	 */
	public function beforeDeleteVideoSource($obj_id)
	{
		// TODO: Implement cloneVideoSource() method.
	}

	/**
	 * @param $obj_id
	 * @return bool
	 * @throws ilException
	 */
	public function uploadVideoFile($obj_id)
	{
		global $ilDB, $ilCtrl;

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
		ilUtil::moveUploadedFile($new_file['tmp_name'], $file_name, $file);

		// get mime type
		$format   = ilObjMediaObject::getMimeType($file);
		$location = $file_name;

		// set real meta and object data
		$media_item->setFormat($format);
		$media_item->setLocation($location);
		$media_item->setLocationType('LocalFile');

		$mob->setDescription($format);
		$media_item->setHAlign("Left");

		ilUtil::renameExecutables($mob_dir);
		$mob->update();

		$this->setMobId($mob->getId());
		ilObjMediaObject::_saveUsage( $mob->getId(), 'xvid', $obj_id);

		if(!$mob->getMediaItem('Standard'))
		{
			throw new ilException(sprintf("%s: No standard media item given", __METHOD__));
		}

		$format = $mob->getMediaItem('Standard')->getFormat();
		if(strpos($format, 'video') === false && strpos($format, 'audio') === false)
		{
			throw new ilException(sprintf("%s: No audio/video file given", __METHOD__));
		}

		//delete old mob-data 
		$res = $ilDB->queryF('SELECT mob_id FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'), array($this->getId()));
		$old_mob_ids = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$old_mob_ids[] = $row['mob_id'];
		}

		foreach($old_mob_ids as $mob_id)
		{
			$old_mob = new ilObjMediaObject($mob_id);
			$old_mob->delete();
			ilObjMediaObject::_removeUsage( $mob->getId(), 'xvid', $obj_id);
		}

		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'), array($obj_id));

		$ilDB->insert(
			'rep_robj_xvid_objects',
			array(
				'obj_id'        => array('integer', $obj_id),
				'mob_id'        => array('integer', $this->getMobId()),
				'is_anonymized' => array('integer', (int) $_POST['is_anonymized']),
				'is_repeat' 	=> array('integer', (int) $_POST['is_repeat']),
				'is_chronologic'=> array('integer', (int) $_POST['is_chronologic']),
				'is_public'     => array('integer', (int) $_POST['is_public']),
				'source_id'     => array('text', ilUtil::stripSlashes($_POST['source_id']))
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
		return true;
	}

	/**
	 * @return string
	 */
	public function getGUIClass()
	{
		require_once dirname(__FILE__) . '/class.ilInteractiveVideoMediaObjectGUI.php';
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
	public function getMobId()
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

}