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
	 * @return mixed
	 */
	public function addPlayerElements($tpl);

	/**
	 * @param ilObjInteractiveVideo $obj
	 * @param string     $id
	 * @return mixed
	 */
	public function getPlayer($obj, $id);

}