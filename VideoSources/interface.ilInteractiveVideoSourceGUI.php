<?php

/**
 * Interface ilInteractiveVideoSourceGUI
 */
interface ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilRadioOption $option
	 * @return ilRadioOption
	 */
	public function getForm($option);

	/**
	 * @param ilPropertyFormGUI $form
	 * @return bool
	 */
	public function checkForm($form);

	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function saveForm($form);

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayer($tpl);

}