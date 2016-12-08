<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';

/**
 * Class ilInteractiveVideoYoutubeGUI
 */
class ilInteractiveVideoYoutubeGUI implements ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilRadioOption $option
	 * @return ilRadioOption
	 */
	public function getForm($option)
	{
		$youtube_url = new ilTextInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('youtube_url'), 'youtube_url');
		$option->addSubItem($youtube_url);
		return $option;
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
	public function addPlayerElements($tpl)
	{
		// TODO: Implement addPlayer() method.
	}

	public function getPlayer($obj)
	{
		$player = new ilTemplate('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/tpl/tpl.video.html', false, false);
		return $player;
	}

}