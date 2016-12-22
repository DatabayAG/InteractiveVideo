<?php
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/interface.ilInteractiveVideoSourceGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactory.php';

/**
 * Class ilInteractiveVideoSourceFactoryGUI
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
	protected $source;

	/**
	 * ilInteractiveVideoSourceFactoryGUI constructor.
	 * @param ilObjInteractiveVideo $obj
	 */
	public function __construct(ilObjInteractiveVideo $obj)
	{
		$this->obj		= $obj;
		$factory		= new ilInteractiveVideoSourceFactory();
		$this->source	= $factory->getVideoSource($obj->getSourceId())->getGUIClass();
	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl)
	{
		return $this->source->addPlayerElements($tpl);
	}

	/**
	 * @return ilTemplate
	 */
	public function getPlayer()
	{
		return $this->source->getPlayer($this->obj);
	}
}