<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSource.php';
/**
 * Class ilInteractiveVideoMediaObject
 */
class ilInteractiveVideoMediaObject implements ilInteractiveVideoSource
{

	/**
	 * @param $obj_id
	 */
	public function getVideoSource($obj_id)
	{
		// TODO: Implement getVideoSource() method.
	}

	/**
	 * @param $obj_id
	 */
	public function deleteVideoSource($obj_id)
	{
		// TODO: Implement deleteVideoSource() method.
	}

	/**
	 * @param $original_obj_id
	 * @param $new_obj_id
	 */
	public function cloneVideoSource($original_obj_id, $new_obj_id)
	{
		// TODO: Implement cloneVideoSource() method.
	}

	/**
	 * @return string
	 */
	public function getType()
	{
		return __CLASS__;
	}

	/**
	 * @return bool
	 */
	public function isActivated()
	{
		return true;
	}

	/**
	 * @return bool
	 */
	public function isFileBased()
	{
		return true;
	}

	/**
	 * @return string
	 */
	public function getGUIClass()
	{
		require_once dirname(__FILE__) . '/class.ilInteractiveVideoMediaObjectGUI.php';
		return new ilInteractiveVideoMediaObjectGUI();
	}

	/**
	 * @return string
	 */
	public function getId()
	{
		return 'media_object';
	}
}