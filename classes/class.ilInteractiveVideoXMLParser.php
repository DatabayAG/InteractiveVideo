<?php
/**
 * Class ilInteractiveVideoXMLParser
 */
class ilInteractiveVideoXMLParser extends ilSaxParser
{
	/**
	 * @var ilObjInteractiveVideo
	 */
	protected $xvid_obj;

	/**
	 * @var bool
	 */
	protected $inSettingsTag;

	/**
	 * @var bool
	 */
	protected $inMetaDataTag;

	/**
	 * @var bool
	 */
	protected $inMdGeneralTag;

	/**
	 * @var bool
	 */
	protected $inVideoSourceTag;

	/**
	 * @var bool
	 */
	protected $inQuestionsTag;

	/**
	 * @var string
	 */
	protected $video_src_id;

    protected string $cdata = '';

    /**
     * @param ilObjInteractiveVideo $xvid_obj
     * @param string|null           $xmlFile
     */
	public function __construct($xvid_obj, ?string $xmlFile)
	{
		$this->xvid_obj			= $xvid_obj;
		$this->inSettingsTag	= false;
		$this->inMetaDataTag	= false;
		$this->inMdGeneralTag	= false;
		$this->inVideoSourceTag	= false;
		$this->inQuestionsTag	= false;
		parent::__construct($xmlFile);
	}



	/**
	 * @param $xmlParser
	 * @param $tagName
	 * @param $tagAttributes
	 */
	public function handlerBeginTag($xmlParser, $tagName, $tagAttributes): void
	{
		$a = 0;
		switch($tagName)
		{
			case 'MetaData':
				#$this->inMetaDataTag = true;
				break;

			case 'General':
				if($this->inMetaDataTag)
				{
					$this->inMdGeneralTag = true;
				}
				break;

			case 'Description':
				if($this->inMetaDataTag && $this->inMdGeneralTag)
				{
					$this->cdata = '';
				}
				break;

			case 'Settings':
				$this->inSettingsTag = true;
				$video_src_id = $this->fetchAttribute($tagAttributes, 'video_source_id');
				$this->video_src_id = $video_src_id;
				$this->xvid_obj->setSourceId($video_src_id);
				$factory = new ilInteractiveVideoSourceFactory();
				$obj = $factory->getVideoSourceObject($video_src_id);
				if($obj == null)
				{
					global $ilErr;
					$ilErr->raiseError(sprintf('Video source with the id "%s" does not exist in this installation.', $video_src_id));
				}
				break;
			case 'Questions':
				$this->xvid_obj->setSourceId($this->video_src_id);
				$tmp = new ilInteractiveVideoSimpleChoiceQuestionsXMLParser($this->xvid_obj, $xmlParser);
				$this->inQuestionsTag = true;
				break;
			case 'Online':
			case 'SkillService':
			case 'isAnonymized':
			case 'isRepeat':
			case 'isChronologic':
			case 'getTaskActive':
			case 'getTask':
			case 'getLearningProgressMode':
			case 'noCommentStream':
			case 'noComment':
			case 'noToolbar':
			case 'showTocFirst':
			case 'fixedModal':
			case 'autoResumeAfterQuestion':
			case 'studentMarker':
				if($this->inSettingsTag)
				{
					$this->cdata = '';
				}
				break;
			case 'SetId':
			case 'SetTitle':
			case 'SetDescription':
			case 'OriginalId':
			case 'SourceId':
				$this->cdata = '';
				break;
		}
	}

	/**
	 * @param $xmlParser
	 * @param $tagName
	 */
	public function handlerEndTag($xmlParser, $tagName): void
	{
		switch($tagName)
		{
			case 'MetaData':
				$this->inMetaDataTag = false;
				break;

			case 'General':
				if($this->inMetaDataTag)
				{
					$this->inMdGeneralTag = false;
				}
				break;

			case 'Title':
				#if($this->inMetaDataTag && $this->inMdGeneralTag)
				{
					$this->xvid_obj->setTitle(trim($this->cdata));
					$this->cdata = '';
				}
				break;

			case 'Description':
				#if($this->inMetaDataTag && $this->inMdGeneralTag)
				{
					$this->xvid_obj->setDescription(trim($this->cdata));
					$this->cdata = '';
				}
				break;

			case 'Settings':
				if($this->inSettingsTag)
				{
					$this->inSettingsTag = false;
				}
				break;

			case 'Questions':
				if($this->inQuestionsTag)
				{
					$this->inQuestionsTag = false;
				}
				break;

			case 'Online':
				$this->xvid_obj->setOnline((bool)trim($this->cdata));
				$this->cdata = '';
				break;

			case 'isAnonymized':
				$this->xvid_obj->setIsAnonymized((bool)trim($this->cdata));
				$this->cdata = '';
				break;
			case 'isRepeat':
				$this->xvid_obj->setIsRepeat(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'isChronologic':
				$this->xvid_obj->setIsChronologic(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'isPublic':
				$this->xvid_obj->setIsPublic(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'getTaskActive':
				$this->xvid_obj->setTaskActive(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'getTask':
				$this->xvid_obj->setTask(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'getLearningProgressMode':
				$this->xvid_obj->setLearningProgressMode(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'noComment':
				$this->xvid_obj->setEnableComment(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'noToolbar':
				$this->xvid_obj->setEnableToolbar(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'noCommentStream':
				$this->xvid_obj->setNoCommentStream(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'fixedModal':
				$this->xvid_obj->setFixedModal(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'autoResumeAfterQuestion':
				$this->xvid_obj->setAutoResumeAfterQuestion(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'show_toc_first':
				$this->xvid_obj->setShowTocFirst(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'studentMarker':
			#	$this->xvid_obj->setMarkerForStudents(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'SourceId':
				$this->xvid_obj->setSourceId(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'VideoSource':
				$this->inVideoSourceTag = false;
				#$this->cdata = '';
				break;
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

    /**
     * @param $a_xml_parser
     */
    public function setHandlers($a_xml_parser) : void
	{
		xml_set_object($a_xml_parser, $this);
		xml_set_element_handler($a_xml_parser, 'handlerBeginTag', 'handlerEndTag');
		xml_set_character_data_handler($a_xml_parser, 'handlerCharacterData');
	}

	/**
	 * @return ilObjInteractiveVideo
	 */
	public function getObjInteractiveVideo()
	{
		return $this->xvid_obj;
	}

	/**
	 * Set import directory
	 *
	 * @param	string $a_val import directory
	 */
	public function setImportDirectory(string $a_val)
	{
		$this->importDirectory = $a_val;
	}

	/**
	 * Get import directory
	 *
	 * @return	string	import directory
	 */
	public function getImportDirectory()
	{
		return $this->importDirectory;
	}

	public function handlerCharacterData($xmlParser, $charData): void
	{
		if($charData != "\n")
		{
			// Replace multiple tabs with one space
			$charData = preg_replace("/\t+/", " ", $charData);

			$this->cdata .= $charData;
		}
	}
}
