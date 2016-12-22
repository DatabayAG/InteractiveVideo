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
	protected $gui_source;

	/**
	 * @var ilInteractiveVideoSourceGUI[]
	 */
	protected $sources;
	
	/**
	 * ilInteractiveVideoSourceFactoryGUI constructor.
	 * @param ilObjInteractiveVideo $obj
	 */
	public function __construct(ilObjInteractiveVideo $obj)
	{
		$this->obj		= $obj;
		$factory		= new ilInteractiveVideoSourceFactory();
		$this->sources	= $factory->getVideoSources();
		if($factory->isActive($factory->getVideoSource($obj->getSourceId())->getClass()) !== false)
		{
			$this->gui_source = $factory->getVideoSource($obj->getSourceId())->getGUIClass();
		}
		else
		{
			$this->sourceDoesNotExistsAnymore();
		}
	}

	/**
	 * @param ilTemplate $tpl
	 * @return ilTemplate
	 */
	public function addPlayerElements($tpl)
	{
		return $this->gui_source->addPlayerElements($tpl);
	}

	/**
	 * @return ilTemplate
	 */
	public function getPlayer()
	{
		return $this->gui_source->getPlayer($this->obj);
	}

	protected function sourceDoesNotExistsAnymore()
	{
		ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('source_does_not_exist'), true);
		ilUtil::redirect('ilias.php?baseClass=ilPersonalDesktopGUI');
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @return ilPropertyFormGUI
	 */
	public function checkForm($form)
	{
		foreach($this->sources as $class => $obj)
		{
			$form = $obj->getGUIClass()->checkForm($form);
		}
		return $form;
	}
}