<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

/**
 * Class SimpleChoiceQuestionAjaxHandler
 */
class SimpleChoiceQuestionAjaxHandler
{
    /**
     * @param $feedback_ref_id
     * @param $json
     * @return mixed
     * @throws ilDatabaseException
     * @throws ilObjectNotFoundException
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	private function appendFeedback($feedback_ref_id, $json)
	{
		if($feedback_ref_id > 0)
		{
			$json['feedback_link'] = $this->getLinkIfReadAccessForObjectByRefId($feedback_ref_id);
			$obj                   = ilObjectFactory::getInstanceByRefId($feedback_ref_id);
			$json['feedback_icon'] = ilObject::_getIcon($obj->getid());
		}
		return $json;
	}

    /**
     * @param $qid
     * @return false|string
     * @throws ilDatabaseException
     * @throws ilObjectNotFoundException
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	public function getFeedbackForQuestion($qid)
	{
		$scoring  = new SimpleChoiceQuestionScoring();
		$score    = $scoring->getScoreForQuestionOnUserId($qid);
		$feedback = $scoring->getFeedbackByQuestionId($qid);
		$json     = [];
        $json['html'] = '';
		$correct = false;
		if(is_array($feedback))
		{
			if(isset($feedback['neutral_answer']) && $feedback['neutral_answer'] != 1)
			{
					if($score === 0)
					{
						if(isset($feedback['wrong']) && $feedback['wrong'] === null)
						{
							$feedback['wrong'] = '';
						}
						if(isset($feedback['show_wrong_icon']) && $feedback['show_wrong_icon'])
						{
							$start_div = '<div class="wrong">';
						}
						else
						{
							$start_div = '<div class="neutral">';
						}
						if(isset($feedback['feedback_wrong_ref_id']) && $feedback['feedback_wrong_ref_id'] > 0)
						{
							$json['feedback_link'] =  $this->getLinkIfReadAccessForObjectByRefId($feedback['feedback_wrong_ref_id']);
							$obj = ilObjectFactory::getInstanceByRefId($feedback['feedback_wrong_ref_id']);
							$json['feedback_icon'] = ilObject::_getIcon($obj->getid());
						}
						$json['html']          = $start_div . $feedback['feedback_one_wrong']  . '</div>';
						$json['is_timed']      = $feedback['is_jump_wrong'];
						$json['time']          = $feedback['jump_wrong_ts'];
					}
					else
					{
						if(isset($feedback['feedback_correct']) && $feedback['feedback_correct'] === null)
						{
							$feedback['correct'] = '';
						}
						if(isset($feedback['show_correct_icon']) && $feedback['show_correct_icon'])
						{
							$start_div = '<div class="correct">';
						}
						else
						{
							$start_div = '<div class="neutral">';
						}
	
						if(isset($feedback['feedback_correct_ref_id']) && $feedback['feedback_correct_ref_id'] > 0)
						{
							$json['feedback_link'] =  $this->getLinkIfReadAccessForObjectByRefId($feedback['feedback_correct_ref_id']);
							$obj = ilObjectFactory::getInstanceByRefId($feedback['feedback_correct_ref_id']);
							$json['feedback_icon'] = ilObject::_getIcon($obj->getid());
						}
						$json['html']          = $start_div . $feedback['feedback_correct'] .'</div>';
						$json['is_timed']      = $feedback['is_jump_correct'];
						$json['time']          = $feedback['jump_correct_ts'];
						$correct = true;
					}
				}
				else
				{
					if(isset($feedback['feedback_correct']) && $feedback['feedback_correct'] === null)
					{
						$feedback['correct'] = '';
					}
					$start_div = '<div class="neutral">';


					if(isset($feedback['feedback_correct_ref_id']) && $feedback['feedback_correct_ref_id'] > 0)
					{
						$json['feedback_link'] =  $this->getLinkIfReadAccessForObjectByRefId($feedback['feedback_correct_ref_id']);
						$obj = ilObjectFactory::getInstanceByRefId($feedback['feedback_correct_ref_id']);
						$json['feedback_icon'] = ilObject::_getIcon($obj->getid());
					}
					$json['html']          = $start_div . $feedback['feedback_correct'] .'</div>';
					$json['is_timed']      = $feedback['is_jump_correct'];
					$json['time']          = $feedback['jump_correct_ts'];
				}
				$json['correct'] = $correct;
			}

		$json['html'] .= '<div style="padding-top:10px;"></div>';
		$simple                     = new SimpleChoiceQuestionStatistics();
		$json['response_frequency'] = $simple->getResponseFrequency((int)$qid);

        $json['best_solution'] = '';
        if(isset($feedback['show_best_solution']) &&
            $feedback['show_best_solution'] == "1" &&
            isset($feedback['neutral_answer']) &&
            $feedback['neutral_answer'] != 1)
        {
            $json['html'] .= '<div class="iv_show_best_solution"><input class="btn btn-default btn-sm" id="show_best_solution"  type="submit"/></div><div class="iv_best_solution_value"></div>';
            $json['best_solution'] = '<div class="iv_best_solution_hidden">' . $this->getBestSolution($qid) . '</div>';
        }

		return json_encode($json);
	}

    /**
     * @param int $qid
     */
	protected function getBestSolution(int $qid): string
    {
        $best_solution = '';
	    $answers = $this->getAnswersForQuestionId($qid, false);
        foreach($answers as $answer) {
            $best_solution .= '<div class="best_solution_answer" data-best-solution="'. $answer["answer_id"] .'" data-answer-state="'.$answer['correct'].'"></div>';
        }
        return $best_solution;
    }

