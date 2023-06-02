<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilInteractiveVideoXMLParser.php';

/**
 * Class ilInteractiveVideoXMLParser
 */
class ilInteractiveVideoYoutubeXMLParser extends ilInteractiveVideoXMLParser
{
	/**
	 * @var ilInteractiveVideoYoutube
	 */
	protected $youtube_obj;
	

	/**
	 * @param ilInteractiveVideoYoutube $youtube_obj
	 * @param                      $xmlFile
	 */
	public function __construct($youtube_obj, $xmlFile)
	{
		$this->youtube_obj = $youtube_obj;
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
			case 'YoutubeId':
			case 'VideoSourceObject':
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
		switch($tagName)
		{
			case 'YoutubeId':
				$this->youtube_obj->setYoutubeId(trim($this->cdata));
				break;
			case 'VideoSourceObject':
				$tmp = trim($this->cdata);
				break;
			case 'VideoSource':
				$this->inVideoSourceTag = false;
				parent::setHandlers($xmlParser);
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
	 * @param $xmlParser
	 */
    public function setHandlers($a_xml_parser): void
    {
        xml_set_object($a_xml_parser, $this);
        xml_set_element_handler($a_xml_parser, 'handlerBeginTag', 'handlerEndTag');
        xml_set_character_data_handler($a_xml_parser, 'handlerCharacterData');
    }
	
}