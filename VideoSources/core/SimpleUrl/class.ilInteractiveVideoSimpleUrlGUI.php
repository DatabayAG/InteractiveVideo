<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/SimpleUrl/class.ilInteractiveVideoSimpleUrl.php';

/**
 * Class ilInteractiveVideoSimpleUrlGUI
 */
class ilInteractiveVideoSimpleUrlGUI implements ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilRadioOption $option
	 * @param               $obj_id
	 * @return ilRadioOption
	 */
	public function getForm($option, $obj_id)
	{
		$simple_url = new ilTextInputGUI(ilInteractiveVideoPlugin::getInstance()->txt('simple_url'), 'simple_url');
		$object = new ilInteractiveVideoSimpleUrl();
		$object->doReadVideoSource($obj_id);
		$simple_url->setValue($object->getSimpleUrl());
		$simple_url->setInfo(ilInteractiveVideoPlugin::getInstance()->txt('simple_url_info'));
		$option->addSubItem($simple_url);
		return $option;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form)
	{
		$simple_url = ilUtil::stripSlashes($_POST['simple_url']);
		if($simple_url != '' )
		{
			return true;
		}
		return false;
	}

	/**
	 * @param ilTemplate $tpl
	 * @return mixed
	 */
	public function addPlayerElements($tpl)
	{
		$tpl->addJavaScript('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/SimpleUrl/js/jquery.InteractiveVideoSimpleUrlPlayer.js');
        ilPlayerUtil::initMediaElementJs($tpl);
		return $tpl;
	}

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @param string     $id
	 * @return mixed
	 */
	public function getPlayer($player_id, $obj)
	{
		$player		= new ilTemplate('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/SimpleUrl/tpl/tpl.video.html', false, false);
		$instance	= new ilInteractiveVideoSimpleUrl();
		$instance->doReadVideoSource($obj->getId());
		$player->setVariable('PLAYER_ID', $player_id);
		$player->setVariable('SIMPLE_URL', $instance->getSimpleUrl());
		$player->setVariable('INTERACTIVE_VIDEO_ID', $id);
		return $player;
	}

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, $obj)
	{
		$instance = new ilInteractiveVideoSimpleUrl();
		$instance->doReadVideoSource($obj->getId());
        if($obj->getSourceId() === $instance->getId()) {
            $a_values[ilInteractiveVideoSimpleUrl::FORM_URL_FIELD] = $instance->getSimpleUrl();
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

}