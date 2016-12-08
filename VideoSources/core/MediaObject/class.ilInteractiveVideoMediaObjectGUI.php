<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';

/**
 * Class ilInteractiveVideoMediaObjectGUI
 */
class ilInteractiveVideoMediaObjectGUI implements ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function getForm($form)
	{
		$upload_field = new ilFileInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov', 'mp3', 'flv', 'm4v', 'ogg', 'ogv', 'webm'));
		$form->addItem($upload_field);
		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form)
	{
		// TODO: Implement checkForm() method.
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function saveForm($form)
	{
		// TODO: Implement saveForm() method.
	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayer($tpl)
	{
		// TODO: Implement addPlayer() method.
	}

}