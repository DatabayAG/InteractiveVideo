<?php
/**
 * Created by PhpStorm.
 * User: gvollbach
 * Date: 27.05.15
 * Time: 14:55
 */

class SimpleChoiceQuestionStatistics {

    /**
     * @param int $oid
     * @return int
     */
    public function getQuestionCountForObject($oid)
    {
        global $ilDB;
        $res = $ilDB->queryF(
            'SELECT count(question_id) count FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s',
            array('integer'),
            array((int)$oid)
        );
        $row = $ilDB->fetchAssoc($res);
        return (int)$row['count'];
    }

    /**
     * @param int $oid
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
     * @param $oid
     * @return array
     */
    public function getScoreForAllQuestionsAndAllUser($oid)
    {
        $questions_list  = $this->getQuestionIdsForObject($oid);
        $questions_count = $this->getQuestionCountForObject($oid);
        /**
         * @var $ilDB   ilDB
         */

        global $ilDB, $ilUser;
        $res          = $ilDB->queryF('
			SELECT score.user_id, points,questions.question_id  
			FROM 	rep_robj_xvid_comments comments, 
				 	rep_robj_xvid_question questions, 
				 	rep_robj_xvid_score score  
			WHERE 	comments.comment_id   = questions.comment_id 
			AND 	questions.question_id = score.question_id 
			AND 	obj_id = %s  ORDER BY question_id',
            array('integer'), array((int)$oid)
        );
        $return_value = array('users' => array(), 'question' => array());
        $return_sums  = array();
        while($row = $ilDB->fetchAssoc($res))
        {
            $name                               = $ilUser->_lookupFullname($row['user_id']);
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
                    $points = $row['points'];
                    $return_sums[$id]['answered']++;
                    $return_sums[$id]['sum'] += $points;
                    $return_value['users'][$id][$key] = $points;
                    $return_value['question'][$key]   = $value;

                }
                if(!isset($return_value['users'][$id][$key]))
                {
                    $return_value['users'][$id][$key] = '-';
                }
            }
        }

        foreach($return_sums as $key => $value)
        {
            $return_value['users'][$key]['answerd'] = $value['answered'] . '/' . $questions_count;
            $return_value['users'][$key]['sum']     = $value['sum'] . '/' . $questions_count;
        }
        return $return_value;
    }
    
    /**
     * @param int $oid
     * @return array
     */
    public function getQuestionIdsForObject($oid)
    {
        global $ilDB;
        $result_set = array();
        $res        = $ilDB->queryF(
            'SELECT question_id, comment_title FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
					 WHERE comments.comment_id = questions.comment_id AND  is_interactive = 1 AND obj_id = %s ORDER BY question_id',
            array('integer'),
            array((int)$oid)
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
     * @return array
     */
    public function getQuestionsOverview($oid)
    {
        global $ilDB;
        $res       = $ilDB->queryF(
            'SELECT questions.question_id, score.user_id, score.points, comments.comment_id, comments.comment_title
			FROM rep_robj_xvid_comments comments, rep_robj_xvid_question questions
			LEFT JOIN rep_robj_xvid_score score ON questions.question_id = score.question_id
			WHERE comments.comment_id = questions.comment_id
			AND is_interactive =1
			AND obj_id = %s',
            array('integer'),
            array((int)$oid)
        );
        $questions = array();
        while($row = $ilDB->fetchAssoc($res))
        {
            if($row['points'] == null)
            {
                $questions[$row['question_id']]['answered'] = 0;
                $questions[$row['question_id']]['correct']  = 0;
            }
            else
            {
                $questions[$row['question_id']]['answered']++;
                $questions[$row['question_id']]['correct'] += $row['points'];
            }
            $questions[$row['question_id']]['comment_id']    = $row['comment_id'];
            $questions[$row['question_id']]['comment_title'] = $row['comment_title'];

        }
        $results = array();
        $counter = 0;
        foreach($questions as $key => $value)
        {
            $results[$counter]['question_id']   = $key;
            $results[$counter]['comment_id']    = $value['comment_id'];
            $results[$counter]['comment_title'] = $value['comment_title'];
            $results[$counter]['answered']      = $value['answered'];
            $results[$counter]['correct']       = $value['correct'];
            if($value['answered'] > 0)
            {
                $results[$counter]['percentage'] = round(($value['correct'] / $value['answered']) * 100, 2);
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
     * @param $oid
     * @param $uid
     * @return int
     */
    public function getAnsweredQuestionsFromUser($oid, $uid)
    {
        global $ilDB;
        $res = $ilDB->queryF(
            'SELECT count(score.question_id)  count FROM rep_robj_xvid_comments  comments, 
							rep_robj_xvid_question questions, rep_robj_xvid_score  score
					 WHERE comments.comment_id = questions.comment_id AND questions.question_id = score.question_id 
					 		AND is_interactive = 1 AND obj_id = %s AND score.user_id = %s',
            array('integer', 'integer'),
            array((int)$oid, $uid)
        );
        $row = $ilDB->fetchAssoc($res);
        return (int)$row['count'];
    }
}