	/**
	 * @param $ref_id
	 * @return string
	 */
	/**
	 * @param $ref_id
	 * @throws ilDatabaseException
	 * @throws ilObjectNotFoundException
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 */
	protected function getLinkIfReadAccessForObjectByRefId($ref_id): string
	{
		if($ref_id != null && $ref_id != 0)
		{
			/**
			 * @var $ilAccess ilAccessHandler
			 */
			global $ilAccess;
			$video_tpl = new ilTemplate("tpl.elements.html", true, true, ilInteractiveVideoPlugin::getInstance()->getDirectory());
			$obj = ilObjectFactory::getInstanceByRefId($ref_id);
			
			if($ilAccess->checkAccess('read', '', $ref_id))
			{
				$video_tpl->setCurrentBlock('feedback_linked_element');
				$video_tpl->setVariable('URL', ilLink::_getLink($ref_id));
			}
			else
			{
				$video_tpl->setCurrentBlock('feedback_not_linked_element');

			}
			$video_tpl->setVariable('TITLE', $obj->getTitle());
			$video_tpl->parseCurrentBlock();
			return $video_tpl->get();
		}
		return '';
	}

    /**
     * @param $cid
     * @return false|string
     * @throws ilDatabaseException
     * @throws ilObjectNotFoundException
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     * @throws ilWACException
     */
	public function getJsonForCommentId($cid)
	{
        global $ilDB, $ilUser;
        $res = $ilDB->queryF('
			SELECT type 
			FROM  rep_robj_xvid_question question
			WHERE question.comment_id = %s ',
            ['integer'], [(int)$cid]
        );
        $type = null;
        while($row = $ilDB->fetchAssoc($res))
        {
            $type = (int) $row['type'];
        }

        if($type === 2) {
            $res = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_question question, 
				  rep_robj_xvid_comments comments 
			WHERE question.comment_id = %s 
			AND   question.comment_id = comments.comment_id',
                ['integer'], [(int)$cid]
            );
        } else {
            $res = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_question question, 
				  rep_robj_xvid_qus_text answers,
				  rep_robj_xvid_comments comments 
			WHERE question.comment_id = %s 
			AND   question.question_id = answers.question_id
			AND   question.comment_id = comments.comment_id',
                ['integer'], [(int)$cid]
            );
        }


		$counter        = 0;
		$question_data  = [];
		$question_text  = '';
		$question_type  = 0;
		$question_id    = 0;
		$question_image = null;
        $limit_attempts = 0;
        $is_jump_correct = 0;
        $show_correct_icon = 0;
        $jump_correct_ts = 0;
        $show_wrong_icon = 0;
        $is_jump_wrong = 0;
        $jump_wrong_ts = 0;
        $show_response_frequency = 0;
        $show_reflection_question_comment = 0;
        $compulsory = 0;
        $show_best_solution = 0;
        $show_best_solution_text = 0;
        $repeat_question = 0;
        $time = 0;

		while($row = $ilDB->fetchAssoc($res))
		{
            if($type !== 2) {
                $question_data[$counter]['answer']    = $row['answer'];
                $question_data[$counter]['answer_id'] = $row['answer_id'];
                $question_data[$counter]['correct']   = $row['correct'];
            }
			$question_text           = $row['question_text'];
			$question_type           = $row['type'];
			$question_id             = $row['question_id'];
			$limit_attempts          = $row['limit_attempts'];
			$show_correct_icon       = $row['show_correct_icon'];
			$is_jump_correct         = $row['is_jump_correct'];
			$show_wrong_icon         = $row['show_wrong_icon'];
			$jump_correct_ts         = $row['jump_correct_ts'];
			$is_jump_wrong           = $row['is_jump_wrong'];
			$jump_wrong_ts           = $row['jump_wrong_ts'];
			$show_response_frequency = $row['show_response_frequency'];
			$repeat_question         = $row['repeat_question'];
			$show_reflection_question_comment = $row['reflection_question_comment'];
			$question_image          = $row['question_image'];
			$compulsory              = $row['compulsory_question'];
			$time                    = $row['comment_time'];
			$show_best_solution      = $row['show_best_solution'];
			$show_best_solution_text = $row['show_best_solution_text'];
			#$neutral_answer         = $row['neutral_answer'];
			$counter++;
		}

		$res      = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_answers
			WHERE question_id = %s 
			AND   user_id = %s',
			['integer', 'integer'], [$question_id, $ilUser->getId()]
		);
		$counter  = 0;
		$answered = [];
		while($row = $ilDB->fetchAssoc($res))
		{
			$answered[$counter] = $row['answer_id'];
			$counter++;
		}
		$build_json = [];
		//$build_json['title'] 		  = $question_data;
		$build_json['answers']                 = $question_data;
		$build_json['question_text']           = $question_text;
		$build_json['type']                    = $question_type;
		$build_json['question_id']             = $question_id;
		$simple_choice                         = new SimpleChoiceQuestion();
		$build_json['question_title']          = $simple_choice->getCommentTitleByCommentId($cid);
		$build_json['limit_attempts']          = $limit_attempts;
		$build_json['is_jump_correct']         = $is_jump_correct;
		$build_json['show_correct_icon']       = $show_correct_icon;
		$build_json['jump_correct_ts']         = $jump_correct_ts;
		$build_json['show_wrong_icon']         = $show_wrong_icon;
		$build_json['is_jump_wrong']           = $is_jump_wrong;
		$build_json['jump_wrong_ts']           = $jump_wrong_ts;
		$build_json['show_response_frequency'] = $show_response_frequency;
		$build_json['reflection_question_comment'] = $show_reflection_question_comment;
		$build_json['compulsory_question']     = $compulsory;
		$build_json['show_best_solution']     = $show_best_solution;
		$build_json['show_best_solution_text']     = $show_best_solution_text;
		$build_json['repeat_question']         = $repeat_question;
		$build_json['time']                    = $time;
		if($question_image != null)
		{
			$build_json['question_image']          = ilWACSignedPath::signFile($question_image);
		}

		#$build_json['neutral_answer']         = $neutral_answer;

		if(is_array($answered) && sizeof($answered) > 0)
		{
			$build_json['previous_answer'] = $answered;
			$build_json['feedback']        = json_decode(self::getFeedbackForQuestion($question_id));
		}

		$build_json['reply_to_txt'] = '';
		$build_json['reply_to_private'] = '';
		$build_json['reply_original_id'] = 0;
		if($question_type == SimpleChoiceQuestion::REFLECTION)
		{
			$res      = $ilDB->queryF('
			SELECT * 
			FROM  rep_robj_xvid_comments
			WHERE is_reply_to = %s 
			AND   user_id = %s',
				['integer', 'integer'], [$cid, $ilUser->getId()]
			);
			while($row = $ilDB->fetchAssoc($res))
			{
				$build_json['reply_to_txt'] = $row['comment_text'];
				$build_json['reply_to_private'] = $row['is_private'];
				$build_json['reply_original_id'] = $row['comment_id'];
			}
		}

		return json_encode($build_json);
	}

    /**
     * @param      $qid
     * @param bool $asJson
     * @return false|string
     */
	public function getAnswersForQuestionId($qid, bool $asJson = true)
	{
        global $ilDB;

		$res = $ilDB->queryF('SELECT answer_id, answer, correct FROM rep_robj_xvid_qus_text WHERE question_id = %s',
			['integer'], [(int)$qid]);

		$question_data = [];
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_data[] = $row;
		}
		if(is_array($question_data) && count($question_data) === 0)
		{
			$question_data[] = '';
		}
		if($asJson){
            return json_encode($question_data);
        }
        return $question_data;
	}
}