<?php

/**
 * @ilCtrl_IsCalledBy ilInteractiveVideoConfigGUI: ilObjComponentSettingsGUI
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
     * @var $db ilDBInterface
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
		global $ilTabs, $DIC;

		$this->lng					= $DIC->language();
		$this->tpl					= $DIC->ui()->mainTemplate();
		$this->ctrl					= $DIC->ctrl();
		$this->tabs					= $ilTabs;
		$this->video_source_factory	= new ilInteractiveVideoSourceFactory();
		$this->active_tab			= 'settings';
	}

	/**
	 * {}
	 */
    public function performCommand(string $cmd): void
	{
		switch($cmd)
		{
			case 'saveConfigurationForm':
				$this->saveConfigurationForm();
				break;
			case 'loadDbUpdates':
				$this->loadDbUpdates();
				break;
           case 'loadLanguages':
				$this->loadLanguages();
				break;
			case 'showConfigurationForm':
			default:
				$this->showConfigurationForm();
				break;
		}
	}

    /**
     * @param ilPropertyFormGUI|null $form
     * @throws ilCtrlException
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
     * @throws ilCtrlException
     */
	protected function getConfigurationForm()
	{
		$form = new ilPropertyFormGUI();
		$db_updater = new ilInteractiveVideoDbUpdater();

        $source = '';
        if($_GET['video_source']){
            $source = ilInteractiveVideoPlugin::stripSlashesWrapping($_GET['video_source']);
        }
		$form->setFormAction($this->ctrl->getFormAction($this, 'showConfigurationForm'));
		$mapping = [];

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
				$mapping[$class] = ['path' => $engine->getClassPath(), 'id' => $engine->getId()];
			}
		}
		else
		{
			$form = $this->addPluginConfigForm($form, $source);
		}
		$hidden = new ilHiddenInputGUI('path_mapping');
		$hidden->setValue(json_encode($mapping));
		$form->addItem($hidden);
        $section = new ilFormSectionHeaderGUI();
        $section->setTitle($this->plugin_object->txt('beta'));
        $form->addItem($section);
        $marker_feature = new ilCheckboxInputGUI($this->plugin_object->txt('activate_marker'),'activate_marker');
        $db_settings = new ilSetting(('xvid'));

        if((int) $db_settings->get('xvid_activate_marker') === 1)
        {
            $marker_feature->setChecked(true);
        }
        $marker_feature->setInfo($this->plugin_object->txt('activate_marker_info'));
        $form->addItem($marker_feature);

		if($db_updater->isNewerVersionFound())
		{
			$form->addCommandButton('loadDbUpdates', $this->plugin_object->txt('update_db'));
		}
        $form->addCommandButton('loadLanguages', $this->lng->txt('refresh_languages'));
		$form->addCommandButton('saveConfigurationForm', $this->lng->txt('save'));

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @param $source
	 * @return ilPropertyFormGUI
	 */
	protected function addPluginConfigForm(ilPropertyFormGUI $form, $source)
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
                $this->tpl->setOnScreenMessage("failure", $this->lng->txt('trac_updatform_input_not_valide_edit_user'), true);
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
            $this->saveForm($form);
        }
		$db_updater = new ilInteractiveVideoDbUpdater();
		$db_updater->applyPluginUpdates();
		$this->showConfigurationForm();
	}

    protected function loadLanguages()
    {
        global $DIC;

        $component_repository = $DIC["component.repository"];
        foreach ($component_repository->getPlugins() as $plugin) {
            if($plugin->getId() === 'xvid') {
                $xvid_instance = $plugin;
            }
        }
        $language = new ilInteractiveVideoLanguageHandler($xvid_instance);
        $language->updateLanguages();
        $DIC->ui()->mainTemplate()->setOnScreenMessage("info", $DIC->language()->txt("cmps_refresh_lng"), true);
        $this->showConfigurationForm();
    }

	/**
	 * @param ilPropertyFormGUI $form
	 */
	protected function saveForm(ilPropertyFormGUI $form)
	{
		$settings = [];
		$min_selected = false;
		foreach($form->getItems() as $key => $value)
		{
			if($value->getPostVar() != 'path_mapping')
			{
				$class = ilInteractiveVideoPlugin::stripSlashesWrapping($value->getPostVar());
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
			$this->video_source_factory->saveSourceSettings(['settings' => $settings, 'mappings' => $mapping]);
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_at_least_one'), true);
		}
	}
}
