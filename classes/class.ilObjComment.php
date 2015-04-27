<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class ilObjComment
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjComment
{
	/**
	 * @var integer
	 */
	protected $obj_id;

	/**
	 * @var integer
	 */
	protected $comment_id;

	/**
	 * @var integer
	 */
	protected $user_id;

	/**
	 * @var bool
	 */
	protected $is_tutor = false;

	/**
	 * @var float $comment_time in seconds
	 */
	protected $comment_time = 0;

	/**
	 * @var string
	 */
	protected $comment_text = '';

	/**
	 * @var bool
	 */
	protected $is_interactive = false;

	/**
	 * @var string
	 */
	protected $comment_title = '';

	/**
	 * @var int
	 */
	protected $repeat_question = 0;

	/**
	 * @var string
	 */
	protected $comment_tags = '';

	/**
	 * @var array
	 */
	protected $comments = array();
	
	protected $is_public = 0;
	protected $is_anonymized = 0;

	protected static $user_name_cache = array();
	
	/**
	 * @param int $comment_id
	 */
	public function __construct($comment_id = 0)
	{
		if($comment_id > 0)
		{
			$this->setCommentId($comment_id);
			$this->read();
		}
	}

	public function read()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'),
			array($this->getCommentId())
		);
		$row = $ilDB->fetchAssoc($res);

		$this->setCommentText($row['comment_text']);
		$this->setCommentTime($row['comment_time']);
		$this->setInteractive((bool)$row['is_interactive']);
		$this->setIsTutor((bool)$row['is_tutor']);
		$this->setUserId($row['user_id']);
		$this->setCommentTitle($row['comment_title']);
		$this->setRepeatQuestion($row['repeat_question']);
		$this->setCommentTags($row['comment_tags']);
	}

	public function create()
	{
		/**
		 * @var $ilDB   ilDB
		 * @var $ilUser ilObjUser
		 */
		global $ilDB, $ilUser;

		$next_id = $ilDB->nextId('rep_robj_xvid_comments');
		$ilDB->insert('rep_robj_xvid_comments',
			array(
				'comment_id'     => array('integer', $next_id),
				'obj_id'         => array('integer', $this->getObjId()),
				'user_id'        => array('integer', $ilUser->getId()),
				'is_tutor'       => array('integer', (int)$this->isTutor()),
				'is_interactive' => array('integer', (int)$this->isInteractive()),
				// @todo: Change rounding and database type in case we should store milli seconds
				'comment_time'   => array('integer', round($this->getCommentTime(), 0)),
				'comment_text'   => array('text', $this->getCommentText()),
				'comment_title'	=> array('text', $this->getCommentTitle()),
				'repeat_question' => array('integer', $this->getRepeatQuestion()),
				'comment_tags'	=> array('text', $this->getCommentTags())
			));
		if((int) $this->isInteractive())
		{
			$question = new SimpleChoiceQuestion();
			if($question->checkInput())
			{
				$question->deleteQuestion($next_id);
				$_POST['comment_id'] = $next_id;
				$question->create();
			}
		}
	}

	public function update()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$ilDB->update('rep_robj_xvid_comments',
			array(
				'is_interactive' => array('integer', (int)$this->isInteractive()),
				// @todo: Change rounding and database type in case we should store milli seconds
				'comment_time'   => array('integer', round($this->getCommentTime(), 2)),
				'comment_text'   => array('text', $this->getCommentText()),
				'comment_title'	=> array('text', $this->getCommentTitle()),
				'repeat_question' => array('integer', $this->getRepeatQuestion()),
				'comment_tags'	=> array('text', $this->getCommentTags())
			),
			array(
				'comment_id' => array('integer', $this->getCommentId())
			)
		);
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
			array('integer'), array($this->getObjId()));

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

	/**
	 * @return array
	 */
	public function getStopPoints()
	{
		/**
		 * @vas $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT comment_time
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s
			ORDER BY comment_time ASC',
			array('integer'),
			array($this->getObjId())
		);

		$stop_points = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$stop_points[] = $row['comment_time'];
		}

		return $stop_points;
	}

	public function getContentComments()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$query_types = array('integer');
		$query_data = array($this->getObjId());
		
		$where_condition = '';
	
		if(!$this->isPublic())
		{
			global $ilUser;
			$where_condition = ' AND user_id = %s OR is_tutor = %s OR is_interactive = %s ';
			$query_types = array_merge($query_types, array('integer', 'integer', 'integer'));
			$query_data = array_merge($query_data, array($ilUser->getId(), 1, 1));
		}
		
		$res = $ilDB->queryF(
			'SELECT comment_id, user_id, comment_text, comment_time, is_interactive, comment_title, comment_tags
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s'.
			$where_condition.'
			ORDER BY comment_time, comment_id ASC',
			$query_types,
			$query_data
		);

		$comments = array();
		$i = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$comments[$i]['comment_id'] = $row['comment_id'];
			$comments[$i]['user_name'] = '';
			if(!$this->isAnonymized())
			{
				$comments[$i]['user_name'] = self::lookupUsername($row['user_id']);
			}
			$comments[$i]['comment_title'] = $row['comment_title'];
			$comments[$i]['comment_text'] = $row['comment_text'];
			$comments[$i]['comment_time'] = $row['comment_time'];
			$comments[$i]['comment_tags'] = $row['comment_tags'];
			$comments[$i]['is_interactive'] = $row['is_interactive'];

			$i++;
		}

		return $comments;
	}

	public function getAllComments()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT comment_id, user_id, comment_text, comment_time, is_interactive
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s
			ORDER BY comment_time, comment_id ASC',
			array('integer'),
			array($this->getObjId())
		);

		$comments = array();
		$i = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$comments[$i]['comment_id'] = $row['comment_id'];
			$comments[$i]['user_name'] = self::lookupUsername($row['user_id']);
			$comments[$i]['comment_text'] = $row['comment_text'];
			$comments[$i]['comment_time'] = $row['comment_time'];
			$comments[$i]['is_interactive'] = $row['is_interactive'];
			
			$i++;
		}

		return $comments;
	}

	/**
	 * @param $user_id
	 * @return mixed
	 */
	public static function lookupUsername($user_id)
	{
		if(!array_key_exists($user_id, self::$user_name_cache))
		{
			self::$user_name_cache[$user_id] = ilObjUser::_lookupLogin($user_id);
		}

		return self::$user_name_cache[$user_id];
	}
	
	################## SETTER & GETTER ##################
	/**
	 * @return int
	 */
	public function getObjId()
	{
		return $this->obj_id;
	}

	/**
	 * @param int $obj_id
	 */
	public function setObjId($obj_id)
	{
		$this->obj_id = $obj_id;
	}

	/**
	 * @return int
	 */
	public function getCommentId()
	{
		return $this->comment_id;
	}

	/**
	 * @param int $comment_id
	 */
	public function setCommentId($comment_id)
	{
		$this->comment_id = $comment_id;
	}

	/**
	 * @return boolean
	 */
	public function isInteractive()
	{
		return $this->is_interactive;
	}

	/**
	 * @param boolean $is_interactive
	 */
	public function setInteractive($is_interactive)
	{
		$this->is_interactive = $is_interactive;
	}

	/**
	 * @return string
	 */
	public function getCommentText()
	{
		return $this->comment_text;
	}

	/**
	 * @param string $comment_text
	 */
	public function setCommentText($comment_text)
	{
		$this->comment_text = $comment_text;
	}

	/**
	 * @return float
	 */
	public function getCommentTime()
	{
		return $this->comment_time;
	}

	/**
	 * @param float $comment_time
	 */
	public function setCommentTime($comment_time)
	{
		$this->comment_time = $comment_time;
	}

	/**
	 * @return boolean
	 */
	public function isTutor()
	{
		return $this->is_tutor;
	}

	/**
	 * @param boolean $is_tutor
	 */
	public function setIsTutor($is_tutor)
	{
		$this->is_tutor = $is_tutor;
	}

	/**
	 * @return int
	 */
	public function getUserId()
	{
		return $this->user_id;
	}

	/**
	 * @param int $user_id
	 */
	public function setUserId($user_id)
	{
		$this->user_id = $user_id;
	}

	/**
	 * @return string
	 */
	public function getCommentTags()
	{
		return $this->comment_tags;
	}

	/**
	 * @param string $comment_tags
	 */
	public function setCommentTags($comment_tags)
	{
		$this->comment_tags = $comment_tags;
	}

	/**
	 * @return int
	 */
	public function getRepeatQuestion()
	{
		return $this->repeat_question;
	}

	/**
	 * @param int $repeat_question
	 */
	public function setRepeatQuestion($repeat_question)
	{
		$this->repeat_question = $repeat_question;
	}

	/**
	 * @return string
	 */
	public function getCommentTitle()
	{
		return $this->comment_title;
	}

	/**
	 * @param string $comment_title
	 */
	public function setCommentTitle($comment_title)
	{
		$this->comment_title = $comment_title;
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
}