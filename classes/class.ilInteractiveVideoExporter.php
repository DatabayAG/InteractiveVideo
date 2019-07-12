<?php
require_once './Services/Export/classes/class.ilXmlExporter.php';

/**
 * Class ilInteractiveVideoExporter
 */
class ilInteractiveVideoExporter extends ilXmlExporter
{
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

	public function getXmlRepresentation($a_entity, $a_schema_version, $a_id)
	{
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjInteractiveVideo.php');

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

	public function exportXMLMetaData()
	{
		require_once 'Services/MetaData/classes/class.ilMD2XML.php';
		$md2xml = new ilMD2XML($this->object->getId(), 0, $this->object->getType());
		$md2xml->setExportMode(true);
		$md2xml->startExport();
		$this->xml_writer->appendXML($md2xml->getXML());
	}

	public function init()
	{

	}

	public function getValidSchemaVersions($a_entity)
	{
		return array(
			'5.2.0' => array(
				'namespace'    => 'http://www.ilias.de/',
				#'xsd_file'     => 'xtsf_5_1.xsd',
				'uses_dataset' => false,
				'min'          => '5.2.0',
				'max'          => '5.2.999'
			)
		);
	}

	public function exportPagesXML()
	{
		$attr         = array();
		$attr["Type"] = "ilInteractiveVideo";
		$this->xml_writer->xmlStartTag("ContentObject", $attr);

		// MetaData
		$this->exportXMLMetaData();

		// Settings
		$this->exportXMLSettings();

		
		$this->xml_writer->xmlEndTag("ContentObject");
	}

	private function exportXMLSettings()
	{
		$src_id = (string)$this->object->getSourceId();
		$this->xml_writer->xmlStartTag('Settings', array('video_source_id' => $src_id));

		$this->xml_writer->xmlElement('Title', null, (string)$this->object->getTitle());
		$this->xml_writer->xmlElement('Description', null, (string)$this->object->getDescription());
		$this->xml_writer->xmlElement('Online', null, (int)$this->object->isOnline());

		$this->xml_writer->xmlElement('isAnonymized', null, (int)$this->object->isAnonymized());
		$this->xml_writer->xmlElement('isRepeat', null, (int)$this->object->isRepeat());
		$this->xml_writer->xmlElement('isChronologic', null, (int)$this->object->isChronologic());
		$this->xml_writer->xmlElement('isPublic', null, (int)$this->object->isPublic());
		$this->xml_writer->xmlElement('getTaskActive', null, (int)$this->object->getTaskActive());
		$this->xml_writer->xmlElement('getTask', null, (string)$this->object->getTask());
		$this->xml_writer->xmlElement('getLearningProgressMode', null, (int)$this->object->getLearningProgressMode());
		$this->xml_writer->xmlElement('noComment', null, (int)$this->object->getDisableComment());
		$this->xml_writer->xmlElement('fixedModal', null, (int)$this->object->isFixedModal());
		$this->xml_writer->xmlElement('autoResumeAfterQuestion', null, (int)$this->object->isAutoResumeAfterQuestion());

		$this->exportQuestions();
		$this->exportVideoSourceObject();
		$this->xml_writer->xmlEndTag('Settings');
	}

	private function exportVideoSourceObject()
	{
		$src_id = (string)$this->object->getSourceId();
		$this->xml_writer->xmlStartTag('VideoSource', array('source_id' => $src_id));
		$this->xml_writer->xmlElement('VideoSourceObject', null, $src_id);
		$obj = $this->object->getVideoSourceObject($src_id);
		$obj->doExportVideoSource($this->obj_id, $this->xml_writer, $this->export_dir);
		$this->xml_writer->xmlEndTag('VideoSource');
	}

	private function exportQuestions()
	{
		/**
		 * @var $ilDB   ilDB
		 */
		global $ilDB;
		require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.SimpleChoiceQuestion.php';
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
					if($row['question_image'])
					{
						$path = $row['question_image'];
						if(file_exists($path))
						{
							$export_path = $this->export_dir . '/' . $qid . '/';
							ilUtil::makeDirParents($export_path);
							copy($path, $export_path . basename($path));
						}
						$this->xml_writer->xmlElement('QuestionImage', array('qid' => $qid, 'file' => '/Plugins/xvid/set_1/expDir_1/' . $qid . '/' . basename($path)));
					}

					$this->xml_writer->xmlStartTag('Answers');
					$res = $ilDB->queryF('SELECT * FROM rep_robj_xvid_qus_text WHERE question_id = %s',
						array('integer'), array((int)$qid));
					while($row = $ilDB->fetchAssoc($res))
					{
						$this->xml_writer->xmlElement('Answer', array('text' => $row['answer'], 'correct' => $row['correct']));
					}
					$this->xml_writer->xmlEndTag('Answers');
				}
				
				$this->xml_writer->xmlEndTag('Question');
			}
		}
		$this->xml_writer->xmlEndTag('Questions');
	}

}