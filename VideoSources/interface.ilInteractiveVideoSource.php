<?php

/**
 * Interface ilInteractiveVideoSource
 * @author Guido Vollbach <gvollbach@databay.de>
 */
interface ilInteractiveVideoSource
{
	public function doCreateVideoSource(int $obj_id);

	public function doReadVideoSource(int $obj_id);

	public function doDeleteVideoSource($obj_id) : int;

	public function doCloneVideoSource(int $original_obj_id, int $new_obj_id);

	public function doUpdateVideoSource(int $obj_id);

	public function beforeDeleteVideoSource($obj_id) : int;

	public function getClass() : string;

	public function getId() : string;

	public function isFileBased() : bool;

	public function hasOwnPlayer() : bool;

	public function getGUIClass() : ilInteractiveVideoSourceGUI;

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
