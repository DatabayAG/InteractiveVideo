<?php

class SimpleChoiceQuestion {
	const SINGLE_CHOICE = 0;
	const MULTIPLE_CHOICE = 1;
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
	 * @var integer
	 */
	protected $type;

	/**
	 * @param int $question_id
	 */
	public function __construct($question_id = 0)
	{
		if($question_id > 0)
		{
			$this->setQuestionId($question_id);
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
					'SELECT * FROM rep_robj_xvid_question as question, rep_robj_xvid_qus_text as answers 
								WHERE question.question_id = %s AND question.question_id = answers.question_id',
						array('integer'),
						array($this->getQuestionId())
		);
		$row = $ilDB->fetchAssoc($res);

	}

	public function create()
	{
		/**
		 * @var $ilDB   ilDB
		 * @var $ilUser ilObjUser
		 */
		global $ilDB;
		$question_id = $ilDB->nextId('rep_robj_xvid_question');
		if((int) $_POST['type'] === 0)
		{
			$this->setType(self::SINGLE_CHOICE);
		}
		else
		{
			$this->setType(self::MULTIPLE_CHOICE);
		}
		$ilDB->insert('rep_robj_xvid_question',
			array(
				'question_id'	 => array('integer', $question_id),
				'comment_id'     => array('integer', (int) $_POST['comment_id']),
				'type'         	 => array('integer', (int) $_POST['question_type']),
				'question_text'  => array('text', ilUtil::stripSlashes($_POST['question_text']))
			));
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
					'answer_id'		 => array('integer', $answer_id),
					'question_id'	 => array('integer', $question_id),
					'answer'     	 => array('text',  	 $value),
					'correct'        => array('integer', $correct)
				));
		}
	}

	public function checkInput()
	{
		$status = true;
		$correct = 0;

		if((int) $_POST['type'] === 0)
		{
			$this->setType(self::SINGLE_CHOICE);
		}
		else
		{
			$this->setType(self::MULTIPLE_CHOICE);
		}
		
		$question_text = ilUtil::stripSlashes($_POST['question_text']);
		
		if($question_text === '')
		{
			$status =  false;
		}
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
		
		return $status;
	}
	
	public function existQuestionForCommentId($comment_id)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		
		global $ilDB;
		$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_question WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		
		$question_id = (int) $row['question_id'];
		
		return $question_id;
	}

	public function getJsonForCommentId($cid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question as question, rep_robj_xvid_qus_text as answers 
								WHERE question.comment_id = %s AND question.question_id = answers.question_id',
						array('integer'),
						array((int) $cid)
		);

		$counter = 0;
		$question_data 	= array();
		$question_text 	= '';
		$question_type 	= 0;
		$question_id	= 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_data[$counter]['answer']     	= $row['answer'];
			$question_data[$counter]['answer_id']  	= $row['answer_id'];
			$question_data[$counter]['correct']    	= $row['correct'];
			$question_text						   	= $row['question_text'];
			$question_type						   	= $row['type'];
			$question_id							= $row['question_id'];
			$counter++;
		}
		$build_json = array();
		$build_json['answers'] 		= $question_data;
		$build_json['question_text']= $question_text;
		$build_json['type']			= $question_type;
		$build_json['question_id']	= $question_id;
		return json_encode($build_json);
	}

	public function getJsonForQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question as question, rep_robj_xvid_qus_text as answers 
								WHERE question.question_id = %s AND question.question_id = answers.question_id',
						array('integer'),
						array((int) $qid)
		);

		$counter = 0;
		$question_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_data[$counter]['answer']     = $row['answer'];
			$question_data[$counter]['answer_id']  = $row['answer_id'];
			$question_data[$counter]['correct']    = $row['correct'];
			$counter++;
		}
		return json_encode($question_data);
	}

	public function getTypeByQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question WHERE question_id = %s',
						array('integer'),
						array((int) $qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int) $row['type'];

	}

	public function getQuestionCountForObject($oid)
	{
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT count(question_id) as count FROM rep_robj_xvid_comments as comments, rep_robj_xvid_question as questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s',
						array('integer'),
						array((int) $oid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int) $row['count'];
	}

	public function getAnsweredQuestionsFromUser($oid, $uid)
	{
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT count(score.question_id) as count FROM rep_robj_xvid_comments as comments, 
							rep_robj_xvid_question as questions, rep_robj_xvid_score as score
					 WHERE comments.comment_id = questions.comment_id AND questions.question_id = score.question_id 
					 		AND is_interactive = 1 AND obj_id = %s AND score.user_id = %s',
						array('integer', 'integer'),
						array((int) $oid, $uid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int) $row['count'];
	}

	public function getQuestionsOverview($oid)
	{
		global $ilDB;
		$res = $ilDB->queryF(
								'SELECT questions.question_id, score.user_id, score.points, comments.comment_id, comments.comment_text
								FROM rep_robj_xvid_comments AS comments, rep_robj_xvid_question AS questions
								LEFT JOIN rep_robj_xvid_score AS score ON questions.question_id = score.question_id
								WHERE comments.comment_id = questions.comment_id
								AND is_interactive =1
								AND obj_id = %s',
						array('integer'),
						array((int) $oid)
		);
		$questions = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			if( $row['points'] == null )
			{
				$questions[$row['question_id']]['answered'] = 0;
				$questions[$row['question_id']]['correct']  = 0;
			}
			else
			{
				$questions[$row['question_id']]['answered']++;
				$questions[$row['question_id']]['correct'] += $row['points'];
			}
			$questions[$row['question_id']]['comment_id'] = $row['comment_id'];
			$questions[$row['question_id']]['comment_text'] = $row['comment_text'];

		}
		$results = array();
		$counter = 0;
		foreach( $questions as $key => $value )
		{
			$results[$counter]['question_id'] 	= $key;
			$results[$counter]['comment_id'] 	= $value['comment_id'];
			$results[$counter]['comment_text'] 			= $value['comment_text'];
			$results[$counter]['answered'] 		= $value['answered'];
			$results[$counter]['correct'] 		= $value['correct'];
			if($value['answered'] > 0)
			{
				$results[$counter]['percentage'] = round(($value['correct']/ $value['answered']) * 100, 2);
			}
			else
			{
				$results[$counter]['percentage'] = 0;
			}
			$counter++;
		}
		return $results;

	}
	
	public function getFeedbackForQuestion($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB, $ilUser;
		
		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF(
					'SELECT points  FROM rep_robj_xvid_score as score  WHERE 
					 user_id = %s AND question_id = %s',
						array('integer', 'integer'),
						array((int) $usr_id, (int) $qid)
		);
		$score = $ilDB->fetchAssoc($res);
		
		//Todo add feedback to database and replace placeholder
		$feedback = '';
		if($feedback !== '')
		{
			if((int) $score['points'] === 0)
			{
				return 'Long Feedback Placeholder WRONG!';
			}
			else
			{
				return 'Long Feedback Placeholder CORRECT!';
			}
		}
		else
		{
			if((int) $score['points'] === 0)
			{
				return 'placeholder correct';
			}
			else
			{
				return 'placeholder wrong';
			}
		}
	}
	
	public function getPointsForUsers($oid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB, $ilUser;
		$questions_for_object = $this->getQuestionCountForObject($oid);
		
		$res = $ilDB->queryF(
					'SELECT score.user_id, sum(points) as points  FROM rep_robj_xvid_comments as comments, rep_robj_xvid_question as questions, 
					 rep_robj_xvid_score as score  WHERE comments.comment_id = questions.comment_id 
					 AND questions.question_id = score.question_id AND obj_id =  %s GROUP BY user_id ',
						array('integer'),
						array((int) $oid)
		);
		$results = array();
		$counter = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$counter]['name']		= $ilUser->_lookupFullname($row['user_id']);
			$results[$counter]['user_id'] 	= $row['user_id'];
			$results[$counter]['answered']	= $this->getAnsweredQuestionsFromUser($oid, $row['user_id']);
			$results[$counter]['correct'] 	= $row['points'];
			$results[$counter]['percentage']= round(($row['points']/$questions_for_object) * 100, 2);
			$counter ++ ;
		}
		
		return $results;
	}
	
	public function getCorrectAnswersCountForQuestion($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_comments as comments, rep_robj_xvid_question as questions, 
					 rep_robj_xvid_qus_text as answers  WHERE comments.comment_id = questions.comment_id 
					 AND questions.question_id = answers.question_id AND  is_interactive = 1 AND correct = 1 AND questions.question_id = %s',
						array('integer'),
						array((int) $qid)
		);
		$question = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$question[] = $row['answer_id'];
		}
		return $question;
	}
	
	public function getQuestionTextQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question WHERE question_id = %s',
						array('integer'),
						array((int) $qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return $row['question_text'];

	}
	
	public function saveAnswer($qid, $answers)
	{
		global $ilDB, $ilUser;
		
		$usr_id	= $ilUser->getId();
		$type 	= $this->getTypeByQuestionId($qid);
		
		$this->removeAnswer($qid);
		$correct_answers = $this->getCorrectAnswersCountForQuestion($qid);
		$points = 0;
		
		if($type === self::SINGLE_CHOICE)
		{
			if(in_array($answers[0], $correct_answers))
			{
				$points = 1;
			}
			$ilDB->insert('rep_robj_xvid_answers',
				array(
					'question_id'	 => array('integer', $qid),
					'user_id'     	 => array('integer', $usr_id),
					'answer_id'      => array('integer', (int) $answers[0])
				));
			$ilDB->insert('rep_robj_xvid_score',
			array(
				'question_id'	 => array('integer', $qid),
				'user_id'     	 => array('integer', $usr_id),
				'points'      	 => array('integer', $points)
			));
		}
		else
		{
			$points = 1;
			foreach($answers as $key => $value)
			{
				$ilDB->insert('rep_robj_xvid_answers',
					array(
						'question_id'	 => array('integer', $qid),
						'user_id'     	 => array('integer', $usr_id),
						'answer_id'      => array('integer', (int) $value)
					));
				if( sizeof($answers) !== sizeof($correct_answers) || !in_array($value, $correct_answers))
				{
					$points = 0;
				}
			
			}
			$ilDB->insert('rep_robj_xvid_score',
				array(
					'question_id'	 => array('integer', $qid),
					'user_id'     	 => array('integer', $usr_id),
					'points'      	 => array('integer', $points)
				));
		}
	}

	public function removeAnswer($qid)
	{
		global $ilDB, $ilUser;
		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_answers WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$ilDB->fetchAssoc($res);
		$this->removeScore($qid);
	}

	public function removeScore($qid)
	{
		global $ilDB, $ilUser;
		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_score WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$ilDB->fetchAssoc($res);
	}
	
	public function deleteQuestion($qid)
	{
		global $ilDB;

		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_question WHERE question_id = %s',
			array('integer'), array($qid));
		$ilDB->fetchAssoc($res);
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_qus_text WHERE question_id = %s',
			array('integer'), array($qid));
		$ilDB->fetchAssoc($res);
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_answers WHERE question_id = %s',
			array('integer'), array($qid));
		$ilDB->fetchAssoc($res);
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_score WHERE question_id = %s',
			array('integer'), array($qid));
		$ilDB->fetchAssoc($res);
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

} 