<?php

/**
 * Class ilInteractiveVideoImporter
 */
class ilInteractiveVideoImporter extends ilXmlImporter
{
	/**
	 * @var ilObjInteractiveVideo | null
	 */
	protected $xvid_object = null;

	/**
	 * @var string
	 */
	protected $xml_file;

    public function init(): void
	{
		$this->qti_path = $this->getImportDirectory().'/Plugins/xvid/set_1/expDir_1';
		$this->xml_file = $this->getImportDirectory().'/Plugins/xvid/set_1/export.xml';
	}

    /**
     * @param string          $a_entity
     * @param string          $a_id
     * @param string          $a_xml
     * @param ilImportMapping $a_mapping
     * @return void
     * @throws ilDatabaseException
     * @throws ilObjectNotFoundException
     * @throws ilSaxParserException
     */
    public function importXmlRepresentation(
        string $a_entity,
        string $a_id,
        string $a_xml,
        ilImportMapping $a_mapping
    ): void
	{
        global $tree, $ilDB;

		$this->init();

		if($new_id = $a_mapping->getMapping('Services/Container', 'objs', $a_id))
		{
			$ref_ids = ilObject::_getAllReferences($new_id);
			$ref_id  = current($ref_ids);

			$parent_ref_id = $tree->getParentId($ref_id);

			$this->xvid_object = ilObjectFactory::getInstanceByObjId($new_id, false);
			$this->xvid_object->setRefId($ref_id);
		}
		else
		{
			$this->xvid_object = new ilObjInteractiveVideo();
			$parser = new ilInteractiveVideoXMLParser($this->xvid_object, $this->getXmlFile());
			$parser->setImportDirectory($this->getImportDirectory());
			$parser->startParsing();
			$this->xvid_object = $parser->getObjInteractiveVideo();

			$this->xvid_object->create();
			$factory = new ilInteractiveVideoSourceFactory();
			$source_obj = $factory->getVideoSourceObject($this->xvid_object->getSourceId());
			$source_obj->afterImportParsing($this->xvid_object->getId(), $this->import_directory);
			$comment_map = [];
			foreach($this->xvid_object->import_comment as $key => $comment)
			{
				$comment->setObjId($this->xvid_object->getId());
				$cid = $comment->create(true);
				$comment_map[$key] = $cid;
			}
			foreach($this->xvid_object->import_simple_choice as $key => $question)
			{
				if(array_key_exists($key, $comment_map))
				{
					$question->setCommentId($comment_map[$key]);
					if($question->import_question_image != null)
					{
						$file = ilInteractiveVideoFFmpeg::moveSelectedImage($question->getCommentId(), $this->xvid_object->getId(), $this->import_directory . $question->import_question_image);
						$question->setQuestionImage($file);
					}

					$question_id = $question->create();
					foreach($question->import_answers as $answer_key => $answer)
					{
						$answer_id = $ilDB->nextId('rep_robj_xvid_qus_text');
						$ilDB->insert('rep_robj_xvid_qus_text',
							[
                                'answer_id'   => ['integer', $answer_id],
                                'question_id' => ['integer', $question_id],
                                'answer'      => ['text', ilInteractiveVideoPlugin::stripSlashesWrapping($answer['text'])],
                                'correct'     => ['integer', (int) $answer['correct']]
                            ]);
					}
				}
			}
		}
		$a_mapping->addMapping('Plugins/xvid', 'xvid', $a_id, $this->xvid_object->getId());
	}

    /**
     * @param string $xml_file
     */
	private function setXmlFile(string $xml_file): void
	{
		$this->xml_file = $xml_file;
	}

	public function getXmlFile(): string
	{
		return $this->xml_file;
	}


}