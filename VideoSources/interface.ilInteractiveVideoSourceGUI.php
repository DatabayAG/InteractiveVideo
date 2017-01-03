<?php

/**
 * Interface ilInteractiveVideoSourceGUI
 */
interface ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilRadioOption $option
	 * @param               $obj_id
	 * @return ilRadioOption
	 */
	public function getForm($option, $obj_id);

	/**
	 * @param $form
	 * @return 
	 */
	public function getConfigForm($form);

	/**
	 * @return boolean
	 */
	public function hasOwnConfigForm();

	/**
	 * @param array $a_values
	 * @param       $obj
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
	 * @param ilObjInteractiveVideo $obj
	 * @return mixed
	 */
	public function getPlayer($obj);

}