<?php

use ILIAS\MetaData\Services\InternalServices;

/**
 * Class ilInteractiveVideoExporter
 */
class ilInteractiveVideoExporter extends ilXmlExporter
{
    public const OBJ_TYPE = 'xvid';
	/**
	 * @var ilXmlWriter
	 */
	protected $xml_writer = null;

	/**
	 * @var ilObjInteractiveVideo | null
	 */
	protected $object = null;

	/**
	 * @var int
	 */
	protected $obj_id;

	/**
	 * @var string
	 */
	protected $export_dir;

	/**
	 * @var string
	 */
	protected $sub_dir;

	/**
	 * @var string
	 */
	protected $filename;

    public function getXmlRepresentation(
        string $a_entity,
        string $a_schema_version,
        string $a_id
    ): string
	{
		$ref_id = current(ilObject::_getAllReferences($a_id));
		$this->obj_id		= $a_id;
		$this->object		= new ilObjInteractiveVideo($ref_id);
		$this->xml_writer	= new ilXmlWriter();
		$this->export_dir	= $this->getAbsoluteExportDirectory();
		$date				= time();
		$this->sub_dir		= $date . '_' . IL_INST_ID . '_' . "xvid" . '_' . $a_id;
		$this->filename		= $this->sub_dir . ".xml";

		$this->exportPagesXML();

		return $this->xml_writer->xmlDumpMem();
	}

	public function exportXMLMetaData(): void
	{
		global $DIC;

		$md_services = new InternalServices($DIC);
		$md_repository = $md_services->repository()->repository();
		$md_xml_services = $md_services->xml();
		$md_writer = $md_xml_services->standardWriter();

		$md_set = $md_repository->getMD(
			(int) $this->object->getId(),
			0,
			$this->object->getType()
		);

		$md_xml = $md_writer->write($md_set);

		$xml_string = $md_xml->asXML();
		if ($xml_string !== false) {
			$xml_string = preg_replace('/^<\?xml[^>]*\?>/i', '', $xml_string);
			$this->xml_writer->appendXML(trim($xml_string));
		}
	}

    public function init(): void
	{

	}

    /**
     * @return array<string, array{namespace: string, uses_dataset: bool, min: string, max: string}>
     */
    public function getValidSchemaVersions(string $a_entity): array
	{
        return [
            '5.2.0' => [
                'namespace' => 'http://www.ilias.de/Modules/ContentPage/' . self::OBJ_TYPE . '/5_4',
                'xsd_file' => 'ilias_' . self::OBJ_TYPE . '_5_2.xsd',
                'uses_dataset' => false,
                'min' => '5.2.0',
                'max' => '',
            ],
        ];
	}

	public function exportPagesXML(): void
	{
		$attr         = [];
		$attr["Type"] = "ilInteractiveVideo";
		$this->xml_writer->xmlStartTag("ContentObject", $attr);

		// MetaData
		$this->exportXMLMetaData();

		// Settings
		$this->exportXMLSettings();


		$this->xml_writer->xmlEndTag("ContentObject");
	}

	private function exportXMLSettings(): void
	{
		$src_id = $this->object->getSourceId();
		$this->xml_writer->xmlStartTag('Settings', ['video_source_id' => $src_id]);

		$this->xml_writer->xmlElement('Title', null, $this->object->getTitle());
		$this->xml_writer->xmlElement('Description', null, $this->object->getDescription());
		$this->xml_writer->xmlElement('Online', null, (int)$this->object->isOnline());

		$this->xml_writer->xmlElement('isAnonymized', null, $this->object->isAnonymized());
		$this->xml_writer->xmlElement('isRepeat', null, $this->object->isRepeat());
		$this->xml_writer->xmlElement('isChronologic', null, $this->object->isChronologic());
		$this->xml_writer->xmlElement('isPublic', null, $this->object->isPublic());
		$this->xml_writer->xmlElement('getTaskActive', null, $this->object->getTaskActive());
		$this->xml_writer->xmlElement('getTask', null, $this->object->getTask());
		$this->xml_writer->xmlElement('getLearningProgressMode', null, $this->object->getLearningProgressMode());
		$this->xml_writer->xmlElement('noComment', null, $this->object->getEnableComment());
		$this->xml_writer->xmlElement('noToolbar', null, $this->object->getEnableToolbar());
		$this->xml_writer->xmlElement('showTocFirst', null, $this->object->getShowTocFirst());
		$this->xml_writer->xmlElement('fixedModal', null, (int)$this->object->isFixedModal());
		$this->xml_writer->xmlElement('autoResumeAfterQuestion', null, (int)$this->object->isAutoResumeAfterQuestion());
		$this->xml_writer->xmlElement('studentMarker', null, $this->object->getMarkerForStudents());
		$this->xml_writer->xmlElement('noCommentStream', null, $this->object->getNoCommentStream());
		$this->xml_writer->xmlElement('layoutWidth', null, $this->object->getLayoutWidth());;

		$this->exportQuestions();
        $this->exportChapters();
		$this->exportVideoSourceObject();
		$this->xml_writer->xmlEndTag('Settings');
	}

