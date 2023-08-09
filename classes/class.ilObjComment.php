<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/User/classes/class.ilUserUtil.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilHtmlInteractiveVideoPostPurifier.php';

class ilObjComment
{
	protected int $obj_id;
	protected int $comment_id;
	protected int $user_id;
    protected bool $is_tutor = false;
    protected float $comment_time = 0;
	protected float $comment_time_end = 0;
	protected string $comment_text = '';
	protected bool $is_interactive = false;
	protected string $comment_title = '';
	protected string $comment_tags = '';
	protected array $comments = array();
	protected int $is_private = 0;
    protected int $is_table_of_content = 0;
    protected int $is_public = 0;
	protected int $is_anonymized = 0;
    protected int $is_repeat = 0;
	protected int $is_reply_to = 0;
	protected string $marker;
	protected static array $user_name_cache = array();
	protected static array $user_image_cache = array();
	protected ilDBInterface $db;

	public function __construct(int $comment_id = 0)
	{
        /**
         * @var $ilDB ilDBInterface
         */
	    global $ilDB;
	    $this->db = $ilDB;

		if($comment_id > 0)
		{
			$this->setCommentId($comment_id);
			$this->read();
		}
	}

	public function read()
	{

		$res = $this->db->queryF(
			'SELECT * FROM rep_robj_xvid_comments WHERE comment_id = %s',
			array('integer'),
			array($this->getCommentId())
		);
		$row = $this->db->fetchAssoc($res);

		$this->setCommentText($row['comment_text']);
		$this->setCommentTime($row['comment_time']);
		$this->setCommentTimeEnd($row['comment_time_end']);
		$this->setInteractive((bool)$row['is_interactive']);
		$this->setIsTutor((bool)$row['is_tutor']);
		$this->setUserId($row['user_id']);
		$this->setCommentTitle($row['comment_title']);
		$this->setCommentTags($row['comment_tags']);
		$this->setIsPrivate($row['is_private']);
		$this->setIsTableOfContent($row['is_table_of_content']);
		$this->setIsReplyTo($row['is_reply_to']);
		$this->setMarker($row['marker']);
	}

