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
				'question_text'  => array('text', ilUtil::stripSlashes($_POST['question_text'])),
				'feedback_correct' => array('text', ilUtil::stripSlashes($_POST['feedback_correct'])),
				'feedback_one_wrong' => array('text', ilUtil::stripSlashes($_POST['feedback_one_wrong']))
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
		
		$question_id = (int) $row['question_id'];
		
		return $question_id;
	}

	/**
	 * @param int $cid comment_id
	 * @return string
	 */
	public function getJsonForCommentId($cid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question question, rep_robj_xvid_qus_text answers 
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
		//$build_json['title'] 		  = $question_data;
		$build_json['answers'] 		  = $question_data;
		$build_json['question_text']  = $question_text;
		$build_json['type']			  = $question_type;
		$build_json['question_id']	  = $question_id;
		$build_json['question_title'] = $this->getCommentTitleByCommentId($cid);
		return json_encode($build_json);
	}

	public function getCommentTitleByCommentId($cid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT comment_title FROM rep_robj_xvid_comments WHERE comment_id = %s',
						array('integer'),
						array((int) $cid)
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
	 * @return string
	 */
	public function getJsonForQuestionId($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT * FROM rep_robj_xvid_question question, rep_robj_xvid_qus_text answers 
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
						array((int) $qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int) $row['type'];

	}

	/**
	 * @param $oid object_id
	 * @return int
	 */
	public function getQuestionCountForObject($oid)
	{
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT count(question_id) count FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
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
					'SELECT count(score.question_id)  count FROM rep_robj_xvid_comments  comments, 
							rep_robj_xvid_question questions, rep_robj_xvid_score  score
					 WHERE comments.comment_id = questions.comment_id AND questions.question_id = score.question_id 
					 		AND is_interactive = 1 AND obj_id = %s AND score.user_id = %s',
						array('integer', 'integer'),
						array((int) $oid, $uid)
		);
		$row = $ilDB->fetchAssoc($res);
		return (int) $row['count'];
	}

	/**
	 * @param int $oid object_id
	 * @return array
	 */
	public function getQuestionsOverview($oid)
	{
		global $ilDB;
		$res = $ilDB->queryF(
			'SELECT questions.question_id, score.user_id, score.points, comments.comment_id, comments.comment_title
			FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
			LEFT JOIN rep_robj_xvid_score score ON questions.question_id = score.question_id
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
			$questions[$row['question_id']]['comment_title'] = $row['comment_title'];

		}
		$results = array();
		$counter = 0;
		foreach( $questions as $key => $value )
		{
			$results[$counter]['question_id'] 	= $key;
			$results[$counter]['comment_id'] 	= $value['comment_id'];
			$results[$counter]['comment_title'] = $value['comment_title'];
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

	/**
	 * @param int $qid question_id
	 * @return int
	 */
	public function getScoreForQuestion($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB, $ilUser;

		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF('
				SELECT points FROM rep_robj_xvid_score score  
				WHERE user_id = %s AND question_id = %s',
				array('integer', 'integer'),
				array((int) $usr_id, (int) $qid)
		);
		$score = $ilDB->fetchAssoc($res);
		return (int) $score['points'];
	}

	/**
	 * @param int $qid question_id
	 * @return string
	 */
	public function getFeedbackForQuestion($qid)
	{
		$score = $this->getScoreForQuestion($qid);	
		$feedback = $this->getFeedbackByQuestionId($qid);
		//Todo add timestamp
		if(is_array($feedback) && $feedback['correct'] !== null )
		{
			if($score === 0)
			{
				return '<div class="wrong">'.$feedback['wrong'].'</div>';//$feedback['one_wrong'];
			}
			else
			{
				return '<div class="correct">'.$feedback['correct'].'</div>';//$feedback['correct'];
			}
		}
		else
		{
			if($score === 0)
			{
				return '<div class="wrong"><div>';
			}
			else
			{
				return '<div class="correct"><div>';
			}
		}
	}

	/**
	 * @param int $user_id
	 * @return array
	 */
	public function getAllNonRepeatCorrectAnswerQuestion($user_id)
	{
		global $ilDB;
		$res = $ilDB->queryF(
					'SELECT comments.comment_id as comment FROM rep_robj_xvid_comments as comments, 
						rep_robj_xvid_question as questions, rep_robj_xvid_score as score  
						WHERE comments.comment_id = questions.comment_id AND 
						questions.question_id = score.question_id 
						AND comments.repeat_question = 0 
						AND score.points = 1 
						AND score.user_id = %s'
						,
						array('integer'),
						array((int) $user_id)
		);
		$results = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[]	= $row['comment'];
		}
		return $results;
	}

	/**
	 * @param int $oid object_id 
	 * @return array
	 */
	public function getPointsForUsers($oid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB, $ilUser;
		$questions_for_object = $this->getQuestionCountForObject($oid);

		$res     = $ilDB->queryF('
			SELECT score.user_id, sum(points) points  
			FROM 	rep_robj_xvid_comments comments, 
				 	rep_robj_xvid_question questions, 
				 	rep_robj_xvid_score score  
			WHERE 	comments.comment_id   = questions.comment_id 
			AND 	questions.question_id = score.question_id 
			AND 	obj_id = %s 
			GROUP BY user_id',
			array('integer'), array((int)$oid)
		);
		$results = array();
		$counter = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$counter]['name']       = $ilUser->_lookupFullname($row['user_id']);
			$results[$counter]['user_id']    = $row['user_id'];
			$results[$counter]['answered']   = $this->getAnsweredQuestionsFromUser($oid, $row['user_id']);
			$results[$counter]['correct']    = $row['points'];
			$results[$counter]['percentage'] = round(($row['points'] / $questions_for_object) * 100, 2);
			$counter++;
		}
		
		return $results;
	}



	/**
	 * @param int $oid object_id
	 * @return array
	 */
	public function getMyPoints($oid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB, $ilUser, $lng;

		$res     = $ilDB->queryF('
			SELECT * 
				FROM rep_robj_xvid_score score, rep_robj_xvid_question questions
				WHERE score.question_id = questions.question_id
			AND 	score.user_id = %s',
			array('integer'), array( $ilUser->getId())
		);
		$answered = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$answered[$row['question_id']]  = $row['points'];
		}
		
		$res     = $ilDB->queryF('
			SELECT * FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s',
			array('integer'), array( $oid )
		);
		$results = array();
		$counter = 0;
		$correct = 0;
		$answered_questions = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$counter]['question_id'] = $row['question_id'];
			$results[$counter]['title'] = $row['comment_title'];
			if($answered[$row['question_id']] !== null)
			{
				$results[$counter]['answered'] 	= 1;
				$answered_questions++;
				$question_points = self::getScoreForQuestion($row['question_id']);
				if($question_points > 0)
				{
					$results[$counter]['points'] 	=  round(($answered[$row['question_id']] / $question_points) * 100, 2);
					if($results[$counter]['points'] == 100)
					{
						$correct++;
					}
				}
				else
				{
					$results[$counter]['points'] = 0;
				}
			}
			else
			{
				$results[$counter]['answered'] 	= 0;
				$results[$counter]['points'] 	= 0;
			}
			$counter++;
		}
		if($counter > 0)
		{
			$results[$counter]['title'] 	 = $lng->txt('summary');
			$results[$counter]['answered'] 	 = round(($answered_questions / $counter) * 100, 2) . '%';
			$results[$counter]['points']	 = round(($correct / $counter) * 100, 2);
		}

		return $results;
	}
	
	/**
	 * @param array $user_ids
	 * @param int $obj_id
	 */
	public function deleteUserResults($user_ids, $obj_id)
	{
		global $ilDB;
		
		if(!is_array($user_ids))
			return ;
		
		$question_ids = $this->getInteractiveQuestionIdsByObjId($obj_id);
		
		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_score 
		WHERE 	'. $ilDB->in('question_id', $question_ids, false, 'integer') .' 
		AND 	'. $ilDB->in('user_id', $user_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_answers 
		WHERE 	'. $ilDB->in('question_id', $question_ids, false, 'integer') .' 
		AND 	'. $ilDB->in('user_id', $user_ids, false, 'integer'));
	}
	
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
		WHERE 	'. $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('
		DELETE FROM rep_robj_xvid_answers 
		WHERE 	'. $ilDB->in('question_id', $question_ids, false, 'integer'));
	}
	
	
	/**
	 * @param int $qid question_id
	 * @return array
	 */
	public function getCorrectAnswersCountForQuestion($qid)
	{
		/**
		 * @var $ilDB   ilDB
		 */

		global $ilDB;
		
		$res = $ilDB->queryF('
			SELECT * 
			FROM rep_robj_xvid_comments comments,
				 rep_robj_xvid_question questions, 
				 rep_robj_xvid_qus_text answers 
			WHERE comments.comment_id = questions.comment_id 
			AND questions.question_id = answers.question_id 
			AND is_interactive = 1 
			AND correct = 1 
			AND questions.question_id = %s',
		array('integer'), array((int) $qid)
		);
		$question = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$question[] = $row['answer_id'];
		}
		return $question;
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
					'SELECT * FROM rep_robj_xvid_question WHERE question_id = %s',
						array('integer'),
						array((int) $qid)
		);
		$row = $ilDB->fetchAssoc($res);
		return $row['question_text'];

	}

	/**
	 * @param int $qid question_id
	 * @return array
	 */
	public function getFeedbackByQuestionId($qid)
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
		return array('correct' => $row['feedback_correct'] , 'wrong' => $row['feedback_one_wrong']);

	}

	/**
	 * @param $int qid question_id
	 * @param $answers
	 */
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

	/**
	 * @param $qid
	 */
	public function removeAnswer($qid)
	{
		global $ilDB, $ilUser;
		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_answers WHERE question_id = %s AND user_id = %s',
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
		$usr_id	= $ilUser->getId();
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_score WHERE question_id = %s AND user_id = %s',
			array('integer', 'integer'), array($qid, $usr_id));
		$ilDB->fetchAssoc($res);
	}

	/**
	 * @param $qid
	 */
	public function deleteQuestion($qid)
	{
		global $ilDB;
		
		//@todo maybe select all question_ids for current comment_id first and perform delete for all found question_ids ... . 
		
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_question WHERE question_id = %s',
			array('integer'), array($qid));
		
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_qus_text WHERE question_id = %s',
			array('integer'), array($qid));
		
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_answers WHERE question_id = %s',
			array('integer'), array($qid));
		
		$ilDB->manipulateF('DELETE FROM rep_robj_xvid_score WHERE question_id = %s',
			array('integer'), array($qid));
		
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

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_question WHERE '. $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_qus_text WHERE '. $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_answers WHERE '. $ilDB->in('question_id', $question_ids, false, 'integer'));

		$ilDB->manipulate('DELETE FROM rep_robj_xvid_score WHERE '. $ilDB->in('question_id', $question_ids, false, 'integer'));
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