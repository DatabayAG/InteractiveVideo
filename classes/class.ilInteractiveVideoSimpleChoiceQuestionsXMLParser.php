<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilInteractiveVideoXMLParser.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilObjComment.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.SimpleChoiceQuestion.php';

/**
 * Class ilInteractiveVideoSimpleChoiceQuestionsXMLParser
 */
class ilInteractiveVideoSimpleChoiceQuestionsXMLParser extends ilInteractiveVideoXMLParser
{
	/**
	 * @var 
	 */
	protected $xvid_obj;

	/**
	 * @var bool
	 */
	protected $inAnswerTag = false;

	/**
	 * @var string
	 */
	protected $video_src_id;

	/**
	 * @var int
	 */
	protected $comments = 0;

	/**
	 * @var int
	 */
	protected $questions = 0;

	/**
	 * @param ilObjInteractiveVideo $xvid_obj
	 * @param                      $xmlFile
	 */
	public function __construct($xvid_obj, $xmlFile)
	{
		$this->xvid_obj = $xvid_obj;
		$this->setHandlers($xmlFile);
	}



	/**
	 * @param $xmlParser
	 * @param $tagName
	 * @param $tagAttributes
	 */
	public function handlerBeginTag($xmlParser, $tagName, $tagAttributes)
	{
		switch($tagName)
		{
			case 'QuestionText':
			case 'QuestionType':
			case 'QuestionFeedbackCorrect':
			case 'QuestionFeedbackOneWrong':
			case 'QuestionLimitAttempts':
			case 'QuestionIsJumpCorrect':
			case 'QuestionIsJumpWrong':
			case 'QuestionJumpCorrectTs':
			case 'QuestionJumpWrongTs':
			case 'QuestionShowCorrectIcon':
			case 'QuestionShowWrongIcon':
			case 'QuestionShowResponseFrequency':
			case 'QuestionCorrectRefId':
			case 'QuestionWrongRefId':
			case 'QuestionRepeatQuestion':
			case 'QuestionReflectionComment':
			case 'QuestionNeutralAnswer':
			case 'CommentIsTutor':
			case 'CommentIsInteractive':
			case 'CommentTime':
			case 'CommentText':
			case 'CommentTitle':
			case 'CommentTags':
			case 'CommentIsPrivate':
			case 'CommentTimeEnd':
			case 'CommentIsReplyTo':
			case 'AnswerId':
			case 'AnswerText':
			case 'AnswerCorrect':
				$this->cdata = '';
				break;
			case 'QuestionImage':
				$file = $this->fetchAttribute($tagAttributes, 'file');
				$this->xvid_obj->import_simple_choice[$this->comments]->import_question_image = $file;
				break;
			case 'Answer':
				$this->inAnswerTag = true;
				$text = $this->fetchAttribute($tagAttributes, 'text');
				$correct = $this->fetchAttribute($tagAttributes, 'correct');
				$this->xvid_obj->import_simple_choice[$this->comments]->import_answers[] = array('text' => $text, 'correct' => $correct);
				break;
			case 'CommentId':
				$this->comments++;
				$this->xvid_obj->import_comment[$this->comments] = new ilObjComment();
				break;
			case 'QuestionId':
				$this->questions++;
				$this->xvid_obj->import_simple_choice[$this->comments] = new SimpleChoiceQuestion();
				break;
			case 'VideoSource':
				$this->video_src_id = $this->fetchAttribute($tagAttributes, 'source_id');
				$this->xvid_obj->setSourceId($this->video_src_id);
				$importer = $this->xvid_obj->getVideoSourceObject(trim($this->video_src_id));
				$object = $importer->getVideoSourceImportParser();
				$tmp = new $object($importer, $xmlParser);
				$this->inVideoSourceTag = true;
				break;
		}
	}

