<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/MediaObject/class.ilInteractiveVideoMediaObject.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObject.php';
require_once 'Services/MediaObjects/classes/class.ilObjMediaObjectGUI.php';
require_once 'Services/MediaObjects/classes/class.ilPlayerUtil.php';
/**
 * Class ilInteractiveVideoMediaObjectGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoMediaObjectGUI implements ilInteractiveVideoSourceGUI
{
	const PATH = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/MediaObject/';

	/**
	 * @param ilRadioOption $option
	 * @param               $obj_id
	 * @return ilRadioOption
	 */
	public function getForm($option, $obj_id)
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

	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl)
	{
		$tpl->addJavaScript(self::PATH . 'js/jquery.InteractiveVideoMediaElementPlayer.js');
		ilPlayerUtil::initMediaElementJs($tpl);
		return $tpl;
	}

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @return ilTemplate
	 * @throws ilWACException
	 */
	public function getPlayer($player_id, $obj)
	{
		require_once 'Services/WebAccessChecker/classes/class.ilWACSignedPath.php';
		$player = new ilTemplate(self::PATH . 'tpl/tpl.video.html', false, false);
		ilObjMediaObjectGUI::includePresentationJS();
		$media_object = new ilInteractiveVideoMediaObject();
		$mob_id     = $media_object->doReadVideoSource($obj->getId());
		$mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');

		$player->setVariable('PLAYER_ID', $player_id);
		$player->setVariable('VIDEO_SRC', ilWACSignedPath::signFile($mob_dir . '/' . $media_item['location']));
		$player->setVariable('VIDEO_TYPE', $media_item['format']);
		return $player;
	}

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, $obj)
	{
		$object = new ilInteractiveVideoMediaObject();
		$a_values['video_file'] = ilObject::_lookupTitle($object->doReadVideoSource($obj->getId()));
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