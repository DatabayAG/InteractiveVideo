<?php

/**
 * Interface ilInteractiveVideoSourceGUI
 */
interface ilInteractiveVideoSourceGUI
{
	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function getForm($form);

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