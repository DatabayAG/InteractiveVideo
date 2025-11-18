<?php

/**
 * Interface ilInteractiveVideoSourceGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
interface ilInteractiveVideoSourceGUI
{
	/**
	 * @param integer $obj_id
	 * @return ilRadioOption
	 */
    public function getForm(ILIAS\UI\Factory $ui, int $obj_id);

	/**
	 * @param ilPropertyFormGUI $form
	 * @return
	 */
	public function getConfigForm($form);

	/**
	 * @return boolean
	 */
	public function hasOwnConfigForm();

	/**
	 * @param array                 $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, ilObjInteractiveVideo $obj);

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form) : bool;

	/**
	 * @param ilTemplate $tpl
	 * @return ilGlobalPageTemplate
     */
	public function addPlayerElements($tpl) : ilGlobalPageTemplate;

	public function getPlayer($player_id, ilObjInteractiveVideo $obj);

    public function getEditFormCustom(ilPropertyFormGUI $a_form, ilObjInteractiveVideo|ilObject|null $object);

}
