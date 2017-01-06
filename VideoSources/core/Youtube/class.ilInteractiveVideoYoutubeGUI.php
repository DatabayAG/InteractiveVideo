<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/class.ilInteractiveVideoYoutube.php';

/**
 * Class ilInteractiveVideoYoutubeGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoYoutubeGUI implements ilInteractiveVideoSourceGUI
{

	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/';

	const YOUTUBE_URL = 'https://www.youtube.com/watch?v=';

	/**
	 * @param ilRadioOption $option
	 * @param               $obj_id
	 * @return ilRadioOption
	 */
	public function getForm($option, $obj_id)
	{
		$youtube_url = new ilTextInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_url'), ilInteractiveVideoYoutube::FORM_FIELD);
		$object = new ilInteractiveVideoYoutube();
		$youtube_url->setValue($object->doReadVideoSource($obj_id));
		$youtube_url->setInfo(ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_info'));
		$option->addSubItem($youtube_url);
		return $option;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form)
	{
		$value = ilUtil::stripSlashes($form->getInput(ilInteractiveVideoYoutube::FORM_FIELD));
		$youtube_id = ilInteractiveVideoYoutube::getYoutubeIdentifier($value);
		if($youtube_id)
		{
			return true;
		}
		return false;
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
		$instance = new ilInteractiveVideoYoutube();
		$player->setVariable('YOUTUBE_ID', $instance->doReadVideoSource($obj->getId()));
		return $player;
	}

	/**
	 * @param array $a_values
	 * @param       $obj
	 */
	public function getEditFormCustomValues(array &$a_values, $obj)
	{
		$instance = new ilInteractiveVideoYoutube();
		$value = $instance->doReadVideoSource($obj->getId());
		if($value != '')
		{
			$value = self::YOUTUBE_URL . $value;
		}
		$a_values[ilInteractiveVideoYoutube::FORM_FIELD] = $value;
	}

	/**
	 * @param $form
	 */
	public function getConfigForm($form)
	{
	}

	/**
	 * @return boolean
	 */
	public function hasOwnConfigForm()
	{
		return false;
	}
}