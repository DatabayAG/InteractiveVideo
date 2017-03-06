<?php

/**
 * Interface ilInteractiveVideoSource
 * @author Guido Vollbach <gvollbach@databay.de>
 */
interface ilInteractiveVideoSource
{
	/**
	 * @param integer $obj_id
	 */
	public function doCreateVideoSource($obj_id);

	/**
	 * @param integer $obj_id
	 */
	public function doReadVideoSource($obj_id);

	/**
	 * @param integer $obj_id
	 */
	public function doDeleteVideoSource($obj_id);

	/**
	 * @param integer $original_obj_id
	 * @param integer $new_obj_id
	 */
	public function doCloneVideoSource($original_obj_id, $new_obj_id);

	/**
	 * @param integer $obj_id
	 */
	public function doUpdateVideoSource($obj_id);

	/**
	 * @param integer $obj_id
	 */
	public function beforeDeleteVideoSource($obj_id);

	/**
	 * @return string
	 */
	public function getClass();

	/**
	 * @return string
	 */
	public function getId();

	/**
	 * @return bool
	 */
	public function isFileBased();

	/**
	 * @return ilInteractiveVideoSourceGUI
	 */
	public function getGUIClass();

	/**
	 * @return string
	 */
	public function getClassPath();

	/**
	 * @return string
	 */
	public function getVersion();

	/**
	 * @param $obj_id
	 * @return string
	 */
	public function getPath($obj_id);

	/**
	 * @param int $obj_id
	 * @param ilXmlWriter $xml_writer
	 * @param string $export_path
	 */
	public function doExportVideoSource($obj_id, $xml_writer, $export_path);

	/**
	 * @return string
	 */
	public function getVideoSourceImportParser();

	/**
	 * @param $obj_id
	 * @param $import_dir
	 * @return
	 */
	public function afterImportParsing($obj_id, $import_dir);
}