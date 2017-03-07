<?php

require_once './Services/Component/classes/class.ilPluginConfigGUI.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactory.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/class.ilInteractiveVideoDbUpdater.php';

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

		$this->lng					= $lng;
		$this->tpl					= $tpl;
		$this->ctrl					= $ilCtrl;
		$this->tabs					= $ilTabs;
		$this->video_source_factory	= new ilInteractiveVideoSourceFactory();
		$this->active_tab			= 'settings';
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
			case 'loadDbUpdates':
				$this->loadDbUpdates();
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
		$db_updater = new ilInteractiveVideoDbUpdater();

		$source = ilUtil::stripSlashes($_GET['video_source']);
		$form->setFormAction($this->ctrl->getFormAction($this, 'showConfigurationForm'));
		$mapping = array();

		$update_map = $db_updater->getMap();
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
				if($update_map[$engine->getId()]['installed'] == $update_map[$engine->getId()]['file'])
				{
					$info = $this->plugin_object->txt('db_up_to_date');
				}
				else
				{
					$info = sprintf($this->plugin_object->txt('installed_version'), $update_map[$engine->getId()]['installed'], $update_map[$engine->getId()]['file']);
				}
				$activation->setInfo($info);
				$form->addItem($activation);
				$mapping[$class] = array('path' => $engine->getClassPath(), 'id' => $engine->getId());
			}
		}
		else
		{
			$form = $this->addPluginConfigForm($form, $source);
		}
		$hidden = new ilHiddenInputGUI('path_mapping');
		$hidden->setValue(json_encode($mapping));
		$form->addItem($hidden);

		if($db_updater->isNewerVersionFound())
		{
			$form->addCommandButton('loadDbUpdates', $this->plugin_object->txt('update_db'));
		}
		$form->addCommandButton('saveConfigurationForm', $this->lng->txt('save'));

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @param $source
	 * @return ilPropertyFormGUI
	 */
	protected function addPluginConfigForm($form, $source)
	{
		$this->active_tab = $source;
		$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt($source));
		#$factory = new ilInteractiveVideoSourceFactory();
		#$instance = $factory->getVideoSourceObject($source);
		#$settings = $factory->getSourceSettings($source);
		return $form;
	}

	protected function addTabs()
	{
		$this->tabs->addSubTab('settings', $this->lng->txt('settings'),
			$this->ctrl->getLinkTargetByClass('ilInteractiveVideoConfigGUI', 'view'));
		foreach($this->video_source_factory->getVideoSources() as $class =>  $engine)
		{
			if($this->video_source_factory->isActive($class) && $engine->getGUIClass()->hasOwnConfigForm())
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

	/**
	 *
	 */
	protected function loadDbUpdates()
	{
		$form = $this->getConfigurationForm();
		if($form->checkInput())
		{
			try
			{
				$this->saveForm($form);
			}
			catch(ilException $e)
			{
				ilUtil::sendFailure($this->lng->txt('form_input_not_valid'));
			}
		}
		$db_updater = new ilInteractiveVideoDbUpdater();
		$db_updater->applyPluginUpdates();
		$this->showConfigurationForm();
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	protected function saveForm($form)
	{
		$settings = array();
		$min_selected = false;
		foreach($form->getItems() as $key => $value)
		{
			if($value->getPostVar() != 'path_mapping')
			{
				$class = ilUtil::stripSlashes($value->getPostVar());
				$setting = (int) $_POST[$class];
				$settings[$class] = $setting;
				if($setting == 1)
				{
					$min_selected = true;
				}
			}
			else
			{
				$mapping = json_decode($value->getValue(), true);
			}
		}
		if($min_selected)
		{
			$this->video_source_factory->saveSourceSettings(array('settings' => $settings, 'mappings' => $mapping));
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('select_at_least_one'), true);
		}
	}
}
