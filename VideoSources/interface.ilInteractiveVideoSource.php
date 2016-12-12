<?php

/**
 * Interface ilInteractiveVideoSource
 */
interface ilInteractiveVideoSource
{

	/**
	 * @param $obj_id
	 */
	public function getVideoSource($obj_id);

	/**
	 * @param $obj_id
	 */
	public function deleteVideoSource($obj_id);

	/**
	 * @param $original_obj_id
	 * @param $new_obj_id
	 */
	public function cloneVideoSource($original_obj_id, $new_obj_id);

	/**
	 * @return string
	 */
	public function getType();

	/**
	 * @return string
	 */
	public function getId();

	/**
	 * @return bool
	 */
	public function isActivated();

	/**
	 * @return bool
	 */
	public function isFileBased();

	/**
	 * @return string
	 */
	public function getGUIClass();
}