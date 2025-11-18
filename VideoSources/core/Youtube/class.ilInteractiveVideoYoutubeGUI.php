<?php

/**
 * Class ilInteractiveVideoYoutubeGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoYoutubeGUI implements ilInteractiveVideoSourceGUI
{

	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/Youtube/';

	const YOUTUBE_URL = 'https://www.youtube.com/watch?v=';

    /**
     * @param \ILIAS\UI\Factory $ui
     * @param int               $obj_id
     * @return array
     */
	public function getForm(ILIAS\UI\Factory $ui, int $obj_id)
	{
        $youtube_url = $ui->input()->field()->text(ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_url'), ilInteractiveVideoPlugin::getInstance()->txt('ytb_youtube_info'));
        $source_type = $ui->input()->field()->hidden()->withValue("ytb")->withDedicatedName('source');
        $object = new ilInteractiveVideoYoutube();
        if($obj_id > 0) {
            $youtube_src = $object->doReadVideoSource($obj_id);
            if($youtube_src !== 0) {
                $youtube_url->withValue($youtube_src);
            }
        }
		return ['input' => $youtube_url, 'source_type' => $source_type];
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

	public function addPlayerElements($tpl) : ilGlobalPageTemplate
    {
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoYoutubePlayer.js');
		return $tpl;
	}

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @param string                $id
	 * @return void
     */
	public function getPlayer($player_id, ilObjInteractiveVideo $obj)
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

    public function getEditFormCustom(ilPropertyFormGUI $a_form, ilObjInteractiveVideo|ilObject|null $object)
    {
        $hidden_source = new ilHiddenInputGUI(ilInteractiveVideoSimpleUrl::FORM_URL_FIELD);
        $hidden_source->setValue($object->getSourceId());
        $a_form->addItem($hidden_source);
    }
}
