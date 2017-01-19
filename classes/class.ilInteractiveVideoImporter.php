<?php
require_once './Services/Export/classes/class.ilXmlImporter.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjInteractiveVideo.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilInteractiveVideoXMLParser.php');
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

	public function init()
	{
		$this->qti_path = $this->getImportDirectory().'/Plugins/xvid/set_1/expDir_1';
		$this->xml_file = $this->getImportDirectory().'/Plugins/xvid/set_1/export.xml';
	}
	
	public function importXmlRepresentation($a_entity, $a_id, $a_xml, $a_mapping)
	{
		$this->init();
		$this->xvid_object = new ilObjInteractiveVideo();
		$parser = new ilInteractiveVideoXMLParser($this->xvid_object, $this->getXmlFile());
		$parser->setImportDirectory($this->getImportDirectory());
		$parser->startParsing();
		$this->xvid_object = $parser->getObjInteractiveVideo();
		$this->xvid_object->createFromImport();
	}

	/**
	 * @param $xml_file
	 */
	private function setXmlFile($xml_file)
	{
		$this->xml_file = $xml_file;
	}

	public function getXmlFile()
	{
		return $this->xml_file;
	}


}