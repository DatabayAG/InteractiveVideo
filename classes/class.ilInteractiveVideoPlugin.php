<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

include_once("./Services/Repository/classes/class.ilRepositoryObjectPlugin.php");

/**
 * Class ilInteractiveVideoPlugin
 * 
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilInteractiveVideoPlugin extends ilRepositoryObjectPlugin
{
	/**
	 * @return string
	 */
	public function getPluginName()
	{
		return "InteractiveVideo";
	}
}