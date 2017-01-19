<?php
require_once './Services/Export/classes/class.ilXmlExporter.php';

/**
 * Class ilInteractiveVideoExporter
 */
class ilInteractiveVideoExporter extends ilXmlExporter
{
	/**
	 * @var ilXmlWriter
	 */
	protected $xml_writer = null;

	/**
	 * @var ilObjInteractiveVideo | null
	 */
	protected $object = null;

	/**
	 * @var int
	 */
	protected $obj_id;
	
	/**
	 * @var string
	 */
	protected $export_dir;

	/**
	 * @var string
	 */
	protected $sub_dir;

	/**
	 * @var string
	 */
	protected $filename;

	public function getXmlRepresentation($a_entity, $a_schema_version, $a_id)
	{
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjInteractiveVideo.php');

		$ref_id = current(ilObject::_getAllReferences($a_id));
		$this->obj_id		= $a_id;
		$this->object		= new ilObjInteractiveVideo($ref_id);
		$this->xml_writer	= new ilXmlWriter();
		$this->export_dir	= $this->getAbsoluteExportDirectory();
		$date				= time();
		$this->sub_dir		= $date . '_' . IL_INST_ID . '_' . "xvid" . '_' . $a_id;
		$this->filename		= $this->sub_dir . ".xml";
		ilUtil::makeDirParents($this->sub_dir);

		$this->exportPagesXML();

		return $this->xml_writer->xmlDumpMem();
	}

	public function exportXMLMetaData()
	{
		require_once 'Services/MetaData/classes/class.ilMD2XML.php';
		$md2xml = new ilMD2XML($this->object->getId(), 0, $this->object->getType());
		$md2xml->setExportMode(true);
		$md2xml->startExport();
		$this->xml_writer->appendXML($md2xml->getXML());
	}

	public function init()
	{
		// TODO: Implement init() method.
	}

	public function getValidSchemaVersions($a_entity)
	{
		return array(
			'5.2.0' => array(
				'namespace'    => 'http://www.ilias.de/',
				#'xsd_file'     => 'xtsf_5_1.xsd',
				'uses_dataset' => false,
				'min'          => '5.2.0',
				'max'          => '5.2.999'
			)
		);
	}

	public function exportPagesXML()
	{
		$attr         = array();
		$attr["Type"] = "ilInteractiveVideo";
		$this->xml_writer->xmlStartTag("ContentObject", $attr);

		// MetaData
		$this->exportXMLMetaData();

		// Settings
		$this->exportXMLSettings();

		
		$this->xml_writer->xmlEndTag("ContentObject");
	}

	private function exportXMLSettings()
	{
		$this->xml_writer->xmlStartTag('Settings');

		$this->xml_writer->xmlElement('Title', null, (string)$this->object->getTitle());
		$this->xml_writer->xmlElement('Description', null, (string)$this->object->getDescription());
		$this->xml_writer->xmlElement('Online', null, (int)$this->object->isOnline());

		$this->xml_writer->xmlElement('isAnonymized', null, (int)$this->object->isAnonymized());
		$this->xml_writer->xmlElement('isRepeat', null, (int)$this->object->isRepeat());
		$this->xml_writer->xmlElement('isChronologic', null, (int)$this->object->isChronologic());
		$this->xml_writer->xmlElement('isPublic', null, (int)$this->object->isPublic());
		$this->xml_writer->xmlElement('getTaskActive', null, (int)$this->object->getTaskActive());
		$this->xml_writer->xmlElement('getTask', null, (string)$this->object->getTask());
		$this->xml_writer->xmlElement('getLearningProgressMode', null, (int)$this->object->getLearningProgressMode());

		$this->exportVideoSourceObject();

		$this->xml_writer->xmlEndTag('Settings');
	}

	private function exportVideoSourceObject()
	{
		$src_id = (string)$this->object->getSourceId();
		$this->xml_writer->xmlStartTag('VideoSource');
		$this->xml_writer->xmlElement('SourceId', null, $src_id);
		$this->xml_writer->xmlElement('VideoSourceObject', null, $src_id);
		$obj = $this->object->getVideoSourceObject($src_id);
		$obj->doExportVideoSource($this->obj_id, $this->xml_writer, $this->export_dir);
		$this->xml_writer->xmlEndTag('VideoSource');
	}

}