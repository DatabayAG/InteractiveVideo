<?php

/**
 * Interface ilInteractiveVideoSource
 */
interface ilInteractiveVideoSource
{
	/**
	 * @param $obj_id
	 */
	public function doCreateVideoSource($obj_id);

	/**
	 * @param $obj_id
	 */
	public function doReadVideoSource($obj_id);

	/**
	 * @param $obj_id
	 */
	public function doDeleteVideoSource($obj_id);

	/**
	 * @param $original_obj_id
	 * @param $new_obj_id
	 */
	public function doCloneVideoSource($original_obj_id, $new_obj_id);

	/**
	 * @param $obj_id
	 */
	public function doUpdateVideoSource($obj_id);

	/**
	 * @param $obj_id
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
	 * @return string
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
}