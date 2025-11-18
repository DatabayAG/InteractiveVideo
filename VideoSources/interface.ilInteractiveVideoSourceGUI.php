<?php

/**
 * @author Guido Vollbach <gvollbach@databay.de>
 */
interface ilInteractiveVideoSourceGUI
{

    public function getForm(ILIAS\UI\Factory $ui, int $obj_id);

	public function getConfigForm(ilPropertyFormGUI $form) : void;

	public function hasOwnConfigForm() : bool;

	public function getEditFormCustomValues(array &$a_values, ilObjInteractiveVideo $obj);

	public function checkForm($form) : bool;

	public function addPlayerElements(ilGlobalPageTemplate $tpl) : ilGlobalPageTemplate;

	public function getPlayer($player_id, ilObjInteractiveVideo $obj) : ilTemplate;

    public function getEditFormCustom(ilPropertyFormGUI $a_form, ilObjInteractiveVideo|ilObject|null $object);

}
