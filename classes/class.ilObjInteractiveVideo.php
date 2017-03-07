<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Repository/classes/class.ilObjectPlugin.php';
require_once 'Services/Tracking/interfaces/interface.ilLPStatusPlugin.php';
require_once 'Services/Tracking/classes/class.ilLPStatus.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('../VideoSources/class.ilInteractiveVideoSourceFactory.php');

/**
 * Class ilObjInteractiveVideo
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideo extends ilObjectPlugin implements ilLPStatusPluginInterface
{
	const TABLE_NAME_OBJECTS = 'rep_robj_xvid_objects';
	const TABLE_NAME_COMMENTS = 'rep_robj_xvid_comments';
	const TABLE_NAME_QUESTIONS = 'rep_robj_xvid_question';
	const TABLE_NAME_LP = 'rep_robj_xvid_lp';
	
	/**
	 * @var int
	 */
	const LP_MODE_DEACTIVATED = 0;

	/**
	 * @var int
	 */
	const LP_MODE_BY_QUESTIONS = 99;

	/**
	 * @var int
	 */
	protected $learning_progress_mode = self::LP_MODE_DEACTIVATED;

	/**
	 * @var bool
	 */
	protected $is_online = false;

	/**
	 * @var int
	 */
	protected $is_anonymized = 0;
	/**
	 * @var int
	 */
	protected $is_repeat = 0;

	/**
	 * @var int
	 */
	protected $is_chronologic = 0;

	/**
	 * @var int
	 */
	protected $is_public = 0;

	/**
	 * @var string
	 */
	protected $source_id;

	/**
	 * @var ilInteractiveVideoSource
	 */
	protected $video_source_object;

	/**
	 * @var 
	 */
	protected $video_source_import_object;
	
	/**
	 * @var int
	 */
	protected $task_active = 0;

	/**
	 * @var string
	 */
	protected $task;


	/**
	 * @var SimpleChoiceQuestion[]
	 */
	public $import_simple_choice = array();

	/**
	 * @var ilObjComment[]
	 */
	public $import_comment = array();


	/**
	 * @param $src_id
	 * @return ilInteractiveVideoSource
	 */
	public function getVideoSourceObject($src_id)
	{
		$factory = new ilInteractiveVideoSourceFactory();
		if($this->video_source_object === null)
		{
			$this->video_source_object = $factory->getVideoSourceObject($src_id);
		}
		else
		{
			if($this->video_source_object->getId() !== $src_id)
			{
				$this->video_source_object = $factory->getVideoSourceObject($src_id);
			}
		}

		return $this->video_source_object;
	}

	protected function doRead()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);
		
		$this->setIsAnonymized($row['is_anonymized']);
		$this->setIsRepeat($row['is_repeat']);
		$this->setIsPublic($row['is_public']);
		$this->setOnline((bool)$row['is_online']);
		$this->setIsChronologic($row['is_chronologic']);
		$this->setSourceId($row['source_id']);
		$this->setTaskActive($row['is_task']);
		$this->setTask($row['task']);

		$this->getVideoSourceObject($row['source_id']);
		$this->setLearningProgressMode($row['lp_mode']);

		parent::doRead();
	}

	/**
	 * @return string
	 */
	protected function getOldVideoSource()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT source_id FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);

		return $row['source_id'];
	}

	protected function doCreate()
	{
		/**
		 * @var $ilLog ilLog
		 */
		global $ilLog;
		
		$post_src_id = ilUtil::stripSlashes($_POST['source_id']);
		$from_post = false;
		if(($post_src_id == null || $post_src_id == '') && $this->source_id != null)
		{
			$src_id = $this->source_id;
		}
		else
		{
			$src_id = $post_src_id;
			$from_post = true;
		}
		
		if($src_id != '')
		{

			try
			{
				$this->getVideoSourceObject($src_id);
				$this->video_source_object->doCreateVideoSource($this->getId());
				global $ilDB;

				$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
					array('integer'), array($this->getId()));

				if(!$from_post)
				{
					$anonymized		= $this->is_anonymized;
					$repeat			= $this->is_repeat;
					$chronologic	= $this->is_chronologic;
					$online			= $this->is_online;
					$source_id		= $this->source_id;
					$is_task		= $this->task_active;
					$task			= $this->task;
				}
				else
				{
					$anonymized		= (int)$_POST['is_anonymized'];
					$repeat			= (int)$_POST['is_repeat'];
					$chronologic	= (int)$_POST['is_chronologic'];
					$online			= (int)$_POST['is_online'];
					$source_id		= ilUtil::stripSlashes($_POST['source_id']);
					$is_task		= (int)$_POST['is_task'];
					$task			= ilUtil::stripSlashes($_POST['task']);
				}
				
				$ilDB->insert(
					self::TABLE_NAME_OBJECTS,
					array(
						'obj_id'         => array('integer', $this->getId()),
						'is_anonymized'  => array('integer', $anonymized),
						'is_repeat'      => array('integer', $repeat),
						'is_chronologic' => array('integer', $chronologic),
						'is_public'      => array('integer', 1),
						'is_online'      => array('integer', $online),
						'source_id'      => array('text', $source_id),
						'is_task'        => array('integer',$is_task ),
						'task'           => array('text', $task)
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
		else
		{
			$this->delete();
			throw new ilException(ilInteractiveVideoPlugin::getInstance()->txt('at_least_one_source'));
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
		
		$old_source_id = $this->getOldVideoSource();
		if($old_source_id != null && $old_source_id != $this->getSourceId())
		{
			$this->getVideoSourceObject($old_source_id);
			$this->video_source_object->doDeleteVideoSource($this->getId());
		}

		$ilDB->update(self::TABLE_NAME_OBJECTS ,
			array(	'is_anonymized'		=>array('integer',	$this->isAnonymized()),
					'is_repeat'			=>array('integer',	$this->isRepeat()),
					'is_public'			=>array('integer',	$this->isPublic()),
					'is_chronologic'	=>array('integer',	$this->isChronologic()),
					'is_online'			=>array('integer',	$this->isOnline()),
					'source_id'			=>array('text',		$this->getSourceId()),
					'is_task'			=> array('integer', $this->getTaskActive()),
					'task'				=> array('text', $this->getTask()),
					'lp_mode'			=> array('integer', $this->getLearningProgressMode())
					),
			array('obj_id' => array('integer', $this->getId())));
	}

	/**
	 *
	 */
	public function beforeDelete()
	{
		$this->getVideoSourceObject($this->getSourceId());
		$this->video_source_object->beforeDeleteVideoSource($this->getId());
		self::deleteComments(self::getCommentIdsByObjId($this->getId(), false));

		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;
		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = ' . $ilDB->quote($this->getId(), 'integer'));
		$this->deleteMetaData();
	}

	/**
	 *
	 */
	protected function doDelete()
	{
		parent::doDelete();
	}

	/**
	 * @param ilObjInteractiveVideo $new_obj
	 * @param integer $a_target_id
	 * @param integer $a_copy_id
	 */
	protected function doCloneObject($new_obj, $a_target_id, $a_copy_id = null)
	{
		parent::doCloneObject($new_obj, $a_target_id, $a_copy_id);

		$this->cloneMetaData($new_obj);

		global $ilDB;

		$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'), array($new_obj->getId()));

		$ilDB->insert(
			self::TABLE_NAME_OBJECTS ,
			array(
				'obj_id'        => array('integer', $new_obj->getId()),
				'is_anonymized' => array('integer', $this->isAnonymized()),
				'is_repeat' => array('integer', $this->isRepeat()),
				'is_chronologic' => array('integer', $this->isChronologic()),
				'is_public'     => array('integer', $this->isPublic()),
				'source_id'     => array('text', $this->getSourceId()),
				'is_task'     => array('integer', $this->getTaskActive()),
				'task'     => array('text', $this->getTask()),
				'lp_mode' => array('integer', $this->getLearningProgressMode())
			)
		);

		$comment = new ilObjComment();
		$comment->cloneTutorComments($this->getId(), $new_obj->getId());
	}

	/**
	 * @return bool
	 * @throws ilException
	 */
	protected function beforeCreate()
	{
		return true;
	}

	/**
	 * @return bool
	 */
	protected function beforeCloneObject()
	{
		return true;
	}

	/**
	 *
	 */
	protected function initType()
	{
		$this->setType('xvid');
	}



	/**
	 * @param $comment_ids
	 * @return array | bool
	 */
	public static function getQuestionIdsByCommentIds($comment_ids)
	{
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$question_ids = array();

		$res = $ilDB->query('SELECT question_id FROM ' . self::TABLE_NAME_QUESTIONS. ' WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}
		return $question_ids;
	}

	/**
	 * @return array
	 */
	public function getCommentsTableData()
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' 
			WHERE obj_id = %s
			AND is_private = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer'), array($this->getId(),0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']			= $row['comment_id'];
			$table_data[$counter]['comment_time']		= $row['comment_time'];
			$table_data[$counter]['comment_time_end']	= $row['comment_time_end'];
			$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['title']				= $row['comment_title'];
			$table_data[$counter]['comment_text']		= $row['comment_text'];
			$table_data[$counter]['is_tutor']			= $row['is_tutor'];
			$table_data[$counter]['is_interactive']		= $row['is_interactive'];
			$counter++;
		}

		return $table_data;

	}

	/**
	 * @return array
	 */
	public function getCommentsTableDataByUserId()
	{
		global $ilDB, $ilUser;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' 
			WHERE obj_id = %s
			AND user_id = %s
			AND is_interactive = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer', 'integer'),
			array($this->getId(), $ilUser->getId(), 0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']			= $row['comment_id'];
			$table_data[$counter]['comment_time']		= $row['comment_time'];
			$table_data[$counter]['comment_time_end']	= $row['comment_time_end'];
			$table_data[$counter]['comment_title']		= $row['comment_title'];
			//	$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['comment_text']		= $row['comment_text'];
			$table_data[$counter]['is_private']			= $row['is_private'];
//			$table_data[$counter]['is_tutor']       = $row['is_tutor'];
//			$table_data[$counter]['is_interactive'] = $row['is_interactive'];
			$counter++;
		}

		return $table_data;
	}

	/**
	 * @param $comment_id
	 * @return mixed
	 */
	public function getCommentDataById($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		return $row;

	}

	/**
	 * @param $comment_id
	 * @return mixed
	 */
	public function getQuestionDataById($comment_id)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;

		$res = 	$ilDB->queryF('SELECT * FROM  ' . self::TABLE_NAME_QUESTIONS. ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		$data['question_data'] = $row;

		return $data;
	}

	/**
	 * @param $comment_id
	 * @return string
	 */
	public function getCommentTextById($comment_id)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF('SELECT comment_text FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		return (string)$row['comment_text'];
	}

	/**
	 * @param      $obj_id
	 * @param bool $with_user_id
	 * @return array
	 */
	public function getCommentIdsByObjId($obj_id, $with_user_id = true)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;

		$comment_ids = array();
		$res = $ilDB->queryF('SELECT comment_id, user_id FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE obj_id = %s',
			array('integer'), array($obj_id));

		while($row = $ilDB->fetchAssoc($res))
		{
			if($with_user_id == true)
			{
				$comment_ids[$row['comment_id']] = $row['user_id'];
			}
			else
			{
				$comment_ids[] = $row['comment_id'];
			}
		}
		return $comment_ids;
	}

	/**
	 * delete
	 * @param array $comment_ids
	 * @return bool
	 */
	public function deleteComments($comment_ids)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$question_ids = self::getQuestionIdsByCommentIds($comment_ids);
		SimpleChoiceQuestion::deleteQuestions($question_ids);

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 */
	public function saveVideoStarted($obj_id, $usr_id)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;
		if(!$this->doesLearningProgressEntryExists($obj_id, $usr_id))
		{
			$ilDB->insert(
				self::TABLE_NAME_LP ,
				array(
					'obj_id'        => array('integer', $obj_id),
					'usr_id'        => array('integer', $usr_id),
					'started'       => array('integer', 1),
				)
			);
		}
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 */
	public function saveVideoFinished($obj_id, $usr_id)
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;
		if(!$this->doesLearningProgressEntryExists($obj_id, $usr_id))
		{
			$ilDB->insert(
				self::TABLE_NAME_LP ,
				array(
					'obj_id'        => array('integer', $obj_id),
					'usr_id'        => array('integer', $usr_id),
					'started'       => array('integer', 0),
					'ended'         => array('integer', 1),
				)
			);
		}
		else
		{
			$ilDB->update(self::TABLE_NAME_LP ,
				array(
					  'started'       => array('integer', 1),
					  'ended'         => array('integer', 1),

				),
				array('obj_id' => array('integer', $obj_id),
					  'usr_id' => array('integer', $usr_id)));
		}
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 * @return bool
	 */
	public function doesLearningProgressEntryExists($obj_id, $usr_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND usr_id = %s',
			array('integer', 'integer'), array($obj_id, $usr_id));

		$row = $ilDB->fetchAssoc($res);
		if($row == null)
		{
			return false;
		}
		return true;
	}

	/**
	 * @param $obj_id
	 * @return array()
	 */
	public function getAllStartedAndFinishedUsers($obj_id)
	{
		global $ilDB;

		$usr_ids = array();
		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND started = 1 AND ended = 1',
			array('integer'), array($obj_id));

		while($row = $ilDB->fetchAssoc($res))
		{
			$usr_ids[] = $row['usr_id'];
		}
		return $usr_ids;
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 * @return bool
	 */
	public function isLearningProgressCompletedForUser($obj_id, $usr_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND usr_id = %s AND started = 1 AND ended = 1',
			array('integer', 'integer'), array($obj_id, $usr_id));

		$row = $ilDB->fetchAssoc($res);
		if($row == null)
		{
			return false;
		}
		return true;
	}

	################## SETTER & GETTER ##################

	/**
	 * @return int
	 */
	public function isAnonymized()
	{
		return $this->is_anonymized;
	}

	/**
	 * @param int $is_anonymized
	 */
	public function setIsAnonymized($is_anonymized)
	{
		$this->is_anonymized = $is_anonymized;
	}

	/**
	 * @return int
	 */
	public function isRepeat()
	{
		return $this->is_repeat;
	}

	/**
	 * @param int $is_repeat
	 */
	public function setIsRepeat($is_repeat)
	{
		$this->is_repeat = $is_repeat;
	}

	/**
	 * @return int
	 */
	public function isChronologic()
	{
		return $this->is_chronologic;
	}

	/**
	 * @param int $is_chronologic
	 */
	public function setIsChronologic($is_chronologic)
	{
		$this->is_chronologic = $is_chronologic;
	}

	/**
	 * @return int
	 */
	public function isPublic()
	{
		return $this->is_public;
	}

	/**
	 * @param int $is_public
	 */
	public function setIsPublic($is_public)
	{
		$this->is_public = $is_public;
	}

	/**
	 * @return string
	 */
	public function getSourceId()
	{
		return $this->source_id;
	}

	/**
	 * @param string $source_id
	 */
	public function setSourceId($source_id)
	{
		$this->source_id = $source_id;
	}
	/**
	 * @param $status
	 */
	public function setOnline($status)
	{
		$this->is_online = (bool)$status;
	}

	/**
	 * @return bool
	 */
	public function isOnline()
	{
		return (bool)$this->is_online;
	}

	/**
	 * @return int
	 */
	public function getTaskActive()
	{
		return $this->task_active;
	}

	/**
	 * @param int $task_active
	 */
	public function setTaskActive($task_active)
	{
		$this->task_active = $task_active;
	}

	/**
	 * @return string
	 */
	public function getTask()
	{
		return $this->task;
	}

	/**
	 * @param string $task
	 */
	public function setTask($task)
	{
		$this->task = $task;
	}

	/**
	 * @return mixed
	 */
	public function getVideoSourceImportObject()
	{
		return $this->video_source_import_object;
	}

	/**
	 * @param mixed $video_source_import_object
	 */
	public function setVideoSourceImportObject($video_source_import_object)
	{
		$this->video_source_import_object = $video_source_import_object;
	}

	/**
	 * Get all user ids with LP status completed
	 * @return array
	 */
	public function getLPCompleted()
	{
		if(in_array($this->getLearningProgressMode(), array(self::LP_MODE_DEACTIVATED)))
		{
			return array();
		}

		$user_ids = array();

		$simple = new SimpleChoiceQuestion();
		$qst = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());
		if(is_array($qst) && count($qst) > 0)
		{
			$simple = new SimpleChoiceQuestion();
			$qst = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());
			if(is_array($qst) && count($qst) > 0)
			{
				$usrs_points = $simple->getAllUsersWithCompletelyCorrectAnswers($this->getId());
				foreach($usrs_points as $usr_id => $points)
				{
					if($points == count($qst))
					{
						$user_ids[$usr_id] = $usr_id;
					}
				}
			}
		}
		else
		{
			$user_ids = $this->getAllStartedAndFinishedUsers($this->getId());
		}

		return array_values($user_ids);
	}

	/**
	 * Get all user ids with LP status not attempted
	 * @return array
	 */
	public function getLPNotAttempted()
	{
		return array();
	}

	/**
	 * Get all user ids with LP status failed
	 * @return array
	 */
	public function getLPFailed()
	{
		if(in_array($this->getLearningProgressMode(), array(self::LP_MODE_DEACTIVATED)))
		{
			return array();
		}

		$user_ids = array();

		// NOT IMPLEMENTED

		return $user_ids;
	}

	/**
	 * Get all user ids with LP status in progress
	 * @return array
	 */
	public function getLPInProgress()
	{
		if(in_array($this->getLearningProgressMode(), array(self::LP_MODE_DEACTIVATED)))
		{
			return array();
		}

		$user_ids = array();

		$users = array_diff((array)$user_ids, $this->getLPCompleted());
		$users = array_diff((array)$users, $this->getLPFailed());
		return $users ? $users : array();
	}

	/**
	 * Get current status for given user
	 * @param int $a_user_id
	 * @return int
	 */
	public function getLPStatusForUser($a_user_id)
	{
		$status = ilLPStatus::LP_STATUS_NOT_ATTEMPTED_NUM;

		require_once 'Services/Tracking/classes/class.ilChangeEvent.php';
		if (ilChangeEvent::hasAccessed($this->getId(), $a_user_id))
		{
			$status = ilLPStatus::LP_STATUS_IN_PROGRESS_NUM;
		}

		$simple = new SimpleChoiceQuestion();
		$qst = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());
		if(is_array($qst) && count($qst) > 0)
		{
			$usr_points = $simple->getAllUsersWithCompletelyCorrectAnswers($this->getId(), $a_user_id);
			if($usr_points == count($qst))
			{
				$status = ilLPStatus::LP_STATUS_COMPLETED_NUM;
			}
			else
			{
				$status = ilLPStatus::LP_STATUS_IN_PROGRESS_NUM;
			}
		}
		else
		{
			if($this->isLearningProgressCompletedForUser($this->getId(), $a_user_id))
			{
				$status = ilLPStatus::LP_STATUS_COMPLETED_NUM;
			}
		}

		return $status;
	}

	/**
	 * @param int $learning_progress_mode
	 */
	public function setLearningProgressMode($learning_progress_mode)
	{
		$this->learning_progress_mode = $learning_progress_mode;
	}

	/**
	 * @return int
	 */
	public function getLearningProgressMode()
	{
		return $this->learning_progress_mode;
	}

	/**
	 * @return array
	 */
	public function getLPValidModes()
	{
		return array(
			self::LP_MODE_DEACTIVATED,
			self::LP_MODE_BY_QUESTIONS
		);
	}

	/**
	 * @param $lp_mode
	 * @return bool
	 */
	public function isCoreLPMode($lp_mode)
	{
		return in_array($lp_mode, array_keys(ilLPObjSettings::getClassMap()));
	}

	/**
	 * @param $lp_mode
	 * @return string
	 * @throws ilException
	 */
	public function getInternalLabelForLPMode($lp_mode)
	{
		switch($lp_mode)
		{
			case self::LP_MODE_BY_QUESTIONS:
				return 'by_questions';
				break;
		}

		throw new ilException(sprintf('The LP mode "%s" is unknown!', $lp_mode));
	}

	/**
	 * @return int
	 */
	public function getDefaultMode()
	{
		return self::LP_MODE_DEACTIVATED;
	}

	public function updateLP()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		require_once "./Services/Tracking/classes/status/class.ilLPStatusEvent.php";
		require_once "./Services/Tracking/classes/class.ilLPStatusWrapper.php";
		require_once "./Services/Tracking/classes/class.ilLearningProgress.php";

		ilLPStatusWrapper::_updateStatus(
			$this->getId(),
			$ilUser->getId()
		);
	}

	public function trackProgress()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		require_once "./Services/Tracking/classes/class.ilChangeEvent.php";
		require_once "./Services/Tracking/classes/status/class.ilLPStatusEvent.php";
		require_once "./Services/Tracking/classes/class.ilLPStatusWrapper.php";
		require_once "./Services/Tracking/classes/class.ilLearningProgress.php";

		ilLearningProgress::_tracProgress(
			$ilUser->getId(),
			$this->getId(),
			$this->getRefId(),
			$this->getType()
		);
	}


	public function uploadImage($comment_id, $question, array $a_upload)
	{
		if(!$this->id)
		{
			return false;
		}

		$file_extension = pathinfo($a_upload['name'], PATHINFO_EXTENSION);
		$clean_name = $comment_id .'.' . $file_extension;

		$part = 'xvid_' . $this->getId() . '/' . $comment_id . '/images/';
		$path = xvidUtils::ensureFileSavePathExists($part);
		$original = "org_".$this->id."_".$clean_name;

		if(@move_uploaded_file($a_upload["tmp_name"], $path.$original))
		{
			chmod($path.$original, 0770);
			$question->setQuestionImage($path.$original);

			return true;
		}
		return false;
	}

}
