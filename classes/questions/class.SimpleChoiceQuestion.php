<?php

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
	protected int $obj_id;
	protected int $comment_id;
	protected int $question_id = 0;
	protected string $question_text;
	protected int $type;
	protected string $feedback_correct;
	protected string $feedback_one_wrong;
	protected int $limit_attempts = 0;
	protected int $is_jump_correct = 0;
	protected int $show_correct_icon = 1;
	protected int $show_wrong_icon = 1;
	protected int $jump_correct_ts = 0;
	protected int $is_jump_wrong = 0;
	protected int $jump_wrong_ts = 0;
	protected int $repeat_question = 0;
	protected int $show_response_frequency = 0;

	protected int $show_best_solution = 0;
	protected string $show_best_solution_text = '';
	protected int $feedback_correct_id;
	protected int $feedback_wrong_id;
	protected int $reflection_question_comment = 0;
	protected int $neutral_answer = 0;
	protected string $question_image = '';
	protected int $compulsory_question = 0;
	public string $import_question_image = '';
	public array $import_answers = [];
	public function __construct(int $comment_id = 0)
	{
		if($comment_id > 0)
		{
			$this->setCommentId($comment_id);
			$this->read();
		}
	}

	public function read(): void
	{
        global $ilDB;

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION . ' 
				WHERE comment_id = %s',
			['integer'], [$this->getCommentId()]
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
			$this->setCompulsoryQuestion($row['compulsory_question']);
			$this->setShowResponseFrequency($row['show_response_frequency']);
			$this->setShowBestSolution($row['show_best_solution']);
			$this->setShowBestSolutionText($row['show_best_solution_text']);
			$this->setFeedbackCorrectId($row['feedback_correct_ref_id']);
			$this->setFeedbackWrongId($row['feedback_wrong_ref_id']);
			$this->setRepeatQuestion($row['repeat_question']);
			$this->setReflectionQuestionComment($row['reflection_question_comment']);
			$this->setNeutralAnswer($row['neutral_answer']);
			$this->setQuestionImage($row['question_image']);
		}

		$this->readAnswerDefinitions();
	}

	/**
	 * @param $qid
	 * @return array|void
     */
	public function readQuestionById($qid)
	{
        global $ilDB;

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION . ' 
				INNER JOIN '. self::TABLE_NAME_COMMENTS .'
				WHERE question_id = %s AND '.self::TABLE_NAME_QUESTION . '.comment_id = '.self::TABLE_NAME_COMMENTS.'.comment_id',
			['integer'], [$qid]
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			return $row;
		}

		$this->readAnswerDefinitions();
	}

	public function getCommentId() : int
    {
		return $this->comment_id;
	}

	public function setCommentId(int $comment_id): void
	{
		$this->comment_id = $comment_id;
	}

	public static function isLimitAttemptsEnabled(int $question_id) : bool
    {
        global $ilDB;

		$res = $ilDB->queryF('SELECT limit_attempts FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			['integer'], [$question_id]);

		$row = $ilDB->fetchAssoc($res);
		return (bool)$row['limit_attempts'];

	}

	public static function isRepeatQuestionEnabled(int $comment_id) : bool
    {
        global $ilDB;

		$res = $ilDB->queryF('SELECT repeat_question FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			['integer'], [$comment_id]);

		$row = $ilDB->fetchAssoc($res);

		return (bool)$row['repeat_question'];
	}

	public static function existUserAnswer(int $comment_id) : bool
    {
        global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_ANSWERS . ' ans
			INNER JOIN ' . self::TABLE_NAME_QUESTION . ' qst on ans.question_id = qst.question_id 
			WHERE comment_id = %s 
			AND user_id = %s
			',
			['integer', 'integer'], [$comment_id, $ilUser->getId()]);

		if($ilDB->numRows($res) > 0)
		{
			return true;
		}
		return false;
	}

	public static function answerExists(int $comment_id) : bool
    {
		/**
		 * @var $ilUser ilObjUser
		 * @var $ilDB ilDB
		 */
		global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_ANSWERS . ' ans
			INNER JOIN ' . self::TABLE_NAME_QUESTION . ' qst on ans.question_id = qst.question_id 
			WHERE comment_id = %s
			',
			['integer'], [$comment_id]);

		if($ilDB->numRows($res) > 0)
		{
			return true;
		}
		return false;
	}

    /**
     * @return int[]
     */
    public function getUsersWithAnsweredQuestion(int $obj_id) : array
    {
        /**
         * $ilDB ilDB
         */
        global $ilDB;

        $res = $ilDB->queryF('
			SELECT ans.user_id
			FROM ' . self::TABLE_NAME_ANSWERS . ' ans
			INNER JOIN ' . self::TABLE_NAME_QUESTION . ' qst
			    ON ans.question_id = qst.question_id 
			INNER JOIN ' . self::TABLE_NAME_COMMENTS . ' comment
			    ON qst.comment_id = comment.comment_id
			WHERE obj_id = %s 
			',
            ['integer',],
            [$obj_id,]
        );

        $usrIds = [];
        while ($row = $ilDB->fetchAssoc($res)) {
            $usrIds[$row['user_id']] = $row['user_id'];
        }

        return array_values($usrIds);
    }

    /**
     * @return array<int, int>
     */
    public function getUsersWithAllAnsweredQuestionsMap(int $obj_id) : array
    {
        /**
         * $ilDB ilDB
         */
        global $ilDB;

        $res = $ilDB->queryF('
            SELECT
                rep_robj_xvid_answers.user_id, COUNT(DISTINCT(rep_robj_xvid_answers.answer_id))
            FROM rep_robj_xvid_answers
            INNER JOIN rep_robj_xvid_question
                ON rep_robj_xvid_question.question_id = rep_robj_xvid_answers.question_id
                AND rep_robj_xvid_question.type != %s
            INNER JOIN rep_robj_xvid_comments
                ON rep_robj_xvid_comments.comment_id = rep_robj_xvid_question.comment_id
                AND rep_robj_xvid_comments.is_interactive = %s
            WHERE rep_robj_xvid_comments.obj_id = %s
            GROUP BY rep_robj_xvid_answers.user_id
            HAVING COUNT(DISTINCT(rep_robj_xvid_answers.question_id)) = (
                SELECT COUNT(rep_robj_xvid_question.question_id)
                FROM rep_robj_xvid_comments
                INNER JOIN rep_robj_xvid_question
                    ON rep_robj_xvid_question.comment_id = rep_robj_xvid_comments.comment_id
                    AND rep_robj_xvid_question.type != %s
                WHERE rep_robj_xvid_comments.is_interactive = %s AND rep_robj_xvid_comments.obj_id = %s
            );
            ',
            ['integer', 'integer', 'integer', 'integer', 'integer', 'integer'],
            [2, 1, $obj_id, 2, 1, $obj_id]
        );

        $usrIds = [];
        while ($row = $ilDB->fetchAssoc($res)) {
            $usrIds[$row['user_id']] = $row['user_id'];
        }

        return $usrIds;
    }
    public function getNumberOfAnsweredQuestions(int $obj_id, int $user_id) : int
    {
        /**
         * $ilDB ilDB
         */
        global $ilDB;

        $res = $ilDB->queryF('
			SELECT COUNT(DISTINCT(ans.question_id)) cnt FROM ' . self::TABLE_NAME_ANSWERS . ' ans
			INNER JOIN ' . self::TABLE_NAME_QUESTION . ' qst on ans.question_id = qst.question_id 
			INNER JOIN ' . self::TABLE_NAME_COMMENTS . ' comment on qst.comment_id = comment.comment_id
			WHERE obj_id = %s 
			AND ans.user_id = %s
			',
			['integer', 'integer'],
            [$obj_id, $user_id]
        );

        $row = $ilDB->fetchAssoc($res);

        if (is_array($row) && isset($row['cnt'])) {
            return (int) $row['cnt'];
        }

        return 0;
    }

	public static function existUserAnswerForQuestionId(int $question_id) : bool
    {
        global $ilUser, $ilDB;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_ANSWERS . ' 			
			WHERE question_id = %s 
			AND user_id = %s
			',
			['integer', 'integer'], [$question_id, $ilUser->getId()]);

		if($ilDB->numRows($res) > 0)
		{
			return true;
		}
		return false;
	}

	private function readAnswerDefinitions(): void
	{
        global $ilDB;

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION_TEXT . '  
				WHERE question_id = %s',
			['integer'], [$this->getQuestionId()]
		);

		while($row = $ilDB->fetchAssoc($res))
		{
			$this->answer_defs[] = $row;
		}
	}

	public function getQuestionId() : int
    {
		return $this->question_id;
	}

	public function setQuestionId(int $question_id): void
	{
		$this->question_id = $question_id;
	}

	public function cloneQuestionObject(int $old_comment_id, int $new_comment_id): void
	{
        global $ilDB;


		$_POST['answer'] = [];
		$_POST['correct'] = [];

		$res = $ilDB->queryF('
				SELECT * 
				FROM ' . self::TABLE_NAME_QUESTION_TEXT . '  
				WHERE question_id = %s',
			['integer'], [$this->getQuestionIdByCommentId($old_comment_id)]
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
			['integer'], [$old_comment_id]
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
			$this->setCompulsoryQuestion($row['compulsory_question']);
			$this->setShowResponseFrequency($row['show_response_frequency']);
			$this->setShowBestSolution($row['show_best_solution']);
			$this->setShowBestSolutionText($row['show_best_solution_text']);
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

	public function getQuestionIdByCommentId(int $comment_id) : int
    {
        global $ilDB;

		$res = $ilDB->queryF('SELECT question_id FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			['integer'], [$comment_id]);

		$row = $ilDB->fetchAssoc($res);
		return $row['question_id'];
	}

	public function create() : int
    {
        global $ilDB;

		$question_id = $ilDB->nextId(self::TABLE_NAME_QUESTION);
		$ilDB->insert(self::TABLE_NAME_QUESTION,
			[
                'question_id'        => ['integer', $question_id],
                'comment_id'         => ['integer', $this->getCommentId()],
                'type'               => ['integer', $this->getType()],
                'question_text'      => ['text', $this->getQuestionText()],
                'feedback_correct'   => ['text', $this->getFeedbackCorrect()],
                'feedback_one_wrong' => ['text', $this->getFeedbackOneWrong()],
                'limit_attempts'     => ['integer', $this->getLimitAttempts()],
                'show_correct_icon'  => ['integer', $this->getShowCorrectIcon()],
                'is_jump_correct'    => ['integer', $this->getIsJumpCorrect()],
                'jump_correct_ts'    => ['integer', $this->getJumpCorrectTs()],
                'show_wrong_icon'    => ['integer', $this->getShowWrongIcon()],
                'is_jump_wrong'      => ['integer', $this->getIsJumpWrong()],
                'jump_wrong_ts'      => ['integer', $this->getJumpWrongTs()],
                'compulsory_question' => ['integer', $this->getCompulsoryQuestion()],
                'show_response_frequency' => ['integer', $this->getShowResponseFrequency()],
                'show_best_solution' => ['integer', $this->getShowBestSolution()],
                'show_best_solution_text' => ['text', $this->getShowBestSolutionText()],
                'feedback_correct_ref_id' => ['integer', $this->getFeedbackCorrectId()],
                'feedback_wrong_ref_id' => ['integer', $this->getFeedbackWrongId()],
                'repeat_question'    => ['integer', $this->getRepeatQuestion()],
                'reflection_question_comment' => ['integer', $this->getReflectionQuestionComment()],
                'neutral_answer' => ['integer', $this->getNeutralAnswer()],
                'question_image' => ['text', $this->getQuestionImage()],
            ]);
		$this->editAnswersForQuestion($question_id);
		return $question_id;
	}

	/**
	 * @return int|array<int, int>
	 */
	public function getAllUsersWithCompletelyCorrectAnswers(int $oid, ?int $a_user_id = null)
	{
		$user_ids = [];
        global $ilDB;

		$res = $ilDB->queryF(
			'
        SELECT SUM(points) points, rep_robj_xvid_score.user_id usr_id
        FROM rep_robj_xvid_comments 
		INNER JOIN rep_robj_xvid_question
		    ON rep_robj_xvid_question.comment_id = rep_robj_xvid_comments.comment_id
		INNER JOIN rep_robj_xvid_score
		    ON rep_robj_xvid_score.question_id = rep_robj_xvid_question.question_id
		WHERE rep_robj_xvid_comments.obj_id = %s 
        AND is_interactive = 1
        AND neutral_answer = 0
        AND points = 1
        GROUP BY usr_id',
			['integer'],
			[($oid)]
		);
		while($row = $ilDB->fetchAssoc($res))
		{
			$user_ids[$row['usr_id']] = (int) $row['points'];
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
	
	public function getType() : int
    {
		return $this->type;
	}

	/**
	 * @param int $type
	 */
	public function setType(int $type): void
	{
		$this->type = $type;
	}
	
	public function getQuestionText(): string
	{
		return $this->question_text;
	}

	/**
	 * @param string $question_text
	 */
	public function setQuestionText(string $question_text): void
	{
		$this->question_text = $question_text;
	}

	public function getFeedbackCorrect(): string
	{
		return $this->feedback_correct;
	}

	/**
	 * @param string $feedback_correct
	 */
	public function setFeedbackCorrect(string $feedback_correct): void
	{
		$this->feedback_correct = $feedback_correct;
	}

	public function getFeedbackOneWrong(): string
	{
		return $this->feedback_one_wrong;
	}

	/**
	 * @param string $feedback_one_wrong
	 */
	public function setFeedbackOneWrong(string $feedback_one_wrong): void
	{
		$this->feedback_one_wrong = $feedback_one_wrong;
	}

	public function getLimitAttempts(): int
	{
		return $this->limit_attempts;
	}

	/**
	 * @param int $limit_attempts
	 */
	public function setLimitAttempts(int $limit_attempts): void
	{
		$this->limit_attempts = $limit_attempts;
	}

	public function getShowCorrectIcon(): int
	{
		return $this->show_correct_icon;
	}

	/**
	 * @param int $show_correct_icon
	 */
	public function setShowCorrectIcon(int $show_correct_icon): void
	{
		$this->show_correct_icon = $show_correct_icon;
	}

	public function getIsJumpCorrect(): int
	{
		return $this->is_jump_correct;
	}

	/**
	 * @param int $is_jump_correct
	 */
	public function setIsJumpCorrect(int $is_jump_correct): void
	{
		$this->is_jump_correct = $is_jump_correct;
	}

	public function getJumpCorrectTs(): int
	{
		return $this->jump_correct_ts;
	}

	public function setJumpCorrectTs(int $jump_correct_ts): void
	{
		$this->jump_correct_ts = $jump_correct_ts;
	}

	public function getShowWrongIcon(): int
	{
		return $this->show_wrong_icon;
	}

	/**
	 * @param int $show_wrong_icon
	 */
	public function setShowWrongIcon(int $show_wrong_icon): void
	{
		$this->show_wrong_icon = $show_wrong_icon;
	}

	public function getIsJumpWrong(): int
	{
		return $this->is_jump_wrong;
	}

	/**
	 * @param int $is_jump_wrong
	 */
	public function setIsJumpWrong(int $is_jump_wrong): void
	{
		$this->is_jump_wrong = $is_jump_wrong;
	}

	public function getJumpWrongTs(): int
	{
		return $this->jump_wrong_ts;
	}

	public function setJumpWrongTs(int $jump_wrong_ts): void
	{
		$this->jump_wrong_ts = $jump_wrong_ts;
	}

	public function getShowResponseFrequency(): int
	{
		return $this->show_response_frequency;
	}

	/**
	 * @param int $show_response_frequency
	 */
	public function setShowResponseFrequency(int $show_response_frequency): void
	{
		$this->show_response_frequency = $show_response_frequency;
	}

    public function getShowBestSolution(): int
    {
        return $this->show_best_solution;
    }

    /**
     * @param int $show_best_solution
     */
    public function setShowBestSolution(int $show_best_solution): void
    {
        $this->show_best_solution = $show_best_solution;
    }

	public function getRepeatQuestion(): int
	{
		return $this->repeat_question;
	}

	/**
	 * @param int $repeat_question
	 */
	public function setRepeatQuestion(int $repeat_question): void
	{
		$this->repeat_question = $repeat_question;
	}

	public function checkInput(): bool
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
		$question_text = ilInteractiveVideoPlugin::stripSlashesWrapping($_POST['question_text']);

		if($question_text === '')
		{
			$status = false;
		}
		if($this->getType() != self::REFLECTION)
		{
			foreach(ilArrayUtil::stripSlashesRecursive($_POST['answer']) as $key => $value)
			{
				if(is_array($_POST['correct']) && array_key_exists($key, ilArrayUtil::stripSlashesRecursive($_POST['correct'])))
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
	 * @return int|null
	 */
	public function existQuestionForCommentId($comment_id) : ?int
	{

        global $ilDB;
        $question_id = null;
		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			['integer'], [$comment_id]);

		$row = $ilDB->fetchAssoc($res);
        if(isset($row['question_id']) && $row['question_id'] > 0 ) {
            $question_id = (int)$row['question_id'];
        }


		return $question_id;
	}

	/**
	 * @param $cid
	 */
	public function getCommentTitleByCommentId($cid): string
	{
        global $ilDB;

		$res   = $ilDB->queryF(
			'SELECT comment_title FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			['integer'],
			[(int)$cid]
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
	 * @return mixed[]
	 */
	public function getAllNonRepeatAnsweredQuestion(int $user_id): array
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
			['integer', 'integer'],
			[0, $user_id]
		);
		$results = [];
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[] = $row['comment'];
		}
		return $results;
	}

    /**
	 * @param int $obj_id
	 * @return array<int|string, array{time: mixed, question_id: mixed, comment_id: mixed, answered: bool}>
	 */
	public static function getAllCompulsoryQuestions(int $obj_id): array
	{
        global $ilDB;
		$res     = $ilDB->queryF('
			SELECT comments.comment_time, questions.question_id, comments.comment_id, points 
			FROM ' . self::TABLE_NAME_COMMENTS . ' comments, 
				' . self::TABLE_NAME_QUESTION . '  questions 
			LEFT JOIN rep_robj_xvid_score ON questions.question_id = rep_robj_xvid_score.question_id
			WHERE comments.comment_id = questions.comment_id 
			AND questions.compulsory_question = 1
			AND comments.obj_id = %s',
			['integer'],
			[$obj_id]
		);
		$results = [];
		while($row = $ilDB->fetchAssoc($res))
		{
			$results[$row['question_id']] = [
			    'time'          => $row['comment_time'],
                'question_id'   => $row['question_id'],
			    'comment_id'    => $row['comment_id'],
			    'answered'      => $row['points'] != null
            ];
		}
		return $results;
	}

	/**
	 * @param int $user_id
	 * @return mixed[]
	 */
	public function getAllRepeatCorrectlyAnsweredQuestion(int $user_id): array
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
			['integer', 'integer', 'integer'],
			[1, 1, $user_id]
		);
		$results = [];
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
	public function deleteUserResults(array $user_ids, int $obj_id): void
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
	 * @return mixed[]
	 */
	public function getInteractiveQuestionIdsByObjId($obj_id): array
	{
        global $ilDB;

		$res = $ilDB->queryF('
			SELECT 		question_id 
			FROM 		' . self::TABLE_NAME_QUESTION . ' qst
			INNER JOIN 	' . self::TABLE_NAME_COMMENTS . '  cmt on qst.comment_id = cmt.comment_id
			WHERE		obj_id = %s AND is_interactive = %s',
			['integer', 'integer'], [$obj_id, 1]);

		$question_ids = [];

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		return $question_ids;
	}

	/**
	 * @param $obj_id
	 * @return mixed[]
	 */
	public function getInteractiveNotNeutralQuestionIdsByObjId($obj_id): array
	{
        global $ilDB;

		$res = $ilDB->queryF('
			SELECT 		question_id 
			FROM 		' . self::TABLE_NAME_QUESTION . ' qst
			INNER JOIN 	' . self::TABLE_NAME_COMMENTS . '  cmt on qst.comment_id = cmt.comment_id
			WHERE		obj_id = %s AND is_interactive = %s AND neutral_answer = %s AND type <> 2',
			['integer', 'integer', 'integer'], [$obj_id, 1, 0]);

		$question_ids = [];

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		return $question_ids;
	}

	/**
	 * @param array $question_ids
	 */
	public function deleteQuestionsResults(array $question_ids): void
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
	public function getQuestionTextQuestionId(int $qid)
	{

        global $ilDB;

		$res = $ilDB->queryF(
			'SELECT question_text FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			['integer'],
			[$qid]
		);
		$row = $ilDB->fetchAssoc($res);
		return $row['question_text'];

	}

	/**
	 * @param $qid
	 * @param $answers
	 */
	public function saveAnswer($qid, $answers): void
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
			$ilDB->insert(self::TABLE_NAME_ANSWERS,
				[
                    'question_id' => ['integer', $qid],
                    'user_id'     => ['integer', $usr_id],
                    'answer_id'   => ['integer', $answers[0]]
                ]);
		}
		else if($type === self::MULTIPLE_CHOICE)
		{
			$points = 1;
			foreach($answers as $key => $value)
			{
				$ilDB->insert(self::TABLE_NAME_ANSWERS,
					[
                        'question_id' => ['integer', $qid],
                        'user_id'     => ['integer', $usr_id],
                        'answer_id'   => ['integer', (int)$value]
                    ]);
				if(is_array($answers) && sizeof($answers) !== sizeof($correct_answers) || !in_array($value, $correct_answers))
				{
					$points = 0;
				}
			}
			if(is_array($answers) && sizeof($answers) == 0)
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
			[
                'question_id' => ['integer', $qid],
                'user_id'     => ['integer', $usr_id],
                'points'      => ['integer', $points]
            ]);
	}

	/**
	 * @param $qid
	 * @return int
	 */
	public function getTypeByQuestionId($qid)
	{

        global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM ' . self::TABLE_NAME_QUESTION . ' WHERE question_id = %s',
			['integer'],
			[(int)$qid]
		);
		$row = $ilDB->fetchAssoc($res);
        if($row !== null) {
            if(isset($row['type'])) {
                return (int)$row['type'];
            }
        } else {
            return null;
        }
	}

	/**
	 * @param $qid
	 */
	public function removeAnswer($qid): void
	{
        global $ilDB, $ilUser;

		$usr_id = $ilUser->getId();
		$ilDB->queryF('DELETE FROM ' . self::TABLE_NAME_ANSWERS . ' WHERE question_id = %s AND user_id = %s',
			['integer', 'integer'], [$qid, $usr_id]);
		$this->removeScore($qid);
	}

	/**
	 * @param $qid
	 */
	public function removeScore($qid): void
	{
        global $ilDB, $ilUser;

		$usr_id = $ilUser->getId();
		$ilDB->queryF('DELETE FROM ' . self::TABLE_NAME_SCORE . ' WHERE question_id = %s AND user_id = %s',
			['integer', 'integer'], [$qid, $usr_id]);
	}

	/**
	 * @param $comment_id
	 */
	public function deleteQuestionsIdByCommentId($comment_id): void
	{
        global $ilDB;

		$res = $ilDB->queryF('SELECT question_id FROM ' . self::TABLE_NAME_QUESTION . ' WHERE comment_id = %s',
			['integer'], [$comment_id]);

		$question_ids = [];

		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}

		self::deleteQuestions($question_ids);
	}

	/**
	 * @param array $question_ids
	 */
	public static function deleteQuestions(array $question_ids): void
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

	public function getObjId(): int
	{
		return $this->obj_id;
	}

	/**
	 * @param int $obj_id
	 */
	public function setObjId(int $obj_id): void
	{
		$this->obj_id = $obj_id;
	}

	public function getFeedbackCorrectId(): int
	{
		return $this->feedback_correct_id;
	}

	/**
	 * @param int $feedback_correct_id
	 */
	public function setFeedbackCorrectId(int $feedback_correct_id): void
	{
		$this->feedback_correct_id = $feedback_correct_id;
	}

	public function getFeedbackWrongId(): int
	{
		return $this->feedback_wrong_id;
	}

	/**
	 * @param int $feedback_wrong_id
	 */
	public function setFeedbackWrongId(int $feedback_wrong_id): void
	{
		$this->feedback_wrong_id = $feedback_wrong_id;
	}

	public function getReflectionQuestionComment(): int
	{
		return $this->reflection_question_comment;
	}

	/**
	 * @param int $reflection_question_comment
	 */
	public function setReflectionQuestionComment(int $reflection_question_comment): void
	{
		$this->reflection_question_comment = $reflection_question_comment;
	}

	public function getNeutralAnswer(): int
	{
		return $this->neutral_answer;
	}

	/**
	 * @param int $neutral_answer
	 */
	public function setNeutralAnswer(int $neutral_answer): void
	{
		$this->neutral_answer = $neutral_answer;
	}

	public function getQuestionImage(): string
	{
		return $this->question_image;
	}

	/**
	 * @param string $question_image
	 */
	public function setQuestionImage(string $question_image): void
	{
		$this->question_image = $question_image;
	}

    public function getCompulsoryQuestion(): int
    {
        return $this->compulsory_question;
    }

    /**
     * @param int $compulsory_question
     */
    public function setCompulsoryQuestion(int $compulsory_question): void
    {
        $this->compulsory_question = $compulsory_question;
    }

    public function getShowBestSolutionText(): string
    {
        return $this->show_best_solution_text;
    }

    /**
     * @param string|null $show_best_solution_text
     */
    public function setShowBestSolutionText(?string $show_best_solution_text) : void
    {
        $this->show_best_solution_text = $show_best_solution_text;
    }

    public function editAnswersForQuestion($question_id): void{
        global $DIC;

        $post = $DIC->http()->wrapper()->post();

        $answer = null;
        $question_type = null;
        $correct_answers = null;

        if($post->has('form_values'))
        {
            if($post->has('form_values') ) {
                $form_values = $post->retrieve('form_values', $DIC->refinery()->kindlyTo()->string());
                $form_values = unserialize($form_values);
            } else {
                $answer = $post->retrieve('answers', $DIC->refinery()->kindlyTo()->string());
            }

            if (isset($form_values['answer'])) {
                $answer = $form_values['answer'];
            }
            if (isset($form_values['question_type'])) {
                $question_type = $form_values['question_type'];
            }
            if (isset($form_values['correct'])) {
                $correct_answers = $form_values['correct'];
             }
        } else {
            if($post->has('answer')) {
                $answer = $post->retrieve('answer', $DIC->refinery()->kindlyTo()->listOf($DIC->refinery()->kindlyTo()->string()));
            }
            if($post->has('question_type')) {
                $question_type = $post->retrieve('question_type', $DIC->refinery()->kindlyTo()->string());
            }
            if($post->has('correct')) {
                $correct_answers = $post->retrieve('correct', $DIC->refinery()->kindlyTo()->dictOf($DIC->refinery()->kindlyTo()->string()));
            }
        }
        if(is_array($answer) && count($answer) > 0 && $question_type != self::REFLECTION)
        {
            foreach(ilArrayUtil::stripSlashesRecursive($answer) as $key => $value)
            {
                $answer_id = $DIC->database()->nextId(self::TABLE_NAME_QUESTION_TEXT);
                if($value == null){$value = ' ';}
                $correct = 0;
                if(is_array($correct_answers) && array_key_exists($key, $correct_answers))
                {
                    $correct = 1;
                }

                $DIC->database()->insert(self::TABLE_NAME_QUESTION_TEXT,
                    [
                        'answer_id'   => ['integer', $answer_id],
                        'question_id' => ['integer', $question_id],
                        'answer'      => ['text', $value],
                        'correct'     => ['integer', $correct]
                    ]);
            }
        }
        else if($_POST['question_type'] == self::REFLECTION)
        {
            $answer_id = $DIC->database()->nextId(self::TABLE_NAME_QUESTION_TEXT);
            $DIC->database()->insert(self::TABLE_NAME_QUESTION_TEXT,
                [
                    'answer_id'   => ['integer', $answer_id],
                    'question_id' => ['integer', $question_id],
                    'answer'      => ['text', ' '],
                    'correct'     => ['integer', 1]
                ]);
        }
    }


}
