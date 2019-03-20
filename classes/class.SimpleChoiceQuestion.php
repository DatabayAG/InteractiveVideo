<?php
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');

/**
 * Class SimpleChoiceQuestion
 */
class SimpleChoiceQuestion
{
	const TABLE_NAME_QUESTION_TEXT	= 'rep_robj_xvid_qus_text';
	const TABLE_NAME_QUESTION		= 'rep_robj_xvid_question';
	const TABLE_NAME_COMMENTS		= 'rep_robj_xvid_comments';
	const TABLE_NAME_SCORE			= 'rep_robj_xvid_score';
	const TABLE_NAME_ANSWERS		= 'rep_robj_xvid_answers';

	const SINGLE_CHOICE = 0;
	const MULTIPLE_CHOICE = 1;
	const REFLECTION = 2;

	const CORRECT_ANSWERS = 0;
	const NEUTRAL_ANSWERS = 1;

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
	protected $question_id;

	/**
	 * @var string
	 */
	protected $question_text;

	/**
	 * @var integer
	 */
	protected $type;
	/**
	 * @var string
	 */
	protected $feedback_correct;
	/**
	 * @var string
	 */
	protected $feedback_one_wrong;

	/**
	 * @var int
	 */
	protected $limit_attempts = 0;

	/**
	 * @var int
	 */
	protected $is_jump_correct = 0;

	/**
	 * @var int
	 */
	protected $show_correct_icon = 1;

	/**
	 * @var int
	 */
	protected $show_wrong_icon = 1;

	/**
	 * @var int
	 */
	protected $jump_correct_ts = 0;

	/**
	 * @var int
	 */
	protected $is_jump_wrong = 0;

	/**
	 * @var int
	 */
	protected $jump_wrong_ts = 0;

	/**
	 * @var int
	 */
	protected $repeat_question = 0;
	
	/**
	 * @var int
	 */
	protected $show_response_frequency = 0;

	/**
	 * @var int
	 */
	protected $feedback_correct_id;

	/**
	 * @var int
	 */
	protected $feedback_wrong_id;

	/**
	 * @var int
	 */
	protected $reflection_question_comment = 0;

	/**
	 * @var int
	 */
	protected $neutral_answer = 0;

	/**
	 * @var string
	 */
	protected $question_image = '';

	/**
	 * @var string
	 */
	public $import_question_image = '';
	
	
	public $import_answers = array();
	
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

	/**
	 *
	 */
	public function read()
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION . ' 
				WHERE comment_id = %s',
			array('integer'), array($this->getCommentId())
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$this->setQuestionId($row['question_id']);
			$this->setQuestionText($row['question_text']);
			$this->setType($row['type']);
			$this->setFeedbackCorrect($row['feedback_correct']);
			$this->setFeedbackOneWrong($row['feedback_one_wrong']);
			$this->setLimitAttempts($row['limit_attempts']);
			$this->setIsJumpCorrect($row['is_jump_correct']);
			$this->setShowCorrectIcon($row['show_correct_icon']);
			$this->setJumpCorrectTs($row['jump_correct_ts']);
			$this->setIsJumpWrong($row['is_jump_wrong']);
			$this->setShowWrongIcon($row['show_wrong_icon']);
			$this->setJumpWrongTs($row['jump_wrong_ts']);
			$this->setShowResponseFrequency($row['show_response_frequency']);
			$this->setFeedbackCorrectId($row['feedback_correct_ref_id']);
			$this->setFeedbackWrongId($row['feedback_wrong_ref_id']);
			$this->setRepeatQuestion($row['repeat_question']);
			$this->setReflectionQuestionComment($row['reflection_question_comment']);
			$this->setNeutralAnswer($row['neutral_answer']);
			$this->setQuestionImage($row['question_image']);
		}

