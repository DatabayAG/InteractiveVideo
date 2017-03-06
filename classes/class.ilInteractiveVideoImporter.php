<?php
require_once './Services/Export/classes/class.ilXmlImporter.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjInteractiveVideo.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilInteractiveVideoXMLParser.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('../VideoSources/class.ilInteractiveVideoSourceFactory.php');
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
		global $tree;

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
			$this->xvid_object->create(true);
		}
		$a_mapping->addMapping('Plugins/xvid', 'xvid', $a_id, $this->xvid_object->getId());
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