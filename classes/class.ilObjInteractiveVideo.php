<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPlugin.php';

/**
 * Class ilObjInteractiveVideo
 * 
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideo extends ilObjectPlugin
{
	/**
	 * @var integer
	 */
	protected $mob_id;
	
	protected $is_tutor = 0;

	/**
	 * 
	 */
	public function __construct()
	{
		parent::__construct();
		
		$this->getMobIdByRefId($this->ref_id);
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

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_comments WHERE '. $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}		
	
	public function getCommentsTableData()
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_comments 
			WHERE ref_id = %s
			ORDER BY comment_time ASC',
			array('integer'), array($this->getRefId()));
			
		$counter = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']  	= $row['comment_id'];
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
	 * @param integer $mob_id 	obj_id of video
	 * @param integer $ref_id 	of xvid-object
	 */
	public function saveMobIdForRefId($mob_id, $ref_id)
	{
		global $ilDB;

		$ilDB->insert('rep_robj_xvid_objects',
			array('ref_id' => array('integer', $ref_id),
				  'mob_id' => array('integer', $mob_id)
			));
	}
	/**
	 * @param $ref_id
	 */
	public function getMobIdByRefId($ref_id)
	{
		global $ilDB;
		
		$res = $ilDB->queryF('SELECT mob_id FROM rep_robj_xvid_objects WHERE ref_id = %s',
			array('integer'), array($ref_id));
		
		$row = $ilDB->fetchAssoc($res);

		$this->setMobId($row['mob_id']);
		
		return $row['mob_id'];
		
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

	/**
	 * @return int
	 */
	public function isTutor()
	{
		return $this->is_tutor;
	}

	/**
	 * @param int $is_tutor
	 */
	public function setIsTutor($is_tutor)
	{
		$this->is_tutor = $is_tutor;
	}
	
	
}