<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionStatistics
 */
class SimpleChoiceQuestionStatistics
{

	public function getQuestionCountForObject(int $oid): int
	{
        global $ilDB;

		$res = $ilDB->queryF(
			'SELECT count(question_id) count FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s',
			['integer'],
			[(int)$oid]
		);
		$row = $ilDB->fetchAssoc($res);
		return (int)$row['count'];
	}

    /**
	 * @throws ilWACException
	 * @return array<int, array{name: mixed, user_id: mixed, answered: int, correct: mixed, neutral_questions: mixed, percentage: int|float}>
	 */
	public function getPointsForUsers(int $oid): array
	{

        global $ilDB;

		$questions_for_object = $this->getQuestionCountForObject($oid);

		$res     = $ilDB->queryF('
			SELECT score.user_id, sum(points) points, sum(neutral_answer) as neutral 
			FROM 	rep_robj_xvid_comments comments, 
				 	rep_robj_xvid_question questions, 
				 	rep_robj_xvid_score score  
			WHERE 	comments.comment_id   = questions.comment_id 
			AND 	questions.question_id = score.question_id 
			AND 	obj_id = %s 
			GROUP BY user_id',
			['integer'], [(int)$oid]
		);

		$results = [];
		$counter = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$counter]['name']       = ilUserUtil::getNamePresentation($row['user_id']);
			$results[$counter]['user_id']    = $row['user_id'];
			$results[$counter]['answered']   = $this->getAnsweredQuestionsFromUser($oid, $row['user_id']);
			$results[$counter]['correct']    = $row['points'];
			$results[$counter]['neutral_questions']    = $row['neutral'];
			$answer_with_point               = $questions_for_object - $row['neutral'];
			if($answer_with_point == 0)
			{
				$percentage = 100;
			}
			else
			{
				$percentage = round(($row['points'] / ($answer_with_point)) * 100, 2);
			}
			$results[$counter]['percentage'] = $percentage;
			$counter++;
		}

		return $results;
	}

    /**
	 * @param $oid
	 * @throws ilWACException
	 * @return array<string, mixed[]>
	 */
	public function getScoreForAllQuestionsAndAllUser(int $oid): array
	{
		$questions_list  = $this->getQuestionIdsForObject($oid);
		$questions_count = $this->getQuestionCountForObject($oid);
        global $ilDB;

		$res          = $ilDB->queryF('
			SELECT score.user_id, points,questions.question_id, neutral_answer
			FROM 	rep_robj_xvid_comments comments, 
				 	rep_robj_xvid_question questions, 
				 	rep_robj_xvid_score score  
			WHERE 	comments.comment_id   = questions.comment_id 
			AND 	questions.question_id = score.question_id 
			AND 	obj_id = %s  ORDER BY comments.comment_time',
			['integer'], [(int)$oid]
		);
		$return_value = ['users' => [], 'question' => [], 'answers' => []];
		$return_sums  = [];
		$neutral = 0;
		while($row = $ilDB->fetchAssoc($res))
		{
			$name = ilUserUtil::getNamePresentation($row['user_id']);
			$id                                 = $row['user_id'];
			$return_value['users'][$id]['name'] = $name;
			if(!isset($return_sums[$id]['answered']))
			{
				$return_sums[$id]['answered'] = 0;
				$return_sums[$id]['sum']      = 0;
			}
			foreach($questions_list as $key => $value)
			{
				if($key == $row['question_id'])
				{
					if($row['neutral_answer'] == 1)
					{
						$points = 0;
						$return_value['users'][$id][$key] = 1;
						$neutral++;
					}
					else
					{
						$points = $row['points'];
						$return_value['users'][$id][$key] = $points;
					}

					$return_sums[$id]['answered']++;
					$return_sums[$id]['sum'] += $points;
					$return_value['question'][$key]   = $value;

				}
				if(!isset($return_value['users'][$id][$key]))
				{
					$return_value['users'][$id][$key] = '-';
					$return_value['question'][$key]   = $value;
				}
			}
		}
		foreach($return_sums as $key => $value)
		{
			if($value['answered'] > 0)
			{
                $percentage = round(($value['answered'] / $questions_count) * 100, 2);
				$return_value['users'][$key]['answerd'] = $percentage . '%';
			}
			else
			{
				$return_value['users'][$key]['answerd'] = '0%';
			}

			if($value['answered'] > 0 && ($questions_count - $neutral) > 0)
			{
                $percentage = round(($value['sum'] / ($questions_count - $neutral)) * 100, 2);
                if($percentage > 100) {
                    $percentage = 100;
                }
				$return_value['users'][$key]['sum'] = $percentage . '%';
			}
			else
			{
				$return_value['users'][$key]['sum'] = '0%';
			}

		}

		$res = $ilDB->queryF('SELECT answers.user_id, text.answer, text.correct, answers.answer_id, questions.question_id
			FROM 	rep_robj_xvid_question questions,
					rep_robj_xvid_answers answers,
					rep_robj_xvid_comments comments,
					rep_robj_xvid_qus_text text
			WHERE   questions.question_id = answers.question_id
			AND 	comments.comment_id   = questions.comment_id 
			AND 	text.answer_id = answers.answer_id
			AND 	obj_id = %s  ORDER BY comments.comment_time',
			['integer'], [(int)$oid]);
		while($row = $ilDB->fetchAssoc($res))
		{
            if(isset($return_value['answers'][$row['user_id']])) {
                $return_value['answers'][$row['user_id']][$row['question_id']] .= chr(13) . $row['answer'];
            }

		}
		return $return_value;
	}

	/**
	 * @return array<int|string, mixed>
	 */
	public function getQuestionIdsForObject(int $oid): array
	{
        global $ilDB;

		$result_set = [];
		$res        = $ilDB->queryF(
			'SELECT question_id, comment_title FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s ORDER BY comment_time',
			['integer'],
			[(int)$oid]
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$title = $row['comment_title'];
			if($title == null)
			{
				$title = $row['question_id'];
			}
			$result_set[$row['question_id']] = $title;
		}
		return $result_set;
	}

	/**
	 * @param int $oid object_id
	 * @return array<int, array{question_id: int|string, comment_id: mixed, comment_title: mixed, answered: int, correct: string|float|int, neutral_question: mixed, percentage: int|string|float}>
	 */
	public function getQuestionsOverview(int $oid): array
	{
        global $ilDB;

		$res       = $ilDB->queryF(
			'SELECT questions.question_id, questions.neutral_answer, score.user_id, score.points, comments.comment_id, comments.comment_title
			FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
			LEFT JOIN rep_robj_xvid_score score ON questions.question_id = score.question_id
			WHERE comments.comment_id = questions.comment_id
			AND is_interactive =1
			AND obj_id = %s',
			['integer'],
			[(int)$oid]
		);
		$questions = [];
        while($row = $ilDB->fetchAssoc($res))
        {
            if($row['points'] == null)
            {
                $questions[$row['question_id']]['answered'] = 0;
                $questions[$row['question_id']]['correct']  = 0;
            }
            else if($row['points'] !== null)
            {
                if( ! array_key_exists($row['question_id'], $questions)) {
                    $questions[$row['question_id']]['answered'] = 1;
                    $questions[$row['question_id']]['correct']  = 0;
                }
            }
            else
            {
                $questions[$row['question_id']]['answered']++;
                $questions[$row['question_id']]['correct'] += $row['points'];
            }
            $questions[$row['question_id']]['comment_id']    = $row['comment_id'];
            $questions[$row['question_id']]['comment_title'] = $row['comment_title'];
            $questions[$row['question_id']]['neutral_answer'] = $row['neutral_answer'];

        }
		$results = [];
		$counter = 0;
		foreach($questions as $key => $value)
		{
			$results[$counter]['question_id']   = $key;
			$results[$counter]['comment_id']    = $value['comment_id'];
			$results[$counter]['comment_title'] = $value['comment_title'];
			$results[$counter]['answered']      = $value['answered'];
			$results[$counter]['correct']       = $value['correct'];
			$results[$counter]['neutral_question'] = $value['neutral_answer'];
			if($value['neutral_answer'] == 1)
			{
				$results[$counter]['percentage'] = '';
				$results[$counter]['correct'] = '';
			}
			else
			{
				if($value['answered'] > 0)
				{
					$results[$counter]['percentage'] = round(($value['correct'] / $value['answered']) * 100, 2);
                }
				else
				{
					$results[$counter]['percentage'] = 0;
				}
			}

			
			$counter++;
		}
		return $results;
	}

	/**
	 * @param $oid
	 * @param $uid
	 */
	public function getAnsweredQuestionsFromUser($oid, $uid): int
	{
        global $ilDB;

		$res = $ilDB->queryF(
			'SELECT count(score.question_id)  count FROM rep_robj_xvid_comments  comments, 
							rep_robj_xvid_question questions, rep_robj_xvid_score  score
					 WHERE comments.comment_id = questions.comment_id AND questions.question_id = score.question_id 
					 		AND is_interactive = 1 AND obj_id = %s AND score.user_id = %s',
			['integer', 'integer'],
			[(int)$oid, $uid]
		);
		$row = $ilDB->fetchAssoc($res);
		return (int)$row['count'];
	}

	/**
	 * @param $question_id
	 * @return array<int|string, mixed>
	 */
	public function getResponseFrequency($question_id): array
	{
        global $ilDB;

		$res          = $ilDB->queryF(
			'SELECT rep_robj_xvid_answers.answer_id, count(rep_robj_xvid_answers.answer_id) AS counter FROM rep_robj_xvid_question
				LEFT JOIN rep_robj_xvid_qus_text ON rep_robj_xvid_qus_text.question_id = rep_robj_xvid_question.question_id 
				RIGHT JOIN rep_robj_xvid_answers ON rep_robj_xvid_qus_text.answer_id = rep_robj_xvid_answers.answer_id
				WHERE  rep_robj_xvid_question.question_id = %s GROUP BY rep_robj_xvid_answers.answer_id',
			['integer'],
			[(int)$question_id]
		);
		$answer_stats = [];
		while($row = $ilDB->fetchAssoc($res))
		{
			$answer_stats[$row['answer_id']] = $row['counter'];
		}
		return $answer_stats;

	}
}