	public function create($return_next_id = false, $reply_to_posting = false)
    {
        /**
         * @var $ilUser ilObjUser
         */
		global $ilUser;
		$purify = new ilHtmlInteractiveVideoPostPurifier();
		$text = $purify->purify($this->getCommentText());

		if($this->getIsReplyTo() != 0 && !$reply_to_posting)
		{
			$this->removeOldReplyTo($this->getIsReplyTo());
		}
		$next_id = $this->db->nextId('rep_robj_xvid_comments');
		$this->setCommentId($next_id);
        $this->db->insert('rep_robj_xvid_comments',
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
				'is_table_of_content'=> array('integer', $this->getIsTableOfContent()),
				'is_reply_to'		=> array('integer', $this->getIsReplyTo()),
				'marker'			=> array('text', $this->getMarker())
			));
		if($return_next_id)
		{
			return $next_id;
		}
	}

	public function removeOldReplyTo(int $reply_to)
	{
        /**
         * @var $ilUser ilObjUser
         */
		global $ilUser;
        $this->db->manipulateF('DELETE FROM rep_robj_xvid_comments WHERE is_reply_to = %s AND user_id = %s',
			array('integer', 'integer'), array($reply_to, $ilUser->getId()));
	}

	public function update()
	{
        /**
         * @var $ilUser ilObjUser
         */
		global $ilUser;
		$purify = new ilHtmlInteractiveVideoPostPurifier();
		$text = $purify->purify($this->getCommentText());

        $this->db->update('rep_robj_xvid_comments',
			array(
				'is_interactive' 	=> array('integer', (int)$this->isInteractive()),
				'user_id'        	=> array('integer', $ilUser->getId()),
				'comment_time'   	=> array('integer', round($this->getCommentTime(), 0)),
				'comment_time_end'  => array('integer', round($this->getCommentTimeEnd(), 2)),
				'comment_text'   	=> array('text', $text),
				'comment_title'		=> array('text', $this->getCommentTitle()),
				'comment_tags'		=> array('text', $this->getCommentTags()),
				'is_private'		=> array('integer', $this->getIsPrivate()),
				'is_table_of_content'=> array('integer', $this->getIsTableOfContent()),
				'is_reply_to'		=> array('integer', $this->getIsReplyTo()),
				'marker'			=> array('text', $this->getMarker())
			),
			array(
				'comment_id' => array('integer', $this->getCommentId())
			)
		);
	}

	public function deleteComments(array $comment_ids) : bool
    {

		if(!is_array($comment_ids)){
            return false;
        }
        $this->db->manipulate('DELETE FROM rep_robj_xvid_comments WHERE ' . $this->db->in('comment_id', $comment_ids, false, 'integer'));
	    return true;
    }

	public function getStopPoints() : array
    {
		$res = $this->db->queryF(
			'SELECT comment_time
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s
			ORDER BY comment_time ASC',
			array('integer'),
			array($this->getObjId())
		);

		$stop_points = array();
		while($row = $this->db->fetchAssoc($res))
		{
			$stop_points[] = $row['comment_time'];
		}

		return $stop_points;
	}

	public function getContentComments(bool $toc = false) : array
    {
		/**
		 * @var $ilDB
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
		
		$res = $this->db->queryF(
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
		while($row = $this->db->fetchAssoc($res))
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
			$temp['is_table_of_content'] = $row['is_table_of_content'];
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
			    if($toc === false) {
                    $comments[$i] = $temp;
                } elseif($toc === true && $temp['is_table_of_content'] === "1"){
                    $comments[$i] = $temp;
                }

				$i++;
			}
		}
		
		if(is_array($is_reply_to) && sizeof($is_reply_to) > 0)
		{
			$comments = $this->sortInReplies($is_reply_to, $comments);
		}

		return $comments;
	}

	protected function sortInReplies($is_reply_to, $comments) : array
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

	public function cloneTutorComments(int $old_id, int $new_id)
	{
		$questions_array = array();
		$res = $this->db->queryF(
			'SELECT *
			FROM rep_robj_xvid_comments
			WHERE obj_id = %s
			AND is_tutor = 1
			ORDER BY comment_time, comment_id ASC',
			array('integer'),
			array($old_id)
		);
		while($row = $this->db->fetchAssoc($res))
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
			$this->setIsTableOfContent($row['is_table_of_content']);
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

	public static function getUserImageInBase64(int $user_id) : string
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

	public static function lookupUsername(int $user_id) : string
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

	public static function getCommentTitleByQuestionId(int $question_id) : string
    {
        /**
         * @vas $ilDB ilDB
         */
        global $ilDB;

        $title = $question_id;

        $res = $ilDB->queryF(
            'SELECT * FROM rep_robj_xvid_comments
                    INNER JOIN rep_robj_xvid_question 
                        ON rep_robj_xvid_comments.comment_id = rep_robj_xvid_question.comment_id
                        WHERE rep_robj_xvid_question.question_id=%s;',
            array('integer'),
            array($question_id)
        );

        while($row = $ilDB->fetchAssoc($res))
        {
            $title = $row['comment_title'];
        }

        return $title;
    }

	################## SETTER & GETTER ##################
	public function getObjId() : int
    {
		return $this->obj_id;
	}

	public function setObjId(int $obj_id)
	{
		$this->obj_id = (int) $obj_id;
	}

	public function getCommentId() : int
    {
		return $this->comment_id;
	}

	public function setCommentId(int $comment_id)
	{
		$this->comment_id = (int) $comment_id;
	}

	public function isInteractive() : bool
    {
		return $this->is_interactive;
	}

	public function setInteractive(bool $is_interactive)
	{
		$this->is_interactive = $is_interactive;
	}

	public function getCommentText() : string
    {
		return $this->comment_text;
	}

	public function setCommentText(string $comment_text)
	{
		$this->comment_text = $comment_text;
	}

	public function getCommentTime() : float
	{
		return $this->comment_time;
	}

	public function setCommentTime(float $comment_time)
	{
		$this->comment_time = $comment_time;
	}

	public function isTutor() : bool
    {
		return $this->is_tutor;
	}

	public function setIsTutor(bool $is_tutor)
	{
		$this->is_tutor = $is_tutor;
	}

	public function getUserId() : int
    {
		return $this->user_id;
	}

	public function setUserId(int $user_id)
	{
		$this->user_id = $user_id;
	}

	public function getCommentTags() : string
    {
		return $this->comment_tags;
	}

	public function setCommentTags(string $comment_tags)
	{
		$this->comment_tags = $comment_tags;
	}

    public function getCommentTitle() : string
    {
		return $this->comment_title;
	}

	public function setCommentTitle(string $comment_title)
	{
		$this->comment_title = $comment_title;
	}

	public function getIsPrivate() : int
    {
		return $this->is_private;
	}

	public function setIsPrivate(int $is_private)
	{
		$this->is_private = $is_private;
	}

    public function getIsTableOfContent() : int
    {
        return $this->is_table_of_content;
    }

    public function setIsTableOfContent(int $is_table_of_content)
    {
        $this->is_table_of_content = $is_table_of_content;
    }
	
	public function isPublic() : int
    {
		return $this->is_public;
	}

	public function setIsPublic(int $is_public)
	{
		$this->is_public = $is_public;
	}

	public function isAnonymized() : int
    {
		return $this->is_anonymized;
	}

	public function setIsAnonymized(int $is_anonymized)
	{
		$this->is_anonymized = $is_anonymized;
	}

	public function isRepeat() : int
    {
		return $this->is_repeat;
	}

	public function setIsRepeat(int $is_repeat)
	{
		$this->is_repeat = $is_repeat;
	}

	public function getCommentTimeEnd() : float
	{
		return $this->comment_time_end;
	}

	public function setCommentTimeEnd(float $comment_time_end)
	{
		$this->comment_time_end = $comment_time_end;
	}

	public function getIsReplyTo() : int
    {
		return $this->is_reply_to;
	}

	public function setIsReplyTo(int $is_reply_to)
	{
		$this->is_reply_to = $is_reply_to;
	}

	public static function getUserImageCache() : array
    {
		return self::$user_image_cache;
	}

	public function getMarker() : string
    {
		return $this->marker;
	}

	public function setMarker(string $marker)
	{
		$this->marker = $marker;
	}
}