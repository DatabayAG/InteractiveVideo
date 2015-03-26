<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPlugin.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObject.php';

/**
 * Class ilObjInteractiveVideo
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideo extends ilObjectPlugin
{
	/**
	 * @var integer
	 */
	protected $mob_id = 0;

	/**
	 * 
	 */
	protected function doRead()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM rep_robj_xvid_objects WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);

		$this->setMobId($row['mob_id']);

		parent::doRead();
	}

	/**
	 * @return bool
	 * @throws ilException
	 */
	protected function beforeCreate()
	{
		if(!isset($_FILES) || !is_array($_FILES) || !isset($_FILES['video_file']))
		{
			throw new ilException(sprintf("%s: Missing file", __METHOD__));
		}

		return true;
	}

	/**
	 * 
	 */
	protected function doCreate()
	{
		/**
		 * @var $ilDB  ilDB
		 * @var $ilLog ilLog
		 */
		global $ilDB, $ilLog;
		
		try
		{
			$new_file = $_FILES['video_file'];

			$mob = new ilObjMediaObject();
			$mob->setTitle($new_file['name']);
			$mob->setDescription('');
			$mob->create();

			$mob_dir = ilObjMediaObject::_getDirectory($mob->getId());
			if(!is_dir($mob_dir))
			{
				$mob->createDirectory();
			}

			$media_item = new ilMediaItem();
			$mob->addMediaItem($media_item);
			$media_item->setPurpose('Standard');

			$file_name = ilObjMediaObject::fixFilename($_FILES['video_file']['name']);
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

			// determine width and height of known image types
			$wh = ilObjMediaObject::_determineWidthHeight(500, 400, $format,
				"File", $mob_dir . "/" . $location, $media_item->getLocation(),
				true, true, "", "");
			$media_item->setWidth($wh["width"]);
			$media_item->setHeight($wh["height"]);

			$media_item->setHAlign("Left");
			ilUtil::renameExecutables($mob_dir);
			$mob->update();
			$this->setMobId($mob->getId());

			$ilDB->insert(
				'rep_robj_xvid_objects',
				array(
					'ref_id' => array('integer', $this->getId()),
					'mob_id' => array('integer', $this->getMobId())
				)
			);

			parent::doCreate();

			$this->createMetaData();
		}
		catch(Exception $e)
		{
			$ilLog->write($e->getMessage());
			$ilLog->logStack();

			$this->delete();

			throw new ilException(sprintf("%s: Creation incomplete", __METHOD__));
		}
	}

	/**
	 *
	 */
	protected function doUpdate()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		parent::doUpdate();
		
		$this->updateMetaData();
	}

	/**
	 * 
	 */
	public function beforeDelete()
	{
		include_once("./Services/MediaObjects/classes/class.ilObjMediaObject.php");

		$mob = new ilObjMediaObject($this->getId());
		$mob->delete();
	}

	/**
	 * 
	 */
	protected function doDelete()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_objects WHERE obj_id = ' . $ilDB->quote($this->getId(), 'integer'));
		$ilDB->manipulate('DELETE FROM rep_robj_xvid_comments WHERE obj_id = ' . $ilDB->quote($this->getId(), 'integer'));

		parent::doDelete();
		
		$this->deleteMetaData();
	}

	/**
	 * @param self    $new_obj
	 * @param integer $a_target_id
	 * @param integer $a_copy_id
	 */
	protected function doCloneObject(ilObjInteractiveVideo $new_obj, $a_target_id, $a_copy_id = null)
	{
		parent::doCloneObject($new_obj, $a_target_id, $a_copy_id);

		$this->cloneMetaData($new_obj);
	}

	/**
	 *
	 */
	protected function initType()
	{
		$this->setType('xvid');
	}

	/**
	 * delete
	 * @param array $comment_ids
	 * @return bool
	 */
	public function deleteComments($comment_ids)
	{
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_comments WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}

	public function getCommentsTableData()
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_comments 
			WHERE obj_id = %s
			ORDER BY comment_time ASC',
			array('integer'), array($this->getId()));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']     = $row['comment_id'];
			$table_data[$counter]['comment_time']   = $row['comment_time'];
			$table_data[$counter]['user_id']        = $row['user_id'];
			$table_data[$counter]['comment_text']   = $row['comment_text'];
			$table_data[$counter]['is_tutor']       = $row['is_tutor'];
			$table_data[$counter]['is_interactive'] = $row['is_interactive'];
			$counter++;
		}

		return $table_data;

	}

	public function getCommentDataById($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		return $row;

	}

	/**
	 * @param int $comment_id
	 */
	public function getCommentTextById($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT comment_text FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		return (string)$row['comment_text'];
	}

	################## SETTER & GETTER ##################

	/**
	 * @return int
	 */
	public function getMobId()
	{
		return $this->mob_id;
	}

	/**
	 * @param int $mob_id
	 */
	public function setMobId($mob_id)
	{
		$this->mob_id = $mob_id;
	}
}