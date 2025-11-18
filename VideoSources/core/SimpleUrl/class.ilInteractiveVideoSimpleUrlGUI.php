<?php

/**
 * Class ilInteractiveVideoSimpleUrlGUI
 */
class ilInteractiveVideoSimpleUrlGUI implements ilInteractiveVideoSourceGUI
{
    public function getForm(ILIAS\UI\Factory $ui, int $obj_id)
	{

        $simple_url = $ui->input()->field()->text(ilInteractiveVideoPlugin::getInstance()->txt('simple_url'), ilInteractiveVideoPlugin::getInstance()->txt('simple_url_info'));
        $source_type = $ui->input()->field()->hidden()->withValue('surl')->withDedicatedName('source');
        $object = new ilInteractiveVideoSimpleUrl();
        if($obj_id > 0) {
            $simple_src = $object->doReadVideoSource($obj_id);
            if($simple_src !== 0) {
                $simple_url->withValue($simple_src);
            }
        }
        return ['input' => $simple_url, 'source_type' => $source_type];

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
	public function checkForm($form) : bool
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
	 * @return ilGlobalPageTemplate
     */
	public function addPlayerElements($tpl) : ilGlobalPageTemplate
    {
		$tpl->addJavaScript('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/core/SimpleUrl/js/jquery.InteractiveVideoSimpleUrlPlayer.js');
      #  ilPlayerUtil::initMediaElementJs($tpl);
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
        $player = new ilTemplate("../../VideoSources/core/SimpleUrl/tpl/tpl.video.html", true, true, $obj->getPluginObject()->getDirectory());
		$instance	= new ilInteractiveVideoSimpleUrl();
		$instance->doReadVideoSource($obj->getId());
		$player->setVariable('PLAYER_ID', $player_id);
		$player->setVariable('SIMPLE_URL', $instance->getSimpleUrl());
		$player->setVariable('INTERACTIVE_VIDEO_ID', $obj->getId());
		return $player;
	}

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, ilObjInteractiveVideo $obj)
	{
		$instance = new ilInteractiveVideoSimpleUrl();
		$instance->doReadVideoSource($obj->getId());
        if($obj->getSourceId() === $instance->getId()) {
            $a_values[ilInteractiveVideoSimpleUrl::FORM_URL_FIELD] = $instance->getSimpleUrl();
        }
	}

    public function getEditFormCustom(ilPropertyFormGUI $a_form, ilObjInteractiveVideo|ilObject|null $object)
    {
        $hidden_source = new ilHiddenInputGUI(ilInteractiveVideoSimpleUrl::FORM_URL_FIELD);
        $hidden_source->setValue($object->getSourceId());
        $a_form->addItem($hidden_source);
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
