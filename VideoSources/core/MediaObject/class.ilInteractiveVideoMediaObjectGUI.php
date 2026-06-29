<?php

use ILIAS\MediaObjects\InternalDataService;
use ILIAS\MediaObjects\InternalRepoService;
use ILIAS\MediaObjects\InternalDomainService;
use ILIAS\MediaObjects\MediaObjectRepository;
use ILIAS\Repository\IRSS\IRSSWrapper;
use ILIAS\Repository\IRSS\DataService;

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
        global $DIC;

        $file = $_FILES['video_file'] ?? null;
        $has_new_file = is_array($file)
            && isset($file['error'], $file['name'])
            && $file['error'] === UPLOAD_ERR_OK
            && $file['name'] !== '';

        if ($has_new_file) {
            return true;
        }
        
        $ref_id = (int) ($_REQUEST['ref_id'] ?? 0);
        if ($ref_id > 0) {
            $obj_id = (int) ilObject::_lookupObjId($ref_id);
            if ($obj_id > 0
                && (new ilInteractiveVideoMediaObject())->doReadVideoSource($obj_id) !== null) {
                return true;
            }
        }

        $DIC->ui()->mainTemplate()->setOnScreenMessage(
            'failure',
            ilInteractiveVideoPlugin::getInstance()->txt('select_video_file'),
            true
        );

        return false;
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
        global $DIC;
		$media_object = new ilInteractiveVideoMediaObject();
		$mob_id     = $media_object->doReadVideoSource($obj->getId());
		$media_item = ilMediaItem::_getMediaItemsOfMObId($mob_id, 'Standard');
        $mob = new ilObjMediaObject($mob_id);
        $mob_file = $mob->getStandardSrc();
		$player->setVariable('PLAYER_ID', $player_id);
        $repository = new MediaObjectRepository($DIC->database(), new IRSSWrapper(new DataService()));
        $is_file_in_rss = $repository->hasLocalFile($mob_id, $media_item['location']);
        if($is_file_in_rss === false) {
            $mob_dir    = ilObjMediaObject::_getDirectory($mob_id);
            $mob_file = $mob_dir . '/' . $media_item['location'];
            $player->setVariable('VIDEO_SRC', ilWACSignedPath::signFile($mob_file));
        } else {
            $player->setVariable('VIDEO_SRC', $mob_file);
        }
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
            $mob_id = $object->doReadVideoSource($obj->getId());
            if ($mob_id !== null) {
                $a_values['video_file'] = ilObject::_lookupTitle($mob_id);
            }
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