	private function exportVideoSourceObject(): void
	{
        $this->object->initObject();
		$src_id = $this->object->getSourceId();
		$this->xml_writer->xmlStartTag('VideoSource', ['source_id' => $src_id]);
		$this->xml_writer->xmlElement('VideoSourceObject', null, $src_id);
		$obj = $this->object->getVideoSourceObject($src_id);
		$obj->doExportVideoSource($this->obj_id, $this->xml_writer, $this->export_dir);
		$this->xml_writer->xmlEndTag('VideoSource');
	}

    private function exportChapters(): void
    {
        /**
         * @var $ilDB   ilDB
         */
        global $ilDB;
        $this->xml_writer->xmlStartTag('Chapters');
        $comments = $this->object->getCommentsTableData();
        if(count($comments) > 0)
        {
            foreach($comments as $key => $comment)
            {
                if(isset($comment['is_table_of_content']) && $comment['is_table_of_content'] == '1') {
                    $this->xml_writer->xmlStartTag('Chapter');
                    if(is_array($comment) && count($comment) > 0)
                    {
                        $this->xml_writer->xmlElement('CommentId', null, (int) $comment['comment_id']);
                        $this->xml_writer->xmlElement('CommentIsTutor', null, (int) $comment['is_tutor']);
                        $this->xml_writer->xmlElement('CommentIsInteractive', null, (int) $comment['is_interactive']);
                        $this->xml_writer->xmlElement('CommentTime', null, (int) $comment['comment_time']);
                        $this->xml_writer->xmlElement('CommentText', null, (string) $comment['comment_text']);
                        $this->xml_writer->xmlElement('CommentTitle', null, (string) $comment['title']);
                        $this->xml_writer->xmlElement('CommentTimeEnd', null, (int) $comment['comment_time_end']);
                        $this->xml_writer->xmlElement('CommentIsReplyTo', null, (string) $comment['is_reply_to']);
                        $this->xml_writer->xmlElement('CommentIsTableOfContent', null, (int) $comment['is_table_of_content']);
                        $this->xml_writer->xmlElement('CommentMarker', null, (int) $comment['marker']);
                        $this->xml_writer->xmlElement('CommentType', null, (int) $comment['type']);
                        $this->xml_writer->xmlElement('CommentUserId', null, (int) $comment['user_id']);
                        $this->xml_writer->xmlElement('CommentUserEmail', null, (string) $comment['user_email']);
                        $this->xml_writer->xmlElement('CommentUserFirstName', null, (int) $comment['user_first_name']);
                        $this->xml_writer->xmlElement('CommentUserNamePresentation', null, (int) $comment['user_name_presentation']);
                        $this->xml_writer->xmlElement('CommentUserSurname', null, (int) $comment['user_surname']);
                        $this->xml_writer->xmlElement('CommentUserUserName', null, (int) $comment['user_user_name']);
                    }
                    $this->xml_writer->xmlEndTag('Chapter');
                }
            }
        }
        $this->xml_writer->xmlEndTag('Chapters');
    }
	private function exportQuestions(): void
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		$this->xml_writer->xmlStartTag('Questions');
		$simple_questions = new SimpleChoiceQuestion();
		$question_ids = $simple_questions->getInteractiveQuestionIdsByObjId($this->obj_id);
		if(is_array($question_ids) && count($question_ids) > 0)
		{
			foreach($question_ids as $key => $qid)
			{
				$this->xml_writer->xmlStartTag('Question');
				$row = $simple_questions->readQuestionById($qid);
				if(is_array($row) && count($row) > 0)
				{
					$this->xml_writer->xmlElement('CommentId', null, (int) $row['comment_id']);
					$this->xml_writer->xmlElement('CommentIsTutor', null, (int) $row['is_tutor']);
					$this->xml_writer->xmlElement('CommentIsInteractive', null, (int) $row['is_interactive']);
					$this->xml_writer->xmlElement('CommentTime', null, (int) $row['comment_time']);
					$this->xml_writer->xmlElement('CommentText', null, (string) $row['comment_text']);
					$this->xml_writer->xmlElement('CommentTitle', null, (string) $row['comment_title']);
					$this->xml_writer->xmlElement('CommentTags', null, (string) $row['comment_tags']);
					$this->xml_writer->xmlElement('CommentIsPrivate', null, (int) $row['is_private']);
					$this->xml_writer->xmlElement('CommentTimeEnd', null, (int) $row['comment_time_end']);
					$this->xml_writer->xmlElement('CommentIsReplyTo', null, (int) $row['is_reply_to']);
					$this->xml_writer->xmlElement('CommentIsTableOfContent', null, (int) $row['is_table_of_content']);
					$this->xml_writer->xmlElement('CommentMarker', null, (int) $row['marker']);

					$this->xml_writer->xmlElement('QuestionId', null, (int) $qid);
					$this->xml_writer->xmlElement('QuestionText', null, (string) $row['question_text']);
					$this->xml_writer->xmlElement('QuestionType', null, (int) $row['type']);
					$this->xml_writer->xmlElement('QuestionFeedbackCorrect', null, (string) $row['feedback_correct']);
					$this->xml_writer->xmlElement('QuestionFeedbackOneWrong', null, (string) $row['feedback_one_wrong']);
					$this->xml_writer->xmlElement('QuestionLimitAttempts', null, (int) $row['limit_attempts']);
					$this->xml_writer->xmlElement('QuestionIsJumpCorrect', null, (int) $row['is_jump_correct']);
					$this->xml_writer->xmlElement('QuestionIsJumpWrong', null, (int) $row['is_jump_wrong']);
					$this->xml_writer->xmlElement('QuestionJumpCorrectTs', null, (int) $row['jump_correct_ts']);
					$this->xml_writer->xmlElement('QuestionJumpWrongTs', null, (int) $row['jump_wrong_ts']);
					$this->xml_writer->xmlElement('QuestionShowCorrectIcon', null, (int) $row['show_correct_icon']);
					$this->xml_writer->xmlElement('QuestionShowWrongIcon', null, (int) $row['show_wrong_icon']);
					$this->xml_writer->xmlElement('QuestionShowResponseFrequency', null, (int) $row['show_response_frequency']);
					$this->xml_writer->xmlElement('QuestionCorrectRefId', null, (int) $row['feedback_correct_ref_id']);
					$this->xml_writer->xmlElement('QuestionWrongRefId', null, (int) $row['feedback_wrong_ref_id']);
					$this->xml_writer->xmlElement('QuestionRepeatQuestion', null, (int) $row['repeat_question']);
					$this->xml_writer->xmlElement('QuestionReflectionComment', null, (int) $row['reflection_question_comment']);
					$this->xml_writer->xmlElement('QuestionNeutralAnswer', null, (int) $row['neutral_answer']);
					$this->xml_writer->xmlElement('QuestionCompulsory', null, (int) $row['compulsory_question']);;
					$this->xml_writer->xmlElement('QuestionShowBestSolution', null, (int) $row['show_best_solution']);
					$this->xml_writer->xmlElement('QuestionShowBestSolutionText', null, $row['show_best_solution_text']);
					if($row['question_image'])
					{
						$path = $row['question_image'];
						if(file_exists($path))
						{
							$export_path = $this->export_dir . '/' . $qid . '/';
                            ilFileUtils::makeDirParents($export_path);
							copy($path, $export_path . basename($path));
						}
						$this->xml_writer->xmlElement('QuestionImage', ['qid' => $qid, 'file' => '/' . $qid . '/' . basename($path)]);
					}

					$this->xml_writer->xmlStartTag('Answers');
					$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_qus_text WHERE question_id = %s',
						['integer'], [(int)$qid]);
					while($row = $ilDB->fetchAssoc($res))
					{
						$this->xml_writer->xmlElement('Answer', ['text' => $row['answer'], 'correct' => $row['correct']]);
					}
					$this->xml_writer->xmlEndTag('Answers');
				}

				$this->xml_writer->xmlEndTag('Question');
			}
		}
		$this->xml_writer->xmlEndTag('Questions');
	}

}
