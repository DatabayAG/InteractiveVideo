<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
class SimpleChoiceQuestionAjaxHandler {

    /**
     * @param int $qid question_id
     * @return string
     */
    public function getFeedbackForQuestion($qid)
    {
        $scoring  = new SimpleChoiceQuestionScoring();
        $score    = $scoring->getScoreForQuestionOnUserId($qid);
        $feedback = $scoring->getFeedbackByQuestionId($qid);
        $json     = array();
        if(is_array($feedback))
        {
            if($score === 0)
            {
                if($feedback['wrong'] === null)
                {
                    $feedback['wrong'] = '';
                }
                $json['html']     = '<div class="wrong">' . $feedback['feedback_one_wrong'] . '</div>';
                $json['is_timed'] = $feedback['is_jump_wrong'];
                $json['time']     = $feedback['jump_wrong_ts'];
            }
            else
            {
                if($feedback['correct'] === null)
                {
                    $feedback['correct'] = '';
                }
                $json['html']     = '<div class="correct">' . $feedback['feedback_correct'] . '</div>';
                $json['is_timed'] = $feedback['is_jump_correct'];
                $json['time']     = $feedback['jump_correct_ts'];
            }
        }
        return json_encode($json);
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
        $res = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_question question, 
				  rep_robj_xvid_qus_text answers 
			WHERE question.comment_id = %s 
			AND   question.question_id = answers.question_id',
            array('integer'), array((int)$cid)
        );

        $counter       = 0;
        $question_data = array();
        $question_text = '';
        $question_type = 0;
        $question_id   = 0;
        while($row = $ilDB->fetchAssoc($res))
        {
            $question_data[$counter]['answer']    = $row['answer'];
            $question_data[$counter]['answer_id'] = $row['answer_id'];
            $question_data[$counter]['correct']   = $row['correct'];
            $question_text                        = $row['question_text'];
            $question_type                        = $row['type'];
            $question_id                          = $row['question_id'];
            $limit_attempts                       = $row['limit_attempts'];
            $is_jump_correct                      = $row['is_jump_correct'];
            $jump_correct_ts                      = $row['jump_correct_ts'];
            $is_jump_wrong                        = $row['is_jump_wrong'];
            $jump_wrong_ts                        = $row['jump_wrong_ts'];
            $repeat_question                      = $row['repeat_question'];

            $counter++;
        }
        $build_json = array();
        //$build_json['title'] 		  = $question_data;
        $build_json['answers']         = $question_data;
        $build_json['question_text']   = $question_text;
        $build_json['type']            = $question_type;
        $build_json['question_id']     = $question_id;
        $simple_choice                 = new SimpleChoiceQuestion();
        $build_json['question_title']  = $simple_choice->getCommentTitleByCommentId($cid);
        $build_json['limit_attempts']  = $limit_attempts;
        $build_json['is_jump_correct'] = $is_jump_correct;
        $build_json['jump_correct_ts'] = $jump_correct_ts;
        $build_json['is_jump_wrong']   = $is_jump_wrong;
        $build_json['jump_wrong_ts']   = $jump_wrong_ts;
        $build_json['repeat_question'] = $repeat_question;

        return json_encode($build_json);
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

        $res = $ilDB->queryF('SELECT answer_id, answer, correct FROM rep_robj_xvid_qus_text WHERE question_id = %s',
            array('integer'), array((int)$qid));

        while($row = $ilDB->fetchAssoc($res))
        {
            $question_data[] = $row;
        }

        return json_encode($question_data);
    }
}