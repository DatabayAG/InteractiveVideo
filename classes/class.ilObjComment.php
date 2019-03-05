<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/User/classes/class.ilUserUtil.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilHtmlInteractiveVideoPostPurifier.php';

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
	 * @var float $comment_time in seconds
	 */
	protected $comment_time_end = 0;

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
	 * @var string
	 */
	protected $comment_tags = '';

	/**
	 * @var array
	 */
	protected $comments = array();

	/**
	 * @var int
	 */
	protected $is_private = 0;

	/**
	 * @var int
	 */
	protected $is_public = 0;

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
	protected $is_reply_to = 0;

	/**
	 * @var string
	 */
	protected $marker;

	/**
	 * @var array
	 */
	protected static $user_name_cache = array();

	/**
	 * @var array
	 */
	protected static $user_image_cache = array();

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
		$this->setCommentTimeEnd($row['comment_time_end']);
		$this->setInteractive((bool)$row['is_interactive']);
		$this->setIsTutor((bool)$row['is_tutor']);
		$this->setUserId($row['user_id']);
		$this->setCommentTitle($row['comment_title']);
		$this->setCommentTags($row['comment_tags']);
		$this->setIsPrivate($row['is_private']);
		$this->setIsReplyTo($row['is_reply_to']);
		$this->setMarker($row['marker']);
	}

	/**
	 * @param bool $return_next_id
	 * @return null | int
	 */
	public function create($return_next_id = false, $reply_to_posting = false)
	{
		/**
		 * @var $ilDB   ilDB
		 * @var $ilUser ilObjUser
		 */
		global $ilDB, $ilUser;

		$purify = new ilHtmlInteractiveVideoPostPurifier();
		$text = $purify->purify($this->getCommentText());

		if($this->getIsReplyTo() != 0 && !$reply_to_posting)
		{
			$this->removeOldReplyTo($this->getIsReplyTo());
		}
		$next_id = $ilDB->nextId('rep_robj_xvid_comments');
		$this->setCommentId($next_id);
		$ilDB->insert('rep_robj_xvid_comments',
			array(
				'comment_id'     	=> array('integer', $next_id),
				'obj_id'         	=> array('integer', $this->getObjId()),
				'user_id'        	=> array('integer', $ilUser->getId()),
				'is_tutor'       	=> array('integer', (int)$this->isTutor()),
				'is_interactive' 	=> array('integer', (int)$this->isInteractive()),
				'comment_time'   	=> array('integer', round($this->getCommentTime(), 0)),
				'comment_time_end'  => array('integer', round($this->getCommentTimeEnd(), 0)),
				'comment_text'   	=> array('text',  $text),
				'comment_title'		=> array('text', $this->getCommentTitle()),
				'comment_tags'		=> array('text', $this->getCommentTags()),
				'is_private'		=> array('integer', $this->getIsPrivate()),
				'is_reply_to'		=> array('integer', $this->getIsReplyTo()),
				'marker'			=> array('text', $this->getMarker())
			));
		if($return_next_id)
		{
			return $next_id;
		}
	}

	/**
	 * delete
	 * @param int $reply_to
	 */
	public function removeOldReplyTo($reply_to)
	{
		/**
		 * @var $ilUser ilObjUser
		 * @var $ilDB ilDB
		 */
		global $ilDB, $ilUser;

		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_comments WHERE is_reply_to = %s AND user_id = %s',
			array('integer', 'integer'), array($reply_to, $ilUser->getId()));
	}

	public function update()
	{
		/**
		 * @var $ilDB ilDB
		 * @var $ilUser ilObjUser
		 */
		global $ilDB, $ilUser;

		$purify = new ilHtmlInteractiveVideoPostPurifier();
		$text = $purify->purify($this->getCommentText());

		$ilDB->update('rep_robj_xvid_comments',
			array(
				'is_interactive' 	=> array('integer', (int)$this->isInteractive()),
				'user_id'        	=> array('integer', $ilUser->getId()),
				'comment_time'   	=> array('integer', round($this->getCommentTime(), 0)),
				'comment_time_end'  => array('integer', round($this->getCommentTimeEnd(), 2)),
				'comment_text'   	=> array('text', $text),
				'comment_title'		=> array('text', $this->getCommentTitle()),
				'comment_tags'		=> array('text', $this->getCommentTags()),
				'is_private'		=> array('integer', $this->getIsPrivate()),
				'is_reply_to'		=> array('integer', $this->getIsReplyTo()),
				'marker'			=> array('text', $this->getMarker())
			),
			array(
				'comment_id' => array('integer', $this->getCommentId())
			)
		);
	}

	/**
	 * @param $comment_ids
	 * @return bool
	 */
	public function deleteComments($comment_ids)
	{
		/**
		 * @var ilDb $ilDB
		 */
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_comments WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}


	/**
	 * @return array
	 */
	public function getStopPoints()
	{
		/**
		 * @var $ilDB ilDB
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

	/**
	 * @return array
	 */
	public function getContentComments()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB, $ilUser;

		$query_types = array('integer','integer','integer','integer');
		$query_data = array($this->getObjId(), 0, 1, $ilUser->getId());

		$where_condition = '';

		if(!$this->isPublic())
		{
			$where_condition = ' AND (user_id = %s OR is_tutor = %s OR is_interactive = %s )';
			$query_types = array_merge($query_types, array('integer', 'integer', 'integer'));
			$query_data = array_merge($query_data, array($ilUser->getId(), 1, 1));
		}

		$res = $ilDB->queryF(
			'SELECT *
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s 
			AND ( is_private = %s OR (is_private = %s AND user_id = %s))'.
			$where_condition.'
			ORDER BY comment_time, comment_id ASC',
			$query_types,
			$query_data
		);

		$comments = array();
		$is_reply_to = array();
		$i = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$temp = array();
			$temp['comment_id'] = $row['comment_id'];
			$temp['user_name'] = '';
			if(!$this->isAnonymized())
			{
				$temp['user_name']	= self::lookupUsername($row['user_id']);
				self::getUserImageInBase64($row['user_id']);
				$temp['user_id']	= $row['user_id'];
			}
			$temp['comment_title'] 		= $row['comment_title'];
			if($row['is_interactive'] == 1)
			{
				$temp['comment_text'] = '';
			}
			else
			{
				$temp['comment_text'] 		= $row['comment_text'];
			}

			$temp['comment_time'] 		= $row['comment_time'];
			$temp['comment_time_end'] 	= $row['comment_time_end'];
			$temp['comment_tags'] 		= $row['comment_tags'];
			$temp['is_interactive'] 	= $row['is_interactive'];
			$temp['is_private'] 		= $row['is_private'];
			$temp['is_reply_to'] 		= $row['is_reply_to'];
			$temp['marker'] 			= $row['marker'];
			$temp['replies']			= array();

			$temp['is_overlay'] = "1";

			if($row['is_reply_to'] != 0)
			{
				$is_reply_to[] = $temp;
			}
			else
			{
				$comments[$i] = $temp;
				$i++;
			}
		}

		if(sizeof($is_reply_to) > 0)
		{
			$comments = $this->sortInReplies($is_reply_to, $comments);
		}

		return $comments;
	}

	/**
	 * @param $is_reply_to
	 * @param $comments
	 * @return array
	 */
	protected function sortInReplies($is_reply_to, $comments)
	{
		foreach($is_reply_to as $value)
		{
			foreach($comments as $key => $comment)
			{
				if($value['is_reply_to'] == $comment['comment_id'])
				{
					$comments[$key]['replies'][] = $value;
				}
			}
		}
		return $comments;
	}
	/**
	 * @param int $old_id
	 * @param int $new_id
	 */
	public function cloneTutorComments($old_id, $new_id)
	{
		$old_id = (int) $old_id;
		$new_id = (int) $new_id;

		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;

		$questions_array = array();
		$res = $ilDB->queryF(
			'SELECT *
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s
			AND is_tutor = 1
			ORDER BY comment_time, comment_id ASC',
			array('integer'),
			array($old_id)
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$this->setObjId($new_id);
			$this->setCommentText($row['comment_text']);
			$this->setCommentTime($row['comment_time']);
			$this->setCommentTimeEnd($row['comment_time_end']);
			$this->setInteractive((bool)$row['is_interactive']);
			$this->setIsTutor((bool)$row['is_tutor']);
			$this->setUserId($row['user_id']);
			$this->setCommentTitle($row['comment_title']);
			$this->setCommentTags($row['comment_tags']);
			$this->setIsPrivate($row['is_private']);
			$this->setIsReplyTo($row['is_reply_to']);
			$this->setMarker($row['marker']);
			$new_comment_id = $this->create(true);
			if((bool)$row['is_interactive'])
			{
				$questions_array[$row['comment_id']] = $new_comment_id;
			}
		}
		$simple = new SimpleChoiceQuestion();
		foreach($questions_array as $key => $value)
		{
			$simple->cloneQuestionObject($key, $value);
		}
	}

	/**
	 * @param int $user_id
	 * @return string
	 */
	public static function getUserImageInBase64($user_id)
	{
		$user_id = (int) $user_id;

		if(!array_key_exists($user_id, self::$user_image_cache))
		{
			$img_file = ilObjUser::_getPersonalPicturePath($user_id, 'xxsmall');
			$img_file = preg_split('/\?/', $img_file);
			$img_file = $img_file[0];
			if(file_exists($img_file))
			{
				$binary = fread(fopen($img_file, "r"), filesize($img_file));
				self::$user_image_cache[$user_id] = 'data:image/jpeg;base64,' . base64_encode($binary);
			}
			else if(strlen($img_file) > 0)
			{
				self::$user_image_cache[$user_id] = $img_file;
			}
		}

		return self::$user_image_cache[$user_id];
	}

	/**
	 * @param int $user_id
	 * @return string
	 */
	public static function lookupUsername($user_id)
	{
		$user_id = (int) $user_id;

		if(!array_key_exists($user_id, self::$user_name_cache))
		{
			$user = new ilObjUser($user_id);
			if($user->hasPublicProfile())
			{
				self::$user_name_cache[$user_id] = $user->getFirstname() . ' ' . $user->getLastname();
			}
			else
			{
				self::$user_name_cache[$user_id] = '[' . $user->getLogin() . ']';
			}
		}

		return self::$user_name_cache[$user_id];
	}

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
		$this->obj_id = (int) $obj_id;
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
		$this->comment_id = (int) $comment_id;
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
	public function getIsPrivate()
	{
		return $this->is_private;
	}

	/**
	 * @param int $is_private
	 */
	public function setIsPrivate($is_private)
	{
		$this->is_private = $is_private;
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
	 * @return float
	 */
	public function getCommentTimeEnd()
	{
		return $this->comment_time_end;
	}

	/**
	 * @param float $comment_time_end
	 */
	public function setCommentTimeEnd($comment_time_end)
	{
		$this->comment_time_end = $comment_time_end;
	}

	/**
	 * @return int
	 */
	public function getIsReplyTo()
	{
		return $this->is_reply_to;
	}

	/**
	 * @param int $is_reply_to
	 */
	public function setIsReplyTo($is_reply_to)
	{
		$this->is_reply_to = $is_reply_to;
	}

	/**
	 * @return array
	 */
	public static function getUserImageCache()
	{
		return self::$user_image_cache;
	}

	/**
	 * @return string
	 */
	public function getMarker()
	{
		return $this->marker;
	}

	/**
	 * @param string $marker
	 */
	public function setMarker($marker)
	{
		$this->marker = $marker;
	}
}