<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionScoring
 */
class SimpleChoiceQuestionScoring
{

	/**
	 * @param int $qid question_id
	 * @return int
	 */
	public function getScoreForQuestionOnUserId($qid)
	{
        /**
         * @var $ilDB ilDBInterface
         */

		global $ilDB, $ilUser;

		$usr_id = $ilUser->getId();
		$res    = $ilDB->queryF('
				SELECT points FROM rep_robj_xvid_score score  
				WHERE user_id = %s AND question_id = %s',
			array('integer', 'integer'),
			array((int)$usr_id, (int)$qid)
		);
		$score  = $ilDB->fetchAssoc($res);
		return (int)$score['points'];
	}

	/**
	 * @param int $qid question_id
	 * @return array
	 */
	public function getFeedbackByQuestionId($qid)
	{
        /**
         * @var $ilDB ilDBInterface
         */

		global $ilDB;
		$res = $ilDB->queryF(
			'SELECT * FROM rep_robj_xvid_question WHERE question_id = %s',
			array('integer'),
			array((int)$qid)
		);

		return $ilDB->fetchAssoc($res);
	}

	/**
	 * @param int $oid object_id
	 * @return array
	 */
	public function getMyPoints($oid)
	{
        /**
         * @var $ilDB ilDBInterface
         */

		global $ilDB, $ilUser, $lng;

		$res      = $ilDB->queryF('
			SELECT * 
				FROM rep_robj_xvid_score score, rep_robj_xvid_question questions
				WHERE score.question_id = questions.question_id
			AND 	score.user_id = %s',
			array('integer'), array($ilUser->getId())
		);
		$answered = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$answered[$row['question_id']] = $row['points'];
		}

		$res                = $ilDB->queryF('SELECT * FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s',
			array('integer'), array($oid)
		);
		$results            = array();
		$counter            = 0;
		$correct            = 0;
		$answered_questions = 0;
		$neutral            = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$counter]['question_id'] = $row['question_id'];
			$results[$counter]['title']       = $row['comment_title'];
			$results[$counter]['neutral_answer'] = $row['neutral_answer'];
			if($answered[$row['question_id']] !== null)
			{
				$results[$counter]['answered'] = 1;
				$answered_questions++;
				$question_points = $this->getScoreForQuestionOnUserId($row['question_id']);
				if($question_points > 0)
				{
					$results[$counter]['points'] = round(($answered[$row['question_id']] / $question_points) * 100, 2);
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
				$results[$counter]['answered'] = 0;
				$results[$counter]['points']   = 0;
			}
			if($results[$counter]['neutral_answer'] == 1)
			{
				$results[$counter]['points']   = '';
				$neutral++;

			}
			$counter++;
		}
		if($counter > 0)
		{
			$results[$counter]['title']    = $lng->txt('summary');
			$results[$counter]['answered'] = round(($answered_questions / $counter) * 100, 2) . '%';
			if($counter - $neutral > 0)
			{
				$results[$counter]['points']   = round(($correct / ($counter - $neutral)) * 100, 2);
			}
			else
			{
				$results[$counter]['points']   = 0;
			}

		}
		$results[$counter]['neutral_answer'] = '';
		return $results;
	}

	/**
	 * @param int $qid question_id
	 * @return array
	 */
	public function getCorrectAnswersForQuestion($qid)
	{
        /**
         * @var $ilDB ilDBInterface
         */

		global $ilDB;

		$res      = $ilDB->queryF('
			SELECT * 
			FROM rep_robj_xvid_comments comments,
				 rep_robj_xvid_question questions, 
				 rep_robj_xvid_qus_text answers 
			WHERE comments.comment_id = questions.comment_id 
			AND questions.question_id = answers.question_id 
			AND is_interactive = 1 
			AND correct = 1 
			AND questions.question_id = %s',
			array('integer'), array((int)$qid)
		);
		$question = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$question[] = $row['answer_id'];
		}
		return $question;
	}
}