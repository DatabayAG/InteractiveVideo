<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObject.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObjectGUI.php';
/**
 * Class ilInteractiveVideoMediaObjectGUI
 */
class ilInteractiveVideoMediaObjectGUI implements ilInteractiveVideoSourceGUI
{
	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/MediaObject/';

	/**
	 * @param ilRadioOption $option
	 * @return ilRadioOption
	 */
	public function getForm($option)
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
	public function checkForm($form)
	{
		// TODO: Implement checkForm() method.
	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl)
	{
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoMediaElementPlayer.js');
		return $tpl;
	}

	/**
	 * @param ilObjInteractiveVideo $obj
	 * @return ilTemplate
	 */
	public function getPlayer($obj)
	{
		$player = new ilTemplate(self::PATH . 'tpl/tpl.video.html', false, false);
		ilObjMediaObjectGUI::includePresentationJS($player);
		$mob_id     = $obj->getMobId();
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$player->setVariable('VIDEO_SRC', $mob_dir . '/' . $media_item['location']);
		$player->setVariable('VIDEO_TYPE', $media_item['format']);
		return $player;
	}

}