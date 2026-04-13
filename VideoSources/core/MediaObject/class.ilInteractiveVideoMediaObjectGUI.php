<?php

/**
 * Class ilInteractiveVideoMediaObjectGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoMediaObjectGUI implements ilInteractiveVideoSourceGUI
{
	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/MediaObject/';

    /**
     * @param     $option
     * @param int $obj_id
     * @return ilRadioOption
     */
    public function getForm($option, int $obj_id) : ilRadioOption
    {
		$upload_field = new ilFileInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('video_file'), 'video_file');
		$upload_field->setSuffixes(array('mp4', 'mov', 'mp3', 'flv', 'm4v', 'ogg', 'ogv', 'webm'));
		$option->addSubItem($upload_field);
		return $option;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form) : bool
    {
        return true;
    }

	/**
	 * @param ilGlobalPageTemplate $tpl
	 * @return ilGlobalPageTemplate
     */
	public function addPlayerElements(ilGlobalPageTemplate $tpl) : ilGlobalPageTemplate
    {
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoMediaElementPlayer.js');
		return $tpl;
	}

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @return ilTemplate
     * @throws ilWACException
	 */
	public function getPlayer($player_id, ilObjInteractiveVideo $obj) : ilTemplate
    {
        $player = new ilTemplate("../../VideoSources/core/MediaObject/tpl/tpl.video.html", true, true, $obj->getPluginObject()->getDirectory());
		ilObjMediaObjectGUI::includePresentationJS();
		$media_object = new ilInteractiveVideoMediaObject();
		$mob_id     = $media_object->doReadVideoSource($obj->getId());
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$player->setVariable('PLAYER_ID', $player_id);
        $mob_file = $mob_dir . '/' . $media_item['location'];
		$player->setVariable('VIDEO_SRC', ilWACSignedPath::signFile($mob_file));
		$player->setVariable('VIDEO_TYPE', $media_item['format']);
		$player->setVariable('INTERACTIVE_VIDEO_ID', $obj->getId());
		return $player;
	}

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, ilObjInteractiveVideo $obj)
	{
		$object = new ilInteractiveVideoMediaObject();
        if($obj->getSourceId() === $object->getId()) {
            $a_values['video_file'] = ilObject::_lookupTitle($object->doReadVideoSource($obj->getId()));
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
