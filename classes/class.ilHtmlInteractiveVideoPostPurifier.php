<?php
/* Copyright (c) 1998-2009 ILIAS open source, Extended GPL, see docs/LICENSE */

require_once 'Services/Html/classes/class.ilHtmlPurifierAbstractLibWrapper.php';

/**
 * Class ilHtmlInteractiveVideoPostPurifier
 */
class ilHtmlInteractiveVideoPostPurifier extends ilHtmlPurifierAbstractLibWrapper
{	
	/** 
	* Type of purifier
	* 
	* @var		string
	* @type		string 
	* @access	public
	* @static
	* 
	*/
	public static $_type = 'textarea';
	
	/** 
	* Constructor
	* 
	* @access	public
	* 
	*/
	public function __construct()
	{
		parent::__construct();
	}
	
	/** 
	* Concrete function which builds a html purifier config instance
	* 
	* @access	protected
	* @return	HTMLPurifier_Config Instance of HTMLPurifier_Config
	* 
	*/
	protected function getPurifierConfigInstance() : HTMLPurifier_Config
	{
		include_once 'Services/AdvancedEditing/classes/class.ilObjAdvancedEditing.php';
		
		$config = HTMLPurifier_Config::createDefault();
		$config->set('HTML.DefinitionID', 'ilias interactivevideo post');
		$config->set('HTML.DefinitionRev', 1);
		$config->set('HTML.TargetBlank', true);
		$config->set('Cache.SerializerPath', ilHtmlPurifierAbstractLibWrapper::_getCacheDirectory());
		$config->set('HTML.Doctype', 'XHTML 1.0 Strict');		
		
		$tags = ilObjAdvancedEditing::_getUsedHTMLTags(self::$_type);
		$tags = $this->makeElementListTinyMceCompliant($tags);
		$config->set('HTML.AllowedElements', $this->removeUnsupportedElements($tags));
		$config->set('HTML.ForbiddenAttributes', 'div@style');
		
		if ($def = $config->maybeGetRawHTMLDefinition()) {		
			$def->addAttribute('a', 'target', 'Enum#_blank,_self,_target,_top');			
		}		

		return $config;
	}	
}