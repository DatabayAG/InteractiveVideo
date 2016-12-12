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
	 * @var ilTabsGUI
	 */
	protected $tabs;

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
		 * @var ilTabsGUI	$ilTabs
		 */
		global $lng, $tpl, $ilCtrl, $ilTabs;

		$this->lng		= $lng;
		$this->tpl		= $tpl;
		$this->ctrl		= $ilCtrl;
		$this->tabs		= $ilTabs;
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
		}

		$this->addTabs();
		$this->tpl->setContent($form->getHTML());
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	protected function getConfigurationForm()
	{
		require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';

		$form = new ilPropertyFormGUI();

		$source = ilUtil::stripSlashes($_GET['video_source']);
		$form->setFormAction($this->ctrl->getFormAction($this, 'showConfigurationForm'));
		if($source == '')
		{
			$form->setTitle($this->lng->txt('settings'));
			foreach($this->video_source_factory->getVideoSources() as $class => $engine)
			{
				$activation = new ilCheckboxInputGUI(ilInteractiveVideoPlugin::getInstance()->txt($engine->getID()), $class);
				$activation->setValue(1);
				if($this->video_source_factory->isActive($class))
				{
					$activation->setChecked(true);
				}
				$form->addItem($activation);
			}
		}
		else
		{
			$this->active_tab = $source;
			$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt($source));
		}
		$form->addCommandButton('saveConfigurationForm', $this->lng->txt('save'));

		return $form;
	}

	protected function addTabs()
	{
		$this->tabs->addSubTab('settings', $this->lng->txt('settings'),
			$this->ctrl->getLinkTargetByClass('ilInteractiveVideoConfigGUI', 'view'));
		foreach($this->video_source_factory->getVideoSources() as $class =>  $engine)
		{
			if($this->video_source_factory->isActive($class))
			{
				$this->tabs->addSubTab( $engine->getID(), ilInteractiveVideoPlugin::getInstance()->txt($engine->getID()),
					$this->ctrl->getLinkTargetByClass('ilInteractiveVideoConfigGUI', 'view') . '&video_source=' . $engine->getID() );
			}
		}
		$this->tabs->setSubTabActive($this->active_tab);
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
				$this->saveForm($form);
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
	
	protected function saveForm($form)
	{
		$settings = array();
		foreach($form->getItems() as $key => $value)
		{
			$class = ilUtil::stripSlashes($value->getPostVar());
			$settings[$class] = ilUtil::stripSlashes((int) $_POST[$class]);
		}
		$this->video_source_factory->saveSourceSettings($settings);
	}
}
?>