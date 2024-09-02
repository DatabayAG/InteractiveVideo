<?php

/**
 * Class ilInteractiveVideoSourceFactoryGUI
 * @author Guido Vollbach <gvollbach@databay.de>
 */
class ilInteractiveVideoSourceFactoryGUI
{

	/**
	 * @var ilObjInteractiveVideo
	 */
	protected $obj;

	/**
	 * @var ilInteractiveVideoSourceGUI
	 */
	protected $gui_source;

	/**
	 * @var ilInteractiveVideoSourceGUI[]
	 */
	protected $sources;

	/**
	 * @var array
	 */
	protected $ids = array();

	/**
	 * ilInteractiveVideoSourceFactoryGUI constructor.
	 * @param ilObjInteractiveVideo $obj
	 */
	public function __construct(ilObjInteractiveVideo $obj)
	{
		$this->obj		= $obj;
		$factory		= new ilInteractiveVideoSourceFactory();
		$this->sources	= $factory->getVideoSources();
		if($obj->getSourceId() !== '' &&
            $factory->isActive($factory->getVideoSourceObject($obj->getSourceId())->getClass()) !== false)
		{
			$this->gui_source = $factory->getVideoSourceObject($obj->getSourceId())->getGUIClass();
		}
		else
		{
			$this->sourceDoesNotExistsAnymore();
		}
	}

	/**
	 * @param ilTemplate $tpl
	 * @return mixed
	 */
	public function addPlayerElements($tpl)
	{
		return $this->gui_source->addPlayerElements($tpl);
	}

	/**
	 * @param $player_id
	 * @return ilTemplate
	 */
	public function getPlayer($player_id)
	{
		return $this->gui_source->getPlayer($player_id, $this->obj);
	}

	protected function sourceDoesNotExistsAnymore()
	{
        global $DIC;
        $plugin = ilInteractiveVideoPlugin::getInstance();
        $DIC->ui()->mainTemplate()->setOnScreenMessage("failure", $plugin->txt("source_does_not_exist"), true);
		ilUtil::redirect('ilias.php?baseClass=ilDashboardGUI');
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function checkForm($form)
	{
		foreach($this->sources as $class => $obj)
		{
			$source_id = ilUtil::stripSlashes($form->getInput('source_id'));
			if($obj->getId() == $source_id)
			{
				$obj->getGUIClass()->checkForm($form);
			}
		}
		return $form;
	}

	protected function generateUniqueId()
	{
		$id = $this->generateString();
		if(!array_key_exists($id, $this->ids))
		{
			$this->ids[$id] = $id;
			return $id;
		}
	}

	/**
	 * @return string
	 * @throws Exception
	 */
	protected function generateString()
	{
		$bytes = random_bytes(32);
		return '_' . bin2hex($bytes);
	}
}