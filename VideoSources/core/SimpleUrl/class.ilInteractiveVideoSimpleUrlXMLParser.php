<?php

/**
 * Class ilInteractiveVideoSimpleUrlXMLParser
 */
class ilInteractiveVideoSimpleUrlXMLParser extends ilInteractiveVideoXMLParser
{
	/**
	 * @var ilInteractiveVideoSimpleUrl
	 */
	protected $obj;
	

	/**
	 * @param ilInteractiveVideoSimpleUrl $obj
	 * @param                      $xmlFile
	 */
	public function __construct($obj, $xmlFile)
	{
		$this->obj = $obj;
		$this->setHandlers($xmlFile);
	}

	/**
	 * @param $xmlParser
	 * @param $tagName
	 * @param $tagAttributes
	 */
	public function handlerBeginTag($xmlParser, $tagName, $tagAttributes) : void
    {
		switch($tagName)
		{
			case 'SimpleURL':
			case 'VideoSourceObject':
				$this->cdata = '';
				break;
		}
	}

	/**
	 * @param $xmlParser
	 * @param $tagName
	 */
	public function handlerEndTag($xmlParser, $tagName) : void
    {
		switch($tagName)
		{
			case 'SimpleURL':
				$this->obj->setSimpleUrl(trim($this->cdata));
				break;
			case 'VideoSourceObject':
				$tmp = $this->cdata;
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