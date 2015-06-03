<?php
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');

/**
 * Class SimpleChoiceQuestion
 */
class SimpleChoiceQuestion
{
	/**
	 *
	 */
	const SINGLE_CHOICE = 0;
	/**
	 *
	 */
	const MULTIPLE_CHOICE = 1;
	/**
	 *
	 */
	const REFLECTION = 2;
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
				FROM rep_robj_xvid_question 
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
			$this->setJumpCorrectTs($row['jump_correct_ts']);
			$this->setIsJumpWrong($row['is_jump_wrong']);
			$this->setJumpWrongTs($row['jump_wrong_ts']);
			$this->setRepeatQuestion($row['repeat_question']);
		}

//		$this->readAnswerDefinitions();
	}

	/**
	 *
	 */
	private function readAnswerDefinitions()
	{
		global $ilDB;

		$res = $ilDB->queryF('
				SELECT * 
				FROM rep_robj_xvid_qus_text  
				WHERE question_id = %s',
			array('integer'), array($this->getQuestionId())
		);

		while($row = $ilDB->fetchAssoc($res))
		{
			$this->answer_defs[] = $row;
		}
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
		$question_id = $ilDB->nextId('rep_robj_xvid_question');
		$ilDB->insert('rep_robj_xvid_question',
			array(
				'question_id'        => array('integer', $question_id),
				'comment_id'         => array('integer', $this->getCommentId()),
				'type'               => array('integer', $this->getType()),
				'question_text'      => array('text', $this->getQuestionText()),
				'feedback_correct'   => array('text', $this->getFeedbackCorrect()),
				'feedback_one_wrong' => array('text', $this->getFeedbackOneWrong()),
				'limit_attempts'     => array('integer', $this->getLimitAttempts()),
				'is_jump_correct'    => array('integer', $this->getIsJumpCorrect()),
				'jump_correct_ts'    => array('integer', $this->getJumpCorrectTs()),
				'is_jump_wrong'      => array('integer', $this->getIsJumpWrong()),
				'jump_wrong_ts'      => array('integer', $this->getJumpWrongTs()),
				'repeat_question'    => array('integer', $this->getRepeatQuestion())
			));
		if(count($_POST['answer']) > 0 && $_POST['answer'][0] != '')
		{
			foreach(ilUtil::stripSlashesRecursive($_POST['answer']) as $key => $value)
			{
				$answer_id = $ilDB->nextId('rep_robj_xvid_qus_text');
				if(array_key_exists($key, ilUtil::stripSlashesRecursive($_POST['correct'])))
				{
					$correct = 1;
				}
				else
				{
					$correct = 0;
				}
				$ilDB->insert('rep_robj_xvid_qus_text',
					array(
						'answer_id'   => array('integer', $answer_id),
						'question_id' => array('integer', $question_id),
						'answer'      => array('text', $value),
						'correct'     => array('integer', $correct)
					));
			}
		}
		else if($this->getType() == self::REFLECTION)
		{
			$answer_id = $ilDB->nextId('rep_robj_xvid_qus_text');
			$ilDB->insert('rep_robj_xvid_qus_text',
				array(
					'answer_id'   => array('integer', $answer_id),
					'question_id' => array('integer', $question_id),
					'answer'      => array('text', ' '),
					'correct'     => array('integer', 1)
				));
		}
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
			if($correct === 0)
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
		$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_question WHERE comment_id = %s',
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
			'SELECT comment_title FROM rep_robj_xvid_comments WHERE comment_id = %s',
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
			'SELECT * FROM rep_robj_xvid_question WHERE question_id = %s',
			array('integer'),
			array((int)$qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int)$row['type'];

	}

	/**
	 * @param int $user_id
	 * @return array
	 */
	public function getAllNonRepeatCorrectAnswerQuestion($user_id)
	{
		global $ilDB;
		$res     = $ilDB->queryF('
			SELECT comments.comment_id  comment 
			FROM rep_robj_xvid_comments comments, 
				rep_robj_xvid_question  questions, 
				rep_robj_xvid_score  score  
			WHERE comments.comment_id = questions.comment_id 
			AND questions.question_id = score.question_id 
			AND questions.repeat_question = %s 
			AND score.points = %s 
			AND score.user_id = %s',
			array('integer', 'integer', 'integer'),
			array(0, 1, (int)$user_id)
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
		DELETE FROM rep_robj_xvid_score 
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer') . ' 
		AND 	' . $ilDB->in('user_id', $user_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_answers 
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
			FROM 		rep_robj_xvid_question qst
			INNER JOIN 	rep_robj_xvid_comments  cmt on qst.comment_id = cmt.comment_id
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
	 * @param array $question_ids
	 */
	public function deleteQuestionsResults($question_ids)
	{
		global $ilDB;

		if(!is_array($question_ids))
			return;

		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_score 
		WHERE 	' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_answers 
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
			'SELECT question_text FROM rep_robj_xvid_question WHERE question_id = %s',
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
			$ilDB->insert('rep_robj_xvid_answers',
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
				$ilDB->insert('rep_robj_xvid_answers',
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
		}
		else if($type === self::REFLECTION)
		{
			$points = 1;
		}
		
		$ilDB->insert('rep_robj_xvid_score',
			array(
				'question_id' => array('integer', $qid),
				'user_id'     => array('integer', $usr_id),
				'points'      => array('integer', $points)
			));
	}

	/**
	 * @param $qid
	 */
	public function removeAnswer($qid)
	{
		global $ilDB, $ilUser;
		$usr_id = $ilUser->getId();
		$res    = $ilDB->queryF('DELETE FROM rep_robj_xvid_answers WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$ilDB->fetchAssoc($res);
		$this->removeScore($qid);
	}

	/**
	 * @param $qid
	 */
	public function removeScore($qid)
	{
		global $ilDB, $ilUser;
		$usr_id = $ilUser->getId();
		$res    = $ilDB->queryF('DELETE FROM rep_robj_xvid_score WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$ilDB->fetchAssoc($res);
	}

	/**
	 * @param $comment_id
	 */
	public function deleteQuestionsIdByCommentId($comment_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT question_id FROM rep_robj_xvid_question WHERE comment_id = %s',
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

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_question WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_qus_text WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_answers WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_score WHERE ' . $ilDB->in('question_id', $question_ids, false, 'integer'));
	}

	/**
	 * @param $question_id
	 * @return bool
	 */
	public static function isLimitAttemptsEnabled($question_id)
	{
		global $ilDB;

		$res = $ilDB->queryF('SELECT limit_attempts FROM rep_robj_xvid_question WHERE question_id = %s',
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
		$res = $ilDB->queryF('SELECT repeat_question FROM rep_robj_xvid_question WHERE comment_id = %s',
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
		global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_answers ans
			INNER JOIN rep_robj_xvid_question qst on ans.question_id = qst.question_id 
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
	 * @param int $question_id
	 */
	public function setQuestionId($question_id)
	{
		$this->question_id = $question_id;
	}

	/**
	 * @return int
	 */
	public function getQuestionId()
	{
		return $this->question_id;
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
	 * @param int $is_jump_wrong
	 */
	public function setIsJumpWrong($is_jump_wrong)
	{
		$this->is_jump_wrong = $is_jump_wrong;
	}

	/**
	 * @return int
	 */
	public function getIsJumpWrong()
	{
		return $this->is_jump_wrong;
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

} 