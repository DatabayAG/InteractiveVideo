<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilInteractiveVideoXMLParser.php';

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
	public function handlerBeginTag($xmlParser, $tagName, $tagAttributes)
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
	public function handlerEndTag($xmlParser, $tagName)
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
	public function setHandlers($xmlParser)
	{
		xml_set_object($xmlParser, $this);
		xml_set_element_handler($xmlParser, 'handlerBeginTag', 'handlerEndTag');
		xml_set_character_data_handler($xmlParser, 'handlerCharacterData');
	}

}