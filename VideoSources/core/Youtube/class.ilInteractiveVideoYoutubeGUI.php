<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';

/**
 * Class ilInteractiveVideoYoutubeGUI
 */
class ilInteractiveVideoYoutubeGUI implements ilInteractiveVideoSourceGUI
{

	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/';

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
		return $form;
	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl)
	{
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoYoutubePlayer.js');
		return $tpl;
	}

	/**
	 * @param ilObjInteractiveVideo $obj
	 * @return ilTemplate
	 */
	public function getPlayer($obj)
	{
		$player = new ilTemplate(self::PATH . 'tpl/tpl.video.html', false, false);
		$player->setVariable('YOUTUBE_ID', '7ZxWg0sw_BI');
		return $player;
	}

}