	/**
	 * @param $xmlParser
	 * @param $tagName
	 */
	public function handlerEndTag($xmlParser, $tagName)
	{
		switch($tagName)
		{
			case 'Answer':
				if($this->inAnswerTag)
				{
					$this->inAnswerTag = false;
				}
				break;
			case 'CommentId':
				break;
			case 'CommentIsTutor':
				$this->xvid_obj->import_comment[$this->comments]->setIsTutor(trim($this->cdata));
				break;
			case 'CommentIsInteractive':
				$this->xvid_obj->import_comment[$this->comments]->setInteractive(trim($this->cdata));
				break;
			case 'CommentTime':
				$this->xvid_obj->import_comment[$this->comments]->setCommentTime(trim($this->cdata));
				break;
			case 'CommentText':
				$this->xvid_obj->import_comment[$this->comments]->setCommentText(trim($this->cdata));
				break;
			case 'CommentTitle':
				$this->xvid_obj->import_comment[$this->comments]->setCommentTitle(trim($this->cdata));
				break;
			case 'CommentTags':
				$this->xvid_obj->import_comment[$this->comments]->setCommentTags(trim($this->cdata));
				break;
			case 'CommentIsPrivate':
				$this->xvid_obj->import_comment[$this->comments]->setIsPrivate(trim($this->cdata));
				break;
			case 'CommentTimeEnd':
				$this->xvid_obj->import_comment[$this->comments]->setCommentTimeEnd(trim($this->cdata));
				break;
			case 'CommentIsReplyTo':
				$this->xvid_obj->import_comment[$this->comments]->setIsReplyTo(trim($this->cdata));
				break;
			case 'QuestionText':
				$this->xvid_obj->import_simple_choice[$this->comments]->setQuestionText(trim($this->cdata));
				break;
			case 'QuestionType':
				$this->xvid_obj->import_simple_choice[$this->comments]->setType(trim($this->cdata));
				break;
			case 'QuestionFeedbackCorrect':
				$this->xvid_obj->import_simple_choice[$this->comments]->setFeedbackCorrect(trim($this->cdata));
				break;
			case 'QuestionFeedbackOneWrong':
				$this->xvid_obj->import_simple_choice[$this->comments]->setFeedbackOneWrong(trim($this->cdata));
				break;
			case 'QuestionLimitAttempts':
				$this->xvid_obj->import_simple_choice[$this->comments]->setLimitAttempts(trim($this->cdata));
				break;
			case 'QuestionIsJumpCorrect':
				$this->xvid_obj->import_simple_choice[$this->comments]->setIsJumpCorrect(trim($this->cdata));
				break;
			case 'QuestionIsJumpWrong':
				$this->xvid_obj->import_simple_choice[$this->comments]->setIsJumpWrong(trim($this->cdata));
				break;
			case 'QuestionJumpCorrectTs':
				$this->xvid_obj->import_simple_choice[$this->comments]->setJumpCorrectTs(trim($this->cdata));
				break;
			case 'QuestionJumpWrongTs':
				$this->xvid_obj->import_simple_choice[$this->comments]->setJumpWrongTs(trim($this->cdata));
				break;
			case 'QuestionShowCorrectIcon':
				$this->xvid_obj->import_simple_choice[$this->comments]->setShowCorrectIcon(trim($this->cdata));
				break;
			case 'QuestionShowWrongIcon':
				$this->xvid_obj->import_simple_choice[$this->comments]->setShowWrongIcon(trim($this->cdata));
				break;
			case 'QuestionShowResponseFrequency':
				$this->xvid_obj->import_simple_choice[$this->comments]->setShowResponseFrequency(trim($this->cdata));
				break;
			case 'QuestionCorrectRefId':
				$this->xvid_obj->import_simple_choice[$this->comments]->setFeedbackCorrectId(trim($this->cdata));
				break;
			case 'QuestionWrongRefId':
				$this->xvid_obj->import_simple_choice[$this->comments]->setFeedbackWrongId(trim($this->cdata));
				break;
			case 'QuestionRepeatQuestion':
				$this->xvid_obj->import_simple_choice[$this->comments]->setRepeatQuestion(trim($this->cdata));
				break;
			case 'QuestionReflectionComment':
				$this->xvid_obj->import_simple_choice[$this->comments]->setReflectionQuestionComment(trim($this->cdata));
				break;
			case 'QuestionNeutralAnswer':
				$this->xvid_obj->import_simple_choice[$this->comments]->setNeutralAnswer(trim($this->cdata));
				break;
			case 'QuestionImage':
				$this->xvid_obj->import_simple_choice[$this->comments]->setQuestionImage(trim($this->cdata));
				break;
		}
	}

	/**
	 * @param $xmlParser
	 */
	public function setHandlers($xmlParser)
	{
		xml_set_object($xmlParser, $this);
		xml_set_element_handler($xmlParser, 'handlerBeginTag', 'handlerEndTag');
		xml_set_character_data_handler($xmlParser, 'handlerCharacterData');
	}

	public function handlerCharacterData($xmlParser, $charData)
	{
		if($charData != "\n")
		{
			// Replace multiple tabs with one space
			$charData = preg_replace("/\t+/", " ", $charData);

			$this->cdata .= $charData;
		}
	}

	private function fetchAttribute($attributes, $name)
	{
		if( isset($attributes[$name]) )
		{
			return $attributes[$name];
		}
		return null;
	}
}