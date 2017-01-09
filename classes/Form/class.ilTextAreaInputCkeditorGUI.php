<?php
require_once 'Services/Form/classes/class.ilTextAreaInputGUI.php';

/**
 * Class ilTextAreaInputCkeditorGUI
 */
class ilTextAreaInputCkeditorGUI extends ilTextAreaInputGUI
{

	/**
	 * ilTextAreaInputCkeditorGUI constructor.
	 */
	public function __construct($a_title = "", $a_postvar = "")
	{
		parent::__construct($a_title, $a_postvar);
		$this->setType("textarea");
	}

	/**
	 * Insert property html
	 */
	function insert(&$a_tpl)
	{
		$this->appendJavascriptFile();
		$ttpl = new ilTemplate("tpl.textarea_ckeditor.html", true, true, "Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/");

		$ttpl->setVariable("PROPERTY_VALUE", ilUtil::prepareFormOutput($this->getValue()));
		$ttpl->setVariable("FIELD_ID", $this->getFieldId());
		$ttpl->setVariable("FIELD_NAME", $this->getPostVar());

		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $ttpl->get());
		$a_tpl->parseCurrentBlock();

	}
	
	public static function appendJavascriptFile()
	{
		/**
		 * @var $tpl ilTemplate
		 */
		global $tpl;
		$tpl->addJavaScript('./Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/libs/ckeditor/ckeditor.js');

	}
}