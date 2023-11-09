<?php

/**
 * Class ilInteractiveVideoXMLParser
 */
class ilInteractiveVideoMediaObjectXMLParser extends ilInteractiveVideoXMLParser
{
	/**
	 * @var ilInteractiveVideoYoutube
	 */
	protected $mob_obj;
	

	/**
	 * @param ilInteractiveVideoMediaObject $media_obj
	 * @param                      $xmlFile
	 */
	public function __construct($media_obj, $xmlFile)
	{
		$this->mob_obj = $media_obj;
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
			case 'VideoSourceObject':
				$this->cdata = '';
				break;
			case 'Identifier':
				$path_part = $this->fetchAttribute($tagAttributes, 'Entry');
				$this->mob_obj->import_part_path = $path_part;
				$this->cdata = '';
				break;
			case 'Title':
				$this->cdata = '';
				break;
			case 'Location':
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
			case 'VideoSourceObject':
				$tmp = trim($this->cdata);
				break;
			case 'Identifier':
				$tmp = trim($this->cdata);
				break;
			case 'Title':
				$tmp = trim($this->cdata);
				break;
			case 'Location':
				$this->mob_obj->import_file_name = trim($this->cdata);
				
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