<?php
require_once 'Services/Xml/classes/class.ilSaxParser.php';

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
	 * @param ilObjInteractiveVideo $xvid_obj
	 * @param                      $xmlFile
	 */
	public function __construct($xvid_obj, $xmlFile)
	{
		$this->xvid_obj = $xvid_obj;
		$this->inSettingsTag  = false;
		$this->inMetaDataTag  = false;
		$this->inMdGeneralTag  = false;
		$this->inVideoSourceTag  = false;
		parent::__construct($xmlFile);
	}



	/**
	 * @param $xmlParser
	 * @param $tagName
	 * @param $tagAttributes
	 */
	public function handlerBeginTag($xmlParser, $tagName, $tagAttributes)
	{
		$a = 0;
		switch($tagName)
		{
			case 'MetaData':
				$this->inMetaDataTag = true;
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
				break;

			case 'VideoSource':
				$this->inVideoSourceTag = true;
				break;	

			case 'Online':
			case 'SkillService':
			case 'isAnonymized':
			case 'isRepeat':
			case 'isChronologic':
			case 'getTaskActive':
			case 'getTask':
			case 'getLearningProgressMode':
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
	public function handlerEndTag($xmlParser, $tagName)
	{
		$a = 0;
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
				if($this->inMetaDataTag && $this->inMdGeneralTag)
				{
					$this->xvid_obj->setTitle(trim($this->cdata));
					$this->cdata = '';
				}
				break;

			case 'Description':
				if($this->inMetaDataTag && $this->inMdGeneralTag)
				{
					$this->xvid_obj->setDescription(trim($this->cdata));
					$this->cdata = '';
				}
				break;

			case 'Settings':
				$this->inSettingsTag = false;
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
			case 'SourceId':
				$this->xvid_obj->setSourceId(trim($this->cdata));
				$this->cdata = '';
				break;
			case 'VideoSource':
				$this->xvid_obj->setVideoSourceImportObject(trim($this->cdata));
				$this->cdata = '';
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
	 * @param	string	import directory
	 */
	public function setImportDirectory($a_val)
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

	public function handlerCharacterData($xmlParser, $charData)
	{
		if($charData != "\n")
		{
			// Replace multiple tabs with one space
			$charData = preg_replace("/\t+/", " ", $charData);

			$this->cdata .= $charData;
		}
	}
}