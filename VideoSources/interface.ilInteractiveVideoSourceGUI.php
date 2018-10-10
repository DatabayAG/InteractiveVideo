<?php

/**
 * Interface ilInteractiveVideoSourceGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
interface ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilRadioOption $option
	 * @param integer $obj_id
	 * @return ilRadioOption
	 */
	public function getForm($option, $obj_id);

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
	 * @param array $a_values
	 * @param ilObjInteractiveVideo $obj
	 */
	public function getEditFormCustomValues(array &$a_values, $obj);

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form);

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl);

	/**
	 * @param                       $player_id
	 * @param ilObjInteractiveVideo $obj
	 * @return
	 */
	public function getPlayer($player_id, $obj);

}