//		$this->readAnswerDefinitions();
	}

	/**
	 *
	 */
	public function readQuestionById($qid)
	{
		/**
		 * @var $ilDB ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION . ' 
				INNER JOIN '. self::TABLE_NAME_COMMENTS .'
				WHERE question_id = %s AND '.self::TABLE_NAME_QUESTION . '.comment_id = '.self::TABLE_NAME_COMMENTS.'.comment_id',
			array('integer'), array($qid)
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			return $row;
		}

//		$this->readAnswerDefinitions();
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
	 * @param $question_id
	 * @return bool
	 */
	public static function isLimitAttemptsEnabled($question_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT limit_attempts FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			array('integer'), array($question_id));

		$row = $ilDB->fetchAssoc($res);
		return (bool)$row['limit_attempts'];

	}

	/**
	 * @param $comment_id
	 * @return bool
	 */
	public static function isRepeatQuestionEnabled($comment_id)
	{
		global $ilDB;
		$res = $ilDB->queryF('SELECT repeat_question FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		return (bool)$row['repeat_question'];
	}

	/**
	 * @param $comment_id
	 * @return bool
	 */
	public static function existUserAnswer($comment_id)
	{
		/**
		 * $ilUser ilUser
		 * $ilDB ilDB
		 */
		global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_ANSWERS . ' ans
			INNER JOIN ' . self::TABLE_NAME_QUESTION . ' qst on ans.question_id = qst.question_id 
			WHERE comment_id = %s 
			AND user_id = %s
			',
			array('integer', 'integer'), array($comment_id, $ilUser->getId()));

		if($ilDB->numRows($res) > 0)
		{
			return true;
		}
		return false;
	}

	/**
	 * @param $question_id
	 * @return bool
	 */
	public static function existUserAnswerForQuestionId($question_id)
	{
		/**
		 * $ilUser ilUser
		 * $ilDB ilDB
		 */
		global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_ANSWERS . ' 			
			WHERE question_id = %s 
			AND user_id = %s
			',
			array('integer', 'integer'), array($question_id, $ilUser->getId()));

		if($ilDB->numRows($res) > 0)
		{
			return true;
		}
		return false;
	}

	/**
	 *
	 */
	private function readAnswerDefinitions()
	{
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION_TEXT . '  
				WHERE question_id = %s',
			array('integer'), array($this->getQuestionId())
		);

		while($row = $ilDB->fetchAssoc($res))
		{
			$this->answer_defs[] = $row;
		}
	}

	/**
	 * @return int
	 */
	public function getQuestionId()
	{
		return $this->question_id;
	}

	/**
	 * @param int $question_id
	 */
	public function setQuestionId($question_id)
	{
		$this->question_id = $question_id;
	}

	/**
	 * @param $old_comment_id
	 * @param $new_comment_id
	 */
	public function cloneQuestionObject($old_comment_id, $new_comment_id)
	{
		global $ilDB;

		$_POST['answer'] = array();
		$_POST['correct'] = array();

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION_TEXT . '  
				WHERE question_id = %s',
			array('integer'), array($this->getQuestionIdByCommentId($old_comment_id))
		);
		$counter = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$_POST['answer'][] = $row['answer'];
			if($row['correct'] == 1)
			{
				$_POST['correct'][$counter] = 1;
			}
			$counter++;
		}
		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION . ' 
				WHERE comment_id = %s',
			array('integer'), array($old_comment_id)
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$this->setCommentId($new_comment_id);
			$this->setQuestionText($row['question_text']);
			$this->setType($row['type']);
			$this->setFeedbackCorrect($row['feedback_correct']);
			$this->setFeedbackOneWrong($row['feedback_one_wrong']);
			$this->setLimitAttempts($row['limit_attempts']);
			$this->setIsJumpCorrect($row['is_jump_correct']);
			$this->setJumpCorrectTs($row['jump_correct_ts']);
			$this->setShowCorrectIcon($row['show_correct_icon']);
			$this->setIsJumpWrong($row['is_jump_wrong']);
			$this->setShowWrongIcon($row['show_wrong_icon']);
			$this->setJumpWrongTs($row['jump_wrong_ts']);
			$this->setShowResponseFrequency($row['show_response_frequency']);
			$this->setFeedbackCorrectId($row['feedback_correct_ref_id']);
			$this->setFeedbackWrongId($row['feedback_wrong_ref_id']);
			$this->setRepeatQuestion($row['repeat_question']);
			$this->setReflectionQuestionComment($row['reflection_question_comment']);
			$this->setNeutralAnswer($row['neutral_answer']);
			$this->setQuestionImage($row['question_image']);
			$_POST['question_type'] = $row['type'];
			$this->create();
		}
	}

	/**
	 * @param $comment_id
	 * @return int
	 */
	public function getQuestionIdByCommentId($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT question_id FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		return $row['question_id'];
	}

	/**
	 *
	 */
	public function create()
	{
		/**
		 * @var $ilDB   ilDB
		 * @var $ilUser ilObjUser
		 */
		global $ilDB;
		$question_id = $ilDB->nextId(self::TABLE_NAME_QUESTION);
		$ilDB->insert(self::TABLE_NAME_QUESTION,
			array(
				'question_id'        => array('integer', $question_id),
				'comment_id'         => array('integer', $this->getCommentId()),
				'type'               => array('integer', $this->getType()),
				'question_text'      => array('text', $this->getQuestionText()),
				'feedback_correct'   => array('text', $this->getFeedbackCorrect()),
				'feedback_one_wrong' => array('text', $this->getFeedbackOneWrong()),
				'limit_attempts'     => array('integer', $this->getLimitAttempts()),
				'show_correct_icon'  => array('integer', $this->getShowCorrectIcon()),
				'is_jump_correct'    => array('integer', $this->getIsJumpCorrect()),
				'jump_correct_ts'    => array('integer', $this->getJumpCorrectTs()),
				'show_wrong_icon'    => array('integer', $this->getShowWrongIcon()),
				'is_jump_wrong'      => array('integer', $this->getIsJumpWrong()),
				'jump_wrong_ts'      => array('integer', $this->getJumpWrongTs()),
				'show_response_frequency' => array('integer', $this->getShowResponseFrequency()),
				'feedback_correct_ref_id' => array('integer', $this->getFeedbackCorrectId()),
				'feedback_wrong_ref_id' => array('integer', $this->getFeedbackWrongId()),
				'repeat_question'    => array('integer', $this->getRepeatQuestion()),
				'reflection_question_comment' => array('integer', $this->getReflectionQuestionComment()),
				'neutral_answer' => array('integer', $this->getNeutralAnswer()),
				'question_image' => array('text', $this->getQuestionImage()),
			));
		if(count($_POST['answer']) > 0 && $_POST['question_type'] != self::REFLECTION)
		{
			foreach(ilUtil::stripSlashesRecursive($_POST['answer']) as $key => $value)
			{
				$answer_id = $ilDB->nextId(self::TABLE_NAME_QUESTION_TEXT);
				if($value == null){$value = ' ';}
				if(is_array($_POST['correct']) && array_key_exists($key, ilUtil::stripSlashesRecursive($_POST['correct'])))
				{
					$correct = 1;
				}
				else
				{
					$correct = 0;
				}
				$ilDB->insert(self::TABLE_NAME_QUESTION_TEXT,
					array(
						'answer_id'   => array('integer', $answer_id),
						'question_id' => array('integer', $question_id),
						'answer'      => array('text', $value),
						'correct'     => array('integer', $correct)
					));
			}
		}
		else if($_POST['question_type'] == self::REFLECTION)
		{
			$answer_id = $ilDB->nextId(self::TABLE_NAME_QUESTION_TEXT);
			$ilDB->insert(self::TABLE_NAME_QUESTION_TEXT,
				array(
					'answer_id'   => array('integer', $answer_id),
					'question_id' => array('integer', $question_id),
					'answer'      => array('text', ' '),
					'correct'     => array('integer', 1)
				));
		}
		return $question_id;
	}

	/**
	 * @param      $oid
	 * @param null $a_user_id
	 * @return int|array
	 */
	public function getAllUsersWithCompletelyCorrectAnswers($oid, $a_user_id = null)
	{
		$user_ids = array();
		/**
		 * $ilDB ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
			'SELECT sum(points) as points, rep_robj_xvid_score.user_id as usr_id FROM rep_robj_xvid_comments 
		LEFT JOIN rep_robj_xvid_question ON rep_robj_xvid_question.comment_id = rep_robj_xvid_comments.comment_id
        LEFT JOIN rep_robj_xvid_answers ON rep_robj_xvid_answers.question_id = rep_robj_xvid_question.question_id
		LEFT JOIN rep_robj_xvid_score ON rep_robj_xvid_answers.user_id = rep_robj_xvid_score.user_id AND rep_robj_xvid_answers.question_id = rep_robj_xvid_score.question_id
		WHERE rep_robj_xvid_comments.obj_id = %s 
        AND is_interactive = 1
        AND neutral_answer = 0
        AND points = 1
        GROUP BY usr_id',
			array('integer'),
			array(($oid))
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$user_ids[$row['usr_id']] = $row['points'];
		}
		
		if($a_user_id != null && array_key_exists($a_user_id, $user_ids))
		{
			return $user_ids[$a_user_id];
		}
		else if($a_user_id != null)
		{
			return 0;
		}
		return $user_ids;

	}
	
	/**
	 * @return int
	 */
	public function getType()
	{
		return $this->type;
	}

	/**
	 * @param int $type
	 */
	public function setType($type)
	{
		$this->type = $type;
	}
	
	/**
	 * @return string
	 */
	public function getQuestionText()
	{
		return $this->question_text;
	}

	/**
	 * @param string $question_text
	 */
	public function setQuestionText($question_text)
	{
		$this->question_text = $question_text;
	}

	/**
	 * @return string
	 */
	public function getFeedbackCorrect()
	{
		return $this->feedback_correct;
	}

	/**
	 * @param string $feedback_correct
	 */
	public function setFeedbackCorrect($feedback_correct)
	{
		$this->feedback_correct = $feedback_correct;
	}

	/**
	 * @return string
	 */
	public function getFeedbackOneWrong()
	{
		return $this->feedback_one_wrong;
	}

	/**
	 * @param string $feedback_one_wrong
	 */
	public function setFeedbackOneWrong($feedback_one_wrong)
	{
		$this->feedback_one_wrong = $feedback_one_wrong;
	}

	/**
	 * @return int
	 */
	public function getLimitAttempts()
	{
		return $this->limit_attempts;
	}

	/**
	 * @param int $limit_attempts
	 */
	public function setLimitAttempts($limit_attempts)
	{
		$this->limit_attempts = $limit_attempts;
	}

	/**
	 * @return int
	 */
	public function getShowCorrectIcon()
	{
		return $this->show_correct_icon;
	}

	/**
	 * @param int $show_correct_icon
	 */
	public function setShowCorrectIcon($show_correct_icon)
	{
		$this->show_correct_icon = $show_correct_icon;
	}

	/**
	 * @return int
	 */
	public function getIsJumpCorrect()
	{
		return $this->is_jump_correct;
	}

	/**
	 * @param int $is_jump_correct
	 */
	public function setIsJumpCorrect($is_jump_correct)
	{
		$this->is_jump_correct = $is_jump_correct;
	}

	/**
	 * @return int
	 */
	public function getJumpCorrectTs()
	{
		return $this->jump_correct_ts;
	}

	/**
	 * @param int $jump_correct_ts
	 */
	public function setJumpCorrectTs($jump_correct_ts)
	{
		$this->jump_correct_ts = $jump_correct_ts;
	}

	/**
	 * @return int
	 */
	public function getShowWrongIcon()
	{
		return $this->show_wrong_icon;
	}

	/**
	 * @param int $show_wrong_icon
	 */
	public function setShowWrongIcon($show_wrong_icon)
	{
		$this->show_wrong_icon = $show_wrong_icon;
	}

	/**
	 * @return int
	 */
	public function getIsJumpWrong()
	{
		return $this->is_jump_wrong;
	}

	/**
	 * @param int $is_jump_wrong
	 */
	public function setIsJumpWrong($is_jump_wrong)
	{
		$this->is_jump_wrong = $is_jump_wrong;
	}

	/**
	 * @return int
	 */
	public function getJumpWrongTs()
	{
		return $this->jump_wrong_ts;
	}

	/**
	 * @param int $jump_wrong_ts
	 */
	public function setJumpWrongTs($jump_wrong_ts)
	{
		$this->jump_wrong_ts = $jump_wrong_ts;
	}

	/**
	 * @return int
	 */
	public function getShowResponseFrequency()
	{
		return $this->show_response_frequency;
	}

	/**
	 * @param int $show_response_frequency
	 */
	public function setShowResponseFrequency($show_response_frequency)
	{
		$this->show_response_frequency = $show_response_frequency;
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
	 * @return bool
	 */
	public function checkInput()
	{
		$status  = true;
		$correct = 0;

		if((int)$_POST['question_type'] === 0)
		{
			$this->setType(self::SINGLE_CHOICE);
		}
		else if((int)$_POST['question_type'] === 1)
		{
			$this->setType(self::MULTIPLE_CHOICE);
		}
		else if((int)$_POST['question_type'] === 2)
		{
			$this->setType(self::REFLECTION);
		}
		$question_text = ilUtil::stripSlashes($_POST['question_text']);

		if($question_text === '')
		{
			$status = false;
		}
		if($this->getType() != self::REFLECTION)
		{
			foreach(ilUtil::stripSlashesRecursive($_POST['answer']) as $key => $value)
			{
				if(is_array($_POST['correct']) && array_key_exists($key, ilUtil::stripSlashesRecursive($_POST['correct'])))
				{
					$correct += 1;
				}
				if($value === '')
				{
					$status = false;
				}
			}
			if($correct === 0 && ! ($this->getNeutralAnswer() == 1))
			{
				$status = false;
			}
		}
		return $status;
	}

	/**
	 * @param $comment_id
	 * @return int
	 */
	public function existQuestionForCommentId($comment_id)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		$question_id = (int)$row['question_id'];

		return $question_id;
	}

	/**
	 * @param $cid
	 * @return string
	 */
	public function getCommentTitleByCommentId($cid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res   = $ilDB->queryF(
			'SELECT comment_title FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			array('integer'),
			array((int)$cid)
		);
		$title = '';
		while($row = $ilDB->fetchAssoc($res))
		{
			$title = $row['comment_title'];
		}
		if($title == null)
		{
			$title = '';
		}
		return $title;
	}

	/**
	 * @param int $user_id
	 * @return array
	 */
	public function getAllNonRepeatAnsweredQuestion($user_id)
	{
		global $ilDB;
		$res     = $ilDB->queryF('
			SELECT comments.comment_id  comment 
			FROM ' . self::TABLE_NAME_COMMENTS . ' comments, 
				' . self::TABLE_NAME_QUESTION . '  questions, 
				' . self::TABLE_NAME_SCORE . '  score  
			WHERE comments.comment_id = questions.comment_id 
			AND questions.question_id = score.question_id 
			AND questions.repeat_question = %s
			AND score.user_id = %s',
			array('integer', 'integer'),
			array(0, (int)$user_id)
		);
		$results = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[] = $row['comment'];
		}
		return $results;
	}

	/**
	 * @param int $user_id
	 * @return array
	 */
	public function getAllRepeatCorrectlyAnsweredQuestion($user_id)
	{
		global $ilDB;
		$res     = $ilDB->queryF('
			SELECT comments.comment_id  comment 
			FROM ' . self::TABLE_NAME_COMMENTS . ' comments, 
				' . self::TABLE_NAME_QUESTION . '  questions, 
				' . self::TABLE_NAME_SCORE . '  score  
			WHERE comments.comment_id = questions.comment_id 
			AND questions.question_id = score.question_id 
			AND score.points = %s
			AND questions.repeat_question = %s
			AND score.user_id = %s',
			array('integer', 'integer', 'integer'),
			array(1, 1, (int)$user_id)
		);
		$results = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[] = $row['comment'];
		}
		return $results;
	}

	/**
	 * @param array $user_ids
	 * @param int   $obj_id
	 */
	public function deleteUserResults($user_ids, $obj_id)
	{
		global $ilDB;

		if(!is_array($user_ids))
			return;

		$question_ids = $this->getInteractiveQuestionIdsByObjId($obj_id);

		$ilDB->manipulate('
		DELETE FROM ' . self::TABLE_NAME_SCORE . '  
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer') . ' 
		AND 	' . $ilDB->in('user_id', $user_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM ' . self::TABLE_NAME_ANSWERS . ' 
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer') . ' 
		AND 	' . $ilDB->in('user_id', $user_ids, false, 'integer'));
	}

	/**
	 * @param $obj_id
	 * @return array
	 */
	public function getInteractiveQuestionIdsByObjId($obj_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT 		question_id 
			FROM 		' . self::TABLE_NAME_QUESTION . ' qst
			INNER JOIN 	' . self::TABLE_NAME_COMMENTS . '  cmt on qst.comment_id = cmt.comment_id
			WHERE		obj_id = %s AND is_interactive = %s',
			array('integer', 'integer'), array($obj_id, 1));

		$question_ids = array();

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		return $question_ids;
	}

	/**
	 * @param $obj_id
	 * @return array
	 */
	public function getInteractiveNotNeutralQuestionIdsByObjId($obj_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT 		question_id 
			FROM 		' . self::TABLE_NAME_QUESTION . ' qst
			INNER JOIN 	' . self::TABLE_NAME_COMMENTS . '  cmt on qst.comment_id = cmt.comment_id
			WHERE		obj_id = %s AND is_interactive = %s AND neutral_answer = %s AND type <> 2',
			array('integer', 'integer', 'integer'), array($obj_id, 1, 0));

		$question_ids = array();

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		return $question_ids;
	}

	/**
	 * @param array $question_ids
	 */
	public function deleteQuestionsResults($question_ids)
	{
		global $ilDB;

		if(!is_array($question_ids))
			return;

		$ilDB->manipulate('
		DELETE FROM ' . self::TABLE_NAME_SCORE . ' 
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM ' . self::TABLE_NAME_ANSWERS . ' 
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer'));
	}

	/**
	 * @param int $qid question_id
	 * @return mixed
	 */
	public function getQuestionTextQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		$res = $ilDB->queryF(
			'SELECT question_text FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			array('integer'),
			array((int)$qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return $row['question_text'];

	}

	/**
	 * @param $qid
	 * @param $answers
	 */
	public function saveAnswer($qid, $answers)
	{
		/**
		 * $ilDB ilDB
		 * 
		 */
		global $ilDB, $ilUser;

		$usr_id = $ilUser->getId();
		$type   = $this->getTypeByQuestionId($qid);

		$this->removeAnswer($qid);
		$scoring         = new SimpleChoiceQuestionScoring();
		$correct_answers = $scoring->getCorrectAnswersForQuestion($qid);
		$points          = 0;

		if($type === self::SINGLE_CHOICE)
		{
			if(in_array($answers[0], $correct_answers))
			{
				$points = 1;
			}
			$ilDB->insert(self::TABLE_NAME_ANSWERS,
				array(
					'question_id' => array('integer', $qid),
					'user_id'     => array('integer', $usr_id),
					'answer_id'   => array('integer', $answers[0])
				));
		}
		else if($type === self::MULTIPLE_CHOICE)
		{
			$points = 1;
			foreach($answers as $key => $value)
			{
				$ilDB->insert(self::TABLE_NAME_ANSWERS,
					array(
						'question_id' => array('integer', $qid),
						'user_id'     => array('integer', $usr_id),
						'answer_id'   => array('integer', (int)$value)
					));
				if(sizeof($answers) !== sizeof($correct_answers) || !in_array($value, $correct_answers))
				{
					$points = 0;
				}
			}
			if(sizeof($answers) == 0)
			{
				$points = 0;
			}
		}
		else if($type === self::REFLECTION)
		{
			$points = 1;
		}
		
		if($this->getNeutralAnswer() === self::NEUTRAL_ANSWERS)
		{
			$points = 0;
		}
		$ilDB->insert(self::TABLE_NAME_SCORE,
			array(
				'question_id' => array('integer', $qid),
				'user_id'     => array('integer', $usr_id),
				'points'      => array('integer', $points)
			));
	}

	/**
	 * @param $qid
	 * @return int
	 */
	public function getTypeByQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		$res = $ilDB->queryF(
			'SELECT * FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			array('integer'),
			array((int)$qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int)$row['type'];

	}

	/**
	 * @param $qid
	 */
	public function removeAnswer($qid)
	{
		global $ilDB, $ilUser;
		$usr_id = $ilUser->getId();
		$ilDB->queryF('DELETE FROM ' . self::TABLE_NAME_ANSWERS . ' WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$this->removeScore($qid);
	}

	/**
	 * @param $qid
	 */
	public function removeScore($qid)
	{
		global $ilDB, $ilUser;
		$usr_id = $ilUser->getId();
		$ilDB->queryF('DELETE FROM ' . self::TABLE_NAME_SCORE . ' WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
	}

	/**
	 * @param $comment_id
	 */
	public function deleteQuestionsIdByCommentId($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT question_id FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$question_ids = array();

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		self::deleteQuestions($question_ids);
	}

	/**
	 * @param array $question_ids
	 */
	public static function deleteQuestions($question_ids)
	{
		if(!is_array($question_ids))
		{
			return;
		}

		global $ilDB;

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_QUESTION . ' WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_QUESTION_TEXT . ' WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_ANSWERS . ' WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_SCORE . ' WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));
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
		$this->obj_id = $obj_id;
	}

	/**
	 * @return int
	 */
	public function getFeedbackCorrectId()
	{
		return $this->feedback_correct_id;
	}

	/**
	 * @param int $feedback_correct_id
	 */
	public function setFeedbackCorrectId($feedback_correct_id)
	{
		$this->feedback_correct_id = $feedback_correct_id;
	}

	/**
	 * @return int
	 */
	public function getFeedbackWrongId()
	{
		return $this->feedback_wrong_id;
	}

	/**
	 * @param int $feedback_wrong_id
	 */
	public function setFeedbackWrongId($feedback_wrong_id)
	{
		$this->feedback_wrong_id = $feedback_wrong_id;
	}

	/**
	 * @return int
	 */
	public function getReflectionQuestionComment()
	{
		return $this->reflection_question_comment;
	}

	/**
	 * @param int $reflection_question_comment
	 */
	public function setReflectionQuestionComment($reflection_question_comment)
	{
		$this->reflection_question_comment = $reflection_question_comment;
	}

	/**
	 * @return int
	 */
	public function getNeutralAnswer()
	{
		return $this->neutral_answer;
	}

	/**
	 * @param int $neutral_answer
	 */
	public function setNeutralAnswer($neutral_answer)
	{
		$this->neutral_answer = $neutral_answer;
	}

	/**
	 * @return string
	 */
	public function getQuestionImage()
	{
		return $this->question_image;
	}

	/**
	 * @param string $question_image
	 */
	public function setQuestionImage($question_image)
	{
		$this->question_image = $question_image;
	}
} 
