<?php
/**
 * Created by PhpStorm.
 * User: gvollbach
 * Date: 27.03.15
 * Time: 11:47
 */

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
	 * @param int $comment_id
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

		/*$this->setCommentText($row['comment_text']);
		$this->setCommentTime($row['comment_time']);
		$this->setInteractive((bool)$row['is_interactive']);
		$this->setIsTutor((bool)$row['is_tutor']);
		$this->setUserId($row['user_id']);
		*/
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
			if(array_key_exists($key, ilUtil::stripSlashesRecursive($_POST['correct'])))
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
		$question_data = array();
		$question_text = '';
		$question_type = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_data[$counter]['answer']     = $row['answer'];
			$question_data[$counter]['answer_id']  = $row['answer_id'];
			$question_data[$counter]['correct']    = $row['correct'];
			$question_text						   = $row['question_text'];;
			$question_type						   = $row['type'];
			$counter++;
		}
		$build_json = array();
		$build_json['answers'] 		= $question_data;
		$build_json['question_text']= $question_text;
		$build_json['type']			= $question_type;
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
	
	public function deleteQuestion($qid)
	{
		global $ilDB;

		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_question WHERE question_id = %s',
			array('integer'), array($qid));
		$ilDB->fetchAssoc($res);
		$res = $ilDB->queryF('DELETE FROM rep_robj_xvid_qus_text WHERE question_id = %s',
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