<?php

/**
 * Class ilInteractiveVideoYoutubeGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoYoutubeGUI implements ilInteractiveVideoSourceGUI
{

	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/';

	const YOUTUBE_URL = 'https://www.youtube.com/watch?v=';

	public function getForm($option, int $obj_id)
	{
        $youtube_url = new ilTextInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_url'), ilInteractiveVideoYoutube::FORM_FIELD);
        $object = new ilInteractiveVideoYoutube();
        if($obj_id > 0) {
            $youtube_url->setValue($object->doReadVideoSource($obj_id));
        }
        $youtube_url->setInfo(ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_info'));
        $option->addSubItem($youtube_url);
        return $option;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form) : bool
    {
		$value = ilUtil::stripSlashes($form->getInput(ilInteractiveVideoYoutube::FORM_FIELD));
		$youtube_id = ilInteractiveVideoYoutube::getYoutubeIdentifier($value);
		if($youtube_id)
		{
			return true;
		}
		return false;
	}

	public function addPlayerElements(ilGlobalPageTemplate $tpl) : ilGlobalPageTemplate
    {
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoYoutubePlayer.js');
		return $tpl;
	}

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @param string                $id
	 * @return ilTemplate
     */
	public function getPlayer($player_id, ilObjInteractiveVideo $obj) : ilTemplate
    {
        $player = new ilTemplate("../../VideoSources/core/Youtube/tpl/tpl.video.html", true, true, $obj->getPluginObject()->getDirectory());
		$instance = new ilInteractiveVideoYoutube();
		$player->setVariable('PLAYER_ID', $player_id);
		$player->setVariable('YOUTUBE_ID', $instance->doReadVideoSource($obj->getId()));
		$player->setVariable('INTERACTIVE_VIDEO_ID', $obj->getId());
		return $player;
	}

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, ilObjInteractiveVideo $obj)
	{
		$instance = new ilInteractiveVideoYoutube();
		$value = $instance->doReadVideoSource($obj->getId());
		if($value != '')
		{
			$value = self::YOUTUBE_URL . $value;
		}
        if($obj->getSourceId() === $instance->getId()) {
            $a_values[ilInteractiveVideoYoutube::FORM_FIELD] = $value;
        }
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function getConfigForm(ilPropertyFormGUI $form) : void
    {
	}

	/**
	 * @return boolean
	 */
	public function hasOwnConfigForm() : bool
    {
		return false;
	}

    public function getEditFormCustom(ilPropertyFormGUI $a_form, ilObjInteractiveVideo|ilObject|null $object)
    {

    }
}
