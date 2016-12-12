<?php

require_once './Services/Component/classes/class.ilPluginConfigGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactory.php';
/**
 * Class ilInteractiveVideoConfigGUI
 */
class ilInteractiveVideoConfigGUI extends ilPluginConfigGUI
{
	/**
	 * @var ilTemplate
	 */
	protected $tpl;

	/**
	 * @var ilLanguage
	 */
	protected $lng;

	/**
	 * @var ilCtrl
	 */
	protected $ctrl;

	/**
	 * @var ilToolbarGUI
	 */
	protected $toolbar;

	/**
	 * @var ilDB
	 */
	protected $db;

	/**
	 * @var ilInteractiveVideoSourceFactory
	 */
	protected $video_source_factory;

	/**
	 * @var string
	 */
	protected $active_tab;

	/**
	 *
	 */
	public function __construct()
	{
		/**
		 * @var ilTemplate   $tpl
		 * @var ilLanguage   $lng
		 * @var ilCtrl       $ilCtrl
		 */
		global $lng, $tpl, $ilCtrl;

		$this->lng     = $lng;
		$this->tpl     = $tpl;
		$this->ctrl    = $ilCtrl;
		$this->video_source_factory = new ilInteractiveVideoSourceFactory();
		$this->active_tab = 'settings';
	}

	/**
	 * {@inheritdoc}
	 */
	public function performCommand($cmd)
	{
		switch($cmd)
		{
			case 'saveConfigurationForm':
				$this->saveConfigurationForm();
				break;

			case 'showConfigurationForm':
			default:
				$this->showConfigurationForm();
				break;
		}
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	protected function showConfigurationForm(ilPropertyFormGUI $form = null)
	{

		if(!$form instanceof ilPropertyFormGUI)
		{
			$form = $this->getConfigurationForm();
			$form->setValuesByArray(array());
		}
		global $ilTabs;
		$this->addTabs($ilTabs);
		$this->tpl->setContent($form->getHTML());
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	protected function getConfigurationForm()
	{
		require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';

		$form = new ilPropertyFormGUI();


		$transformer = ilUtil::stripSlashes($_GET['video_source']);
		if($transformer == '')
		{
			$form->setTitle($this->lng->txt('settings'));
		}
		else
		{

			$this->active_tab = $transformer;
			$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt($transformer));
		}
		$form->addCommandButton('saveConfigurationForm', $this->lng->txt('save'));

		return $form;
	}

	/**
	 * @param ilTabsGUI $tabs_gui
	 */
	public function addTabs($tabs_gui)
	{
		$tabs_gui->addSubTab('settings', $this->lng->txt('settings'),
			$this->ctrl->getLinkTargetByClass('ilInteractiveVideoConfigGUI', 'view'));
		foreach($this->video_source_factory->getVideoSources() as $class =>  $engine)
		{
			if($engine->isActivated())
			{
				$tabs_gui->addSubTab( $engine->getID(), ilInteractiveVideoPlugin::getInstance()->txt($engine->getID()),
					$this->ctrl->getLinkTargetByClass('ilInteractiveVideoConfigGUI', 'view') . '&video_source=' . $engine->getID() );

			}
		}
		$tabs_gui->setSubTabActive($this->active_tab);
	}

	/**
	 *
	 */
	protected function saveConfigurationForm()
	{
		$form = $this->getConfigurationForm();
		if($form->checkInput())
		{
			try
			{
				$this->ctrl->redirect($this, 'configure');
			}
			catch(ilException $e)
			{
				ilUtil::sendFailure($this->lng->txt('form_input_not_valid'));
			}
		}

		$form->setValuesByPost();
		$this->showConfigurationForm($form);
	}
}
?>
