<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Repository/classes/class.ilObjectPluginGUI.php';
require_once 'Services/PersonalDesktop/interfaces/interface.ilDesktopItemHandling.php';
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
require_once 'Services/UIComponent/Modal/classes/class.ilModalGUI.php';
require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactory.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactoryGUI.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestionAjaxHandler.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestionScoring.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestionStatistics.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestionFormEditGUI.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('form/class.ilTextAreaInputCkeditorGUI.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('form/class.ilInteractiveVideoTimePicker.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('form/class.ilInteractiveVideoPreviewPicker.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('form/class.ilTextAreaInputCkeditor.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilInteractiveVideoFFmpeg.php');

/**
 * Class ilObjInteractiveVideoGUI
 * @author               Nadia Ahmad <nahmad@databay.de>
 * @ilCtrl_isCalledBy    ilObjInteractiveVideoGUI: ilRepositoryGUI, ilAdministrationGUI, ilObjPluginDispatchGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilPermissionGUI, ilInfoScreenGUI, ilObjectCopyGUI, ilRepositorySearchGUI, ilPublicUserProfileGUI, ilCommonActionDispatcherGUI, ilMDEditorGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilInteractiveVideoLearningProgressGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilPropertyFormGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilInteractiveVideoExportGUI, SimpleChoiceQuestionFormEditGUI
 */
class ilObjInteractiveVideoGUI extends ilObjectPluginGUI implements ilDesktopItemHandling
{
	/**
	 * @var ilCtrl
	 */
	protected $ctrl;

	/**
	 * @var ilObjInteractiveVideo $object
	 */
	public $object;
	
	/**
	 * @var $objComment ilObjComment
	 */
	public $objComment;

	/**
	 * @var ilInteractiveVideoPlugin
	 */
	public $plugin;

	/**
	 * @var array
	 */
	protected $custom_css = array(
								  '/templates/default/xvid.css',
								  '/libs/Bootstraptoggle/bootstrap2-toggle.min.css',
								  '/libs/video.js/video-js.min.css'
								);

	/**
	 * @var array
	 */
	protected $custom_javascript = array(
										 '/libs/Bootstraptoggle/bootstrap2-toggle.min.js', 
										 '/libs/video.js/video.min.js',
										 '/libs/svg.js/svg.js',
										 '/libs/svg.js/svg.draggable.min.js',
										 '/js/jquery.InteractiveVideoQuestionViewer.js',
										 '/js/InteractiveVideoPlayerComments.js',
										 '/js/InteractiveVideoPlayerFunctions.js',
										 '/js/InteractiveVideoPlayerAbstract.js',
										 '/js/InteractiveVideoOverlayMarker.js'
										);

	/**
	 * @param ilTemplate $tpl
	 */
	protected function addJavascriptAndCSSToTemplate($tpl)
	{
		foreach($this->custom_css as $file)
		{
			$tpl->addCss($this->plugin->getDirectory() . $file);
		}

		foreach($this->custom_javascript as $file)
		{
			$tpl->addJavaScript($this->plugin->getDirectory() . $file);
		}
	}

	/**
	 * Functions that must be overwritten
	 */
	public function getType()
	{
		return 'xvid';
	}

	/**
	 * Cmd that will be redirected to after creation of a new object.
	 */
	public function getAfterCreationCmd()
	{
		return 'editProperties';
	}

	/**
	 * @return string
	 */
	public function getStandardCmd()
	{
		return 'showContent';
	}

	/**
	 * @param string $cmd
	 * @throws ilException
	 */
	public function performCommand($cmd)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;

		$this->setTitleAndDescription();

		$this->lng->loadLanguageModule('trac');
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$next_class = $this->ctrl->getNextClass($this);
		switch($next_class)
		{
			case 'ilmdeditorgui':
				$this->checkPermission('write');
				require_once 'Services/MetaData/classes/class.ilMDEditorGUI.php';
				$md_gui = new ilMDEditorGUI($this->object->getId(), 0, $this->object->getType());
				$md_gui->addObserver($this->object, 'MDUpdateListener', 'General');
				$ilTabs->setTabActive('meta_data');
				$this->ctrl->forwardCommand($md_gui);
				break;

			case 'ilpropertyformgui':
				$simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
				$form = $simple_question->initQuestionForm();
				$this->ctrl->forwardCommand($form);
				break;

			case 'ilinteractivevideolearningprogressgui':
				$ilTabs->setTabActive('learning_progress');
				$plugin->includeClass('class.ilInteractiveVideoLearningProgressGUI.php');
				$lp_gui = new ilInteractiveVideoLearningProgressGUI($this, $this->object);
				$this->ctrl->forwardCommand($lp_gui);
				break;

			case 'ilpublicuserprofilegui':
				require_once 'Services/User/classes/class.ilPublicUserProfileGUI.php';
				$profile_gui = new ilPublicUserProfileGUI((int)$_GET['user']);
				$profile_gui->setBackUrl($this->ctrl->getLinkTarget($this, 'showContent'));
				$this->tpl->setContent($this->ctrl->forwardCommand($profile_gui));
				break;

			case 'ilcommonactiondispatchergui':
				require_once 'Services/Object/classes/class.ilCommonActionDispatcherGUI.php';
				$gui = ilCommonActionDispatcherGUI::getInstanceFromAjaxCall();
				$this->ctrl->forwardCommand($gui);
				break;
			case "ilinteractivevideoexportgui":
				$this->checkPermission('write');
				$ilTabs->setTabActive('export');
				$plugin->includeClass('class.ilInteractiveVideoExportGUI.php');
				$exp_gui = new ilInteractiveVideoExportGUI($this);
				$exp_gui->addFormat('xml', $this->lng->txt('export'));
				$this->ctrl->forwardCommand($exp_gui);
				break;
			default:
				switch($cmd)
				{
					case 'showLPUserDetails':
					case 'showLPSummary':
					case 'showLPUsers':
					case 'saveLearningProgressSettings':
					case 'showLPSettings':
					case 'editUser':
					case 'updateLPUsers':
						$ilTabs->setTabActive('learning_progress');
						$this->$cmd();
						break;

					case 'showTutorInsertForm':
						$this->checkPermission('write');
						$cmd = $_POST['cmd'];
						if(method_exists($this, $cmd))
						{
							$this->$cmd();
						}
						else  $this->editComments();
						break;
					
					case 'updateProperties':
					case 'editProperties':
					case 'confirmDeleteComment':
					case 'deleteComment': 
					case 'editComments':  
				    case 'editQuestion': 
					case 'confirmUpdateQuestion':
				    case 'insertQuestion':
                    case 'completeCsvExport':
                    $this->checkPermission('write');
						$this->$cmd();
						break;

					case 'redrawHeaderAction':
					case 'addToDesk':
					case 'removeFromDesk':
					case 'showContent':
						if(in_array($cmd, array('addToDesk', 'removeFromDesk')))
						{
							$cmd .= 'Object';
						}
						$this->checkPermission('read');
						$this->$cmd();
						break;
					case 'getQuestionPerAjax':
					case 'postAnswerPerAjax':
						$this->checkPermission('read');
						$this->$cmd();
						break;
					default:
						if(method_exists($this, $cmd))
						{
							$this->checkPermission('read');
							$this->$cmd();
						}
						else
						{
							throw new ilException(sprintf("Unsupported plugin command %s ind %s", $cmd, __METHOD__));
						}
						break;
				}
				break;
		}

		$this->addHeaderAction();
	}

	public function showContent()
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('content');

		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $this->plugin->getDirectory());

		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$this->addJavascriptAndCSSToTemplate($tpl);
		$object->addPlayerElements($tpl);

		$this->displayTaskIfActive($video_tpl);

		$this->addBackButtonIfParameterExists($video_tpl);

		$video_tpl->setVariable('VIDEO_PLAYER', $object->getPlayer()->get());

		$form = new ilPropertyFormGUI();
		$ckeditor = new ilTextAreaInputCkeditorGUI('comment_text', 'comment_text');
		$form->addItem($ckeditor);
		$video_tpl->setVariable('COMMENT_TEXT', $form->getHTML());
		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());
		$this->objComment->setIsPublic($this->object->isPublic());
		$this->objComment->setIsAnonymized($this->object->isAnonymized());
		$this->objComment->setIsRepeat($this->object->isRepeat());
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setType(ilModalGUI::TYPE_LARGE);
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());
		$video_tpl->setVariable('TXT_COMMENTS', $this->plugin->txt('comments'));
		$video_tpl->setVariable('SHOW_ALL_COMMENTS', $this->plugin->txt('show_all_comments'));
		$video_tpl->setVariable('AUTHOR_FILTER', $this->plugin->txt('author_filter'));
		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig());

		$this->appendCommentElementsToTemplateIfNotDisabled($video_tpl);

		$tpl->setContent($video_tpl->get());
	}

	/**
	 * @param ilTemplate $video_tpl
	 */
	protected function displayTaskIfActive($video_tpl)
	{
		if($this->object->getTaskActive())
		{
			$video_tpl->setCurrentBlock('task_description');
			$video_tpl->setVariable('TASK_TEXT', $this->plugin->txt('task'));
			$video_tpl->setVariable('TASK_DESCRIPTION', $this->object->getTask());
			$video_tpl->parseCurrentBlock();
		}
	}

	/**
	 * @param ilTemplate $video_tpl
	 */
	protected function appendCommentElementsToTemplateIfNotDisabled($video_tpl)
	{
		/**
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilAccess;

		if($this->object->getDisableComment() != 1)
		{
			$comments_tpl = new ilTemplate("tpl.comments_form.html", true, true, $this->plugin->getDirectory());
			$comments_tpl->setVariable('COMMENT_TIME_END', $this->plugin->txt('time_end'));
			$picker = new ilInteractiveVideoTimePicker('comment_time_end', 'comment_time_end');
			$comments_tpl->setVariable('COMMENT_TIME_END_PICKER', $picker->render());
			$comments_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment'));
			$comments_tpl->setVariable('TXT_ENDTIME_WARNING', $this->plugin->txt('endtime_warning'));
			$comments_tpl->setVariable('TXT_NO_TEXT_WARNING', $this->plugin->txt('no_text_warning'));
			$comments_tpl->setVariable('TXT_IS_PRIVATE', $this->plugin->txt('is_private_comment'));
			$marker_template = '';
			if($this->object->getMarkerForStudents() == 1 || $ilAccess->checkAccess('write', '', $this->object->getRefId()))
			{
				$marker_template = $this->buildMarkerEditorTemplate()->get();
			}
			$comments_tpl->setVariable('MARKER_EDITOR', $marker_template);
			$comments_tpl->setVariable('TXT_POST', $this->lng->txt('save'));
			$comments_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));
			$video_tpl->setVariable("COMMENTS_FORM", $comments_tpl->get());
		}
	}
	
	protected function buildMarkerEditorTemplate()
	{
		$marker_tpl = new ilTemplate("tpl.marker_editor.html", true, true, $this->plugin->getDirectory());

		$marker_tpl->setVariable('TXT_COLOR', $this->plugin->txt('color'));
		$marker_tpl->setVariable('TXT_STROKE', $this->plugin->txt('stroke'));
		$marker_tpl->setVariable('TXT_WIDTH', $this->plugin->txt('width'));
		$marker_tpl->setVariable('TXT_HEIGHT', $this->plugin->txt('height'));
		$marker_tpl->setVariable('TXT_ROTATE', $this->plugin->txt('rotate'));
		$marker_tpl->setVariable('TXT_RECTANGLE', $this->plugin->txt('rectangle'));
		$marker_tpl->setVariable('TXT_ARROW', $this->plugin->txt('arrow'));
		$marker_tpl->setVariable('TXT_CIRCLE', $this->plugin->txt('circle'));
		$marker_tpl->setVariable('TXT_SCALE', $this->plugin->txt('scale'));
		$marker_tpl->setVariable('TXT_LINE', $this->plugin->txt('line'));
		$marker_tpl->setVariable('TXT_ADD_MARKER', $this->plugin->txt('insert_marker'));
		$marker_tpl->setVariable('TXT_DELETE', $this->plugin->txt('delete_marker'));
		$marker_tpl->setVariable('TXT_TEXT', $this->plugin->txt('text'));
		$marker_tpl->setVariable('TXT_FONT_SIZE', $this->plugin->txt('font_size'));
		return $marker_tpl;
	}

	/**
	 * @param $video_tpl ilTemplate
	 */
	protected function addBackButtonIfParameterExists($video_tpl)
	{
		/**
		 * @var $ilObjDataCache ilObjectDataCache
		 * @var $lng ilLanguage
		 */
		global $lng, $ilObjDataCache;

		$ref_id = (int) $_GET['xvid_referrer_ref_id'];
		$link = urldecode($_GET['xvid_referrer']);
		$url = parse_url(ILIAS_HTTP_PATH);
		$link = $url['scheme'] . '://' . $url['host'] . (isset($url['port']) ?  ':' . $url['port'] : '') . $link;
		if($ref_id !== 0)
		{
			$obj_id		= $ilObjDataCache->lookupObjId($ref_id);
			$title		= $ilObjDataCache->lookupTitle($obj_id);
			$type		= $ilObjDataCache->lookupType($obj_id);
			$txt		= $this->plugin->txt('back_to') . ' ' . $title;
			$back_to_text = sprintf($this->plugin->txt('back_to_title'), $title, $lng->txt($type));

			$link_button = ilLinkButton::getInstance();
			$link_button->setCaption($txt, false);
			$link_button->setUrl($link);

			$video_tpl->setCurrentBlock('return_link');
			$video_tpl->setVariable('RETURN_LINK', $link_button->render());
			$video_tpl->setVariable('BACK_TO_TITLE', $back_to_text);
			$video_tpl->setVariable('BACK_TO_TEXT', $txt);
			$video_tpl->setVariable('RETURN_HREF', $link);
			$video_tpl->setVariable('BACK_CANCEL', $lng->txt('cancel'));
			$video_tpl->parseCurrentBlock();
		}
	}

	
	
	/**
	 * @param bool $edit_screen
	 * @return string
	 */
	protected function initPlayerConfig($edit_screen = false)
	{
		/**
		 * $ilUser ilObjUser
		 */
		global $ilUser;

		ilTextAreaInputCkeditorGUI::appendJavascriptFile();

		$config_tpl = new ilTemplate("tpl.video_config.html", true, true, $this->plugin->getDirectory());
		$config_tpl->setVariable('VIDEO_FINISHED_POST_URL', $this->ctrl->getLinkTarget($this, 'postVideoFinishedPerAjax', '', true, false));
		$config_tpl->setVariable('VIDEO_STARTED_POST_URL', $this->ctrl->getLinkTarget($this, 'postVideoStartedPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_GET_URL', $this->ctrl->getLinkTarget($this, 'getQuestionPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_POST_URL', $this->ctrl->getLinkTarget($this, 'postAnswerPerAjax', '', true, false));
		$config_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postComment', '', true, false));
		$config_tpl->setVariable('SEND_BUTTON', $this->plugin->txt('send'));
		$config_tpl->setVariable('CLOSE_BUTTON', $this->plugin->txt('close'));
		$config_tpl->setVariable('FEEDBACK_JUMP_TEXT', $this->plugin->txt('feedback_jump_text'));
		$config_tpl->setVariable('LEARNING_RECOMMENDATION_TEXT', $this->plugin->txt('learning_recommendation'));
		$config_tpl->setVariable('MORE_INFORMATION_TEXT', $this->plugin->txt('more_informations'));
		$config_tpl->setVariable('ALREADY_ANSWERED_TEXT', $this->plugin->txt('already_answered'));
		$config_tpl->setVariable('QUESTION_TEXT', $this->plugin->txt('question'));
		$config_tpl->setVariable('PRIVATE_TEXT', $this->plugin->txt('is_private_comment'));
		$config_tpl->setVariable('RESET_TEXT', $this->plugin->txt('reset'));
		$config_tpl->setVariable('AUTHOR_FILTER', $this->plugin->txt('author_filter'));
		$config_tpl->setVariable('SWITCH_ON', $this->plugin->txt('switch_on'));
		$config_tpl->setVariable('SWITCH_OFF', $this->plugin->txt('switch_off'));
		$config_tpl->setVariable('SAVE', $this->plugin->txt('save'));
		$config_tpl->setVariable('ADD_COMMENT', $this->plugin->txt('insert_comment'));
		$config_tpl->setVariable('IS_CHRONOLOGIC_VALUE', $this->object->isChronologic());
		$config_tpl->setVariable('VIDEO_MODE', $this->object->getVideoMode());

		$ck = new ilTextAreaInputCkeditor($this->plugin);
		$ck->appendCkEditorToTemplate($config_tpl);

		$simple_choice = new SimpleChoiceQuestion();
		$ignore = $simple_choice->getAllNonRepeatAnsweredQuestion($ilUser->getId());
//		$repeatCorrect = 1;  //switch this: 1 --> repeat questons disregarding status, 0 --> only repeat incorrectly answered
		if($this->object->isRepeat())
		{
			$correct_question_id = $simple_choice->getAllRepeatCorrectlyAnsweredQuestion($ilUser->getId()); //marko - only show remaining incorrectly answered questions
			$ignore = array_merge($ignore,$correct_question_id);  //marko - see above
		}
		$config_tpl->setVariable('IGNORE_QUESTIONS', json_encode($ignore));

		if($this->object->isAnonymized())
		{
			$config_tpl->setVariable('USERNAME', '');
		}
		else
		{
			$config_tpl->setVariable('USERNAME', ilObjComment::lookupUsername($ilUser->getId()));
			$config_tpl->setVariable('USER_IMAGE', ilObjComment::getUserImageInBase64($ilUser->getId()));
		}

		if($edit_screen)
		{
			$config_tpl->setVariable('STOP_POINTS', json_encode(array()));
			$config_tpl->setVariable('COMMENTS', json_encode(array()));
			$config_tpl->setVariable('USER_IMAGES_CACHE', json_encode(array()));
		}
		else
		{
			$stop_points = $this->objComment->getStopPoints();
			$comments = $this->objComment->getContentComments();
			$config_tpl->setVariable('STOP_POINTS', json_encode($stop_points));
			$config_tpl->setVariable('COMMENTS', json_encode($comments));
			$config_tpl->setVariable('USER_IMAGES_CACHE', json_encode(ilObjComment::getUserImageCache()));
		}

		return $config_tpl->get();
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 * @return bool
	 */
	protected function validateCustom(ilPropertyFormGUI $a_form)
	{
		return parent::validateCustom($a_form);
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function updateCustom(ilPropertyFormGUI $a_form)
	{
		$factory = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$factory->checkForm($a_form);

		$is_task = $a_form->getInput('is_task');
		$this->object->setTaskActive((int)$is_task);

		$task = $a_form->getInput('task');
		$this->object->setTask(ilUtil::stripSlashes($task, false));

		$is_anonymized = $a_form->getInput('is_anonymized');
		$this->object->setIsAnonymized((int)$is_anonymized);

		$is_repeat = $a_form->getInput('is_repeat');
		$this->object->setIsRepeat((int)$is_repeat);

		$is_public = $a_form->getInput('is_public');
		$this->object->setIsPublic((int)$is_public);

		$is_online = $a_form->getInput('is_online');
		$this->object->setOnline((int)$is_online);

		$is_chronologic = $a_form->getInput('is_chronologic');
		$this->object->setIsChronologic((int)$is_chronologic);

		$no_comment = $a_form->getInput('no_comment');
		$this->object->setDisableComment((int)$no_comment);

		$factory = new ilInteractiveVideoSourceFactory();
		$source = $factory->getVideoSourceObject($a_form->getInput('source_id'));
		$source->doUpdateVideoSource($this->obj_id);

		$source_id = $a_form->getInput('source_id');
		$this->object->setSourceId(ilUtil::stripSlashes($source_id));

		$video_mode = $a_form->getInput('video_mode');
		$this->object->setVideoMode((int)$video_mode);

		$marker_for_students = $a_form->getInput('marker_for_students');
		$this->object->setMarkerForStudents((int)$marker_for_students);


		$this->object->update();

		parent::updateCustom($a_form);
	}

	/**
	 * @param string $type
	 * @return array
	 */
	protected function initCreationForms($type)
	{
		if($this->plugin->isCoreMin52())
		{
			$form_array =  array(
				self::CFORM_NEW => $this->initCreateForm($type),
				self::CFORM_IMPORT => $this->initImportForm($type)
			);
		}
		else
		{
			$form_array =  array(
				self::CFORM_NEW => $this->initCreateForm($type)
			);
		}
		return $form_array;
	}

	/**
	 * @param string $type
	 * @return ilPropertyFormGUI
	 */
	public function initCreateForm($type)
	{
		$form = parent::initCreateForm($type);

		$form = $this->appendFormsFromFactory($form);

		$online = new ilCheckboxInputGUI($this->lng->txt('online'), 'is_online');
		$form->addItem($online);

		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function initEditCustomForm(ilPropertyFormGUI $a_form)
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs;
		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('editProperties');

		$a_form = $this->appendFormsFromFactory($a_form);
		$ck = new ilTextAreaInputCkeditor($this->plugin);
		$ck->appendCkEditorMathJaxSupportToForm($a_form);
		$online = new ilCheckboxInputGUI($this->lng->txt('online'), 'is_online');
		$a_form->addItem($online);
		$this->appendDefaultFormOptions($a_form);

	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function appendDefaultFormOptions(ilPropertyFormGUI $a_form)
	{

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('process_header'));
		$a_form->addItem($section_header);

		$description_switch = new ilCheckboxInputGUI($this->plugin->txt('task_switch'),'is_task');
		$description_switch->setInfo($this->plugin->txt('task_switch_info'));
		$description = xvidUtils::constructTextAreaFormElement('task', 'task');
		$description_switch->addSubItem($description);
		$a_form->addItem($description_switch);

		$anonymized = new ilCheckboxInputGUI($this->plugin->txt('is_anonymized'), 'is_anonymized');
		$anonymized->setInfo($this->plugin->txt('is_anonymized_info'));
		$a_form->addItem($anonymized);

		$is_public = new ilCheckboxInputGUI($this->plugin->txt('is_public'), 'is_public');
		$is_public->setInfo($this->plugin->txt('is_public_info'));
		$a_form->addItem($is_public);

		$repeat = new ilCheckboxInputGUI($this->plugin->txt('is_repeat'), 'is_repeat');
		$repeat->setInfo($this->plugin->txt('is_repeat_info'));
		$a_form->addItem($repeat);

		$chrono = new ilCheckboxInputGUI($this->plugin->txt('is_chronologic'), 'is_chronologic');
		$chrono->setInfo($this->plugin->txt('is_chronologic_info'));
		$a_form->addItem($chrono);

		$no_comment = new ilCheckboxInputGUI($this->plugin->txt('no_comment'), 'no_comment');
		$no_comment->setInfo($this->plugin->txt('no_comment_info'));
		$a_form->addItem($no_comment);

		$marker_for_students = new ilCheckboxInputGUI($this->plugin->txt('marker_for_students'), 'marker_for_students');
		$marker_for_students->setInfo($this->plugin->txt('marker_for_students_info'));
		$a_form->addItem($marker_for_students);
	}

	/**
	 * @param array $a_values
	 */
	protected function getEditFormCustomValues(array &$a_values)
	{
		$factory = new ilInteractiveVideoSourceFactory();
		$sources = $factory->getVideoSources();
		/** $source ilInteractiveVideoSource */
		foreach($sources as $key => $source)
		{
			/** @var ilInteractiveVideoSourceGUI $gui */
			if($factory->isActive($source->getClass()))
			{
				$gui= $source->getGUIClass();
				$gui->getEditFormCustomValues($a_values, $this->object);
			}
		}
		$a_values['is_anonymized']		= $this->object->isAnonymized();
		$a_values['is_repeat'] 			= $this->object->isRepeat();
		$a_values['is_public']			= $this->object->isPublic();
		$a_values["is_online"]			= $this->object->isOnline();
		$a_values["is_chronologic"]		= $this->object->isChronologic();
		$a_values["marker_for_students"]= $this->object->getMarkerForStudents();
		$a_values['source_id']			= $this->object->getSourceId();
		$a_values['is_task']			= $this->object->getTaskActive();
		$a_values['task']				= $this->object->getTask();
	}

	public function editProperties()
	{
		$this->edit();
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	public function initEditForm()
	{
		$form = parent::initEditForm();
		$this->initEditCustomForm($form);
		return $form;
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
	public function save()
	{
		$this->saveObject();
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
	public function saveObject()
	{
		try
		{
			parent::saveObject();
		}
		catch(Exception $e)
		{
			if(
				$this->plugin->txt($e->getMessage()) != '-' . $e->getMessage() . '-' &&
				$this->plugin->txt($e->getMessage()) != '-rep_robj_xvid_' . $e->getMessage() . '-'
			)
			{
				ilUtil::sendFailure($this->plugin->txt($e->getMessage()), true);
			}
			else
			{
				ilUtil::sendFailure($e->getMessage(), true);
			}

			$this->ctrl->setParameterByClass('ilrepositorygui', 'ref_id', (int)$_GET['ref_id']);
			$this->ctrl->redirectByClass('ilrepositorygui');
		}
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 * @return ilPropertyFormGUI
	 */
	protected function appendFormsFromFactory(ilPropertyFormGUI $a_form)
	{
		$factory = new ilInteractiveVideoSourceFactory();
		$sources = $factory->getVideoSources();
		
		$item_group = new ilRadioGroupInputGUI($this->plugin->txt('source'), 'source_id');
		$a_form->addItem($item_group);
		$non_active = true;
		foreach($sources as $key => $source)
		{
			/** @var ilInteractiveVideoSourceGUI $gui */
			if($factory->isActive($source->getClass()))
			{
				$op = new ilRadioOption($this->plugin->txt($source->getId()), $source->getId());
				$gui= $source->getGUIClass();
				$gui->getForm($op, $this->obj_id);
				$item_group->addOption($op);
				$non_active = false;
			}
		}

		$item_group->setValue($factory->getDefaultVideoSource());

		if($non_active)
		{
			ilUtil::sendFailure($this->plugin->txt('at_least_one_source'));
		}
		return $a_form;
	}

	/**
	 * @see ilDesktopItemHandling::addToDesk()
	 */
	public function addToDeskObject()
	{
		/**
		 * @var $ilSetting ilSetting
		 */
		global $ilSetting;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::addToDesktop();
		ilUtil::sendSuccess($this->lng->txt('added_to_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @see ilDesktopItemHandling::removeFromDesk()
	 */
	public function removeFromDeskObject()
	{
		/**
		 * @var $ilSetting ilSetting
		 */
		global $ilSetting;

		if((int)$ilSetting->get('disable_my_offers'))
		{
			$this->ctrl->redirect($this);
			return;
		}

		include_once './Services/PersonalDesktop/classes/class.ilDesktopItemGUI.php';
		ilDesktopItemGUI::removeFromDesktop();
		ilUtil::sendSuccess($this->lng->txt('removed_from_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @param string $a_sub_type
	 * @param int    $a_sub_id
	 * @return ilObjectListGUI|ilObjInteractiveVideoListGUI
	 */
	protected function initHeaderAction($a_sub_type = null, $a_sub_id = null)
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		$lg = parent::initHeaderAction();
		
		if($lg instanceof ilObjInteractiveVideoListGUI)
		{
			if($ilUser->getId() != ANONYMOUS_USER_ID)
			{
				// Maybe handle notifications in future ...
			}
		}

		return $lg;
	}

	protected function setTabs()
	{
		/**
		 * @var $ilTabs   ilTabsGUI
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilTabs, $ilAccess;

		if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('content', $this->lng->txt('content'), $this->ctrl->getLinkTarget($this, 'showContent'));
		}

		$this->addInfoTab();

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editProperties', $this->lng->txt('settings'), $this->ctrl->getLinkTarget($this, 'editProperties'));
		}
		
		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', $this->plugin->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editComments'));
		}
		else if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', $this->plugin->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editMyComments'));
		}

		require_once 'Services/Tracking/classes/class.ilLearningProgressAccess.php';
		if(ilLearningProgressAccess::checkAccess($this->object->getRefId(), true))
		{
			if($this->checkPermissionBool('write'))
			{
				if($this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED)
				{
					$ilTabs->addTab('learning_progress', $this->lng->txt('learning_progress'), $this->ctrl->getLinkTargetByClass('ilInteractiveVideoLearningProgressGUI', 'showLpUsers'));
				}
				else
				{
					$ilTabs->addTab('learning_progress', $this->lng->txt('learning_progress'), $this->ctrl->getLinkTargetByClass('ilInteractiveVideoLearningProgressGUI', 'showLPSettings'));
				}
			}
			else if($this->checkPermissionBool('read') && $this->object->getLearningProgressMode() != ilObjInteractiveVideo::LP_MODE_DEACTIVATED)
			{
				$ilTabs->addTab('learning_progress', $this->lng->txt('learning_progress'), $this->ctrl->getLinkTargetByClass('ilInteractiveVideoLearningProgressGUI', 'showLPUserDetails'));
			}
		}
		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			if($this->plugin->isCoreMin52())
			{
				$ilTabs->addTab('export', $this->lng->txt('export'), $this->ctrl->getLinkTargetByClass('ilInteractiveVideoExportGUI', ''));
			}
		}

		$this->addPermissionTab();
	}

	/**
	 * @param string $a_tab
	 */
	public function setSubTabs($a_tab)
	{
		/**
		 * @var $ilTabs   ilTabsGUI
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilTabs, $ilAccess;

		switch($a_tab)
		{
			case 'editComments':
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('editComments', $this->plugin->txt('questions_comments_sub_tab'),$this->ctrl->getLinkTarget($this,'editComments'));
				}
				$ilTabs->addSubTab('editMyComments', $this->plugin->txt('my_comments'),$this->ctrl->getLinkTarget($this,'editMyComments'));
				$ilTabs->addSubTab('showMyResults', $this->plugin->txt('show_my_results'), $this->ctrl->getLinkTarget($this, 'showMyResults'));
				
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('showResults', $this->plugin->txt('user_results'), $this->ctrl->getLinkTarget($this, 'showResults'));
					$ilTabs->addSubTab('showQuestionsResults', $this->plugin->txt('question_results'), $this->ctrl->getLinkTarget($this, 'showQuestionsResults'));
					$ilTabs->addSubTab('showCompleteOverviewOverAllResults', $this->plugin->txt('complete_question_results'), $this->ctrl->getLinkTarget($this, 'showCompleteOverviewOverAllResults'));
				}
				break;
		}
	}
	/**
	 * Public wrapper for permission checks
	 * @param string $permission
	 * @return bool
	 */
	public function hasPermission($permission)
	{
		return $this->checkPermissionBool($permission);
	}

	/**
	 * Public wrapper for permission assumption
	 * @param string $permission
	 * @return bool
	 */
	public function ensurePermission($permission)
	{
		return $this->checkPermission($permission);
	}

	/**
	 * @return ilPlugin
	 */
	public function getPluginInstance()
	{
		return ilInteractiveVideoPlugin::getInstance();
	}

#region COMMENTS


	public function postComment()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		if(
			!isset($_POST['comment_text']) ||
			!is_string($_POST['comment_text']) ||
			!strlen(trim(ilUtil::stripSlashes($_POST['comment_text'])))
		)
		{
			ilUtil::sendFailure($this->plugin->txt('missing_comment_text'));
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure($this->plugin->txt('missing_stopping_point'));
			return;
		}

		if(isset($_POST['comment_time_end']))
		{
			$seconds_end = (int) $_POST['comment_time_end'];
		}
		else
		{
			$seconds_end = 0;
		}

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim($_POST['comment_text']));
		$comment->setCommentTime((float)$_POST['comment_time']);
		$comment->setCommentTimeEnd($seconds_end);

		if(strlen($_POST['marker']) > 0)
		{
			$marker = $_POST['marker'];
			$marker = preg_replace( "/\r|\n|\t/", "", $marker );

			$marker = '<svg>'.$marker.'</svg>';
			$marker = xvidUtils::secureSvg($marker);
			$comment->setMarker($marker);
			if($comment->getCommentTimeEnd() == 0)
			{
				$comment->setCommentTimeEnd($comment->getCommentTime() + 3 );
			}
		}


		if(array_key_exists('is_reply_to', $_POST))
		{
			$comment->setIsReplyTo((int) $_POST['is_reply_to']);
		}

		if($ilUser->getId() == ANONYMOUS_USER_ID)
		{
			// NO private-flag for Anonymous!!
			$comment->setIsPrivate(0);
		}
		else
		{
			$is_private = 0;
			if( $_POST['is_private'] == "true" )
			{
				$is_private = 1;
			}

			$comment->setIsPrivate($is_private );
		}
		$comment->create();
		$this->callExit();
	}


	/**
	 *
	 */
	public function confirmDeleteComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editComments');

		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteComment'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editComments');

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$comment_id = (int) $comment_id;
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
	}

	public function deleteComment()
	{
		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($this->plugin->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
		$this->editComments();
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	private function initCommentForm()
	{
		/**
		 * @var $ilUser ilObjUser
		 * @var $ilAccess ilAccessHandler
		 */
		global $tpl, $ilUser, $ilAccess;

		$form = new ilPropertyFormGUI();
		$custom_gui = new ilCustomInputGUI();
		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$this->addJavascriptAndCSSToTemplate($tpl);
		$object->addPlayerElements($tpl);

		$marker_template = '';
		if($this->object->getMarkerForStudents() == 1 || $ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$marker_template = $this->buildMarkerEditorTemplate()->get();
		}

		$custom_gui->setHtml($object->getPlayer()->get() . $this->initPlayerConfig(true) . $marker_template);
		$form->addItem($custom_gui);

		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
		$form->setTitle($this->plugin->txt('insert_comment'));
		$ck = new ilTextAreaInputCkeditor($this->plugin);
		$ck->appendCkEditorMathJaxSupportToForm($form);
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		$form->addItem($title);
		
		$time = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'comment_time');
		#$time->setShowTime(true);
		#$time->setShowSeconds(true);

		if(isset($_POST['comment_time']))
		{
			$seconds = $_POST['comment_time'];
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);

		$time_end = new ilInteractiveVideoTimePicker($this->plugin->txt('time_end'), 'comment_time_end');
		#$time_end->setShowTime(true);
		#$time_end->setShowSeconds(true);

		if(isset($_POST['comment_time_end']))
		{
			$seconds = $_POST['comment_time_end'];
			$time_end->setValueByArray(array('comment_time_end' => (int)$seconds));
		}
		$form->addItem($time_end);

		if($ilUser->getId() != ANONYMOUS_USER_ID)
		{
			$is_private = new ilCheckboxInputGUI($this->plugin->txt('is_private_comment'), 'is_private');
			$form->addItem($is_private);
		}

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($this->plugin->txt('comment'));
		$form->addItem($section_header);

		$comment = xvidUtils::constructTextAreaFormElement('comment', 'comment_text');
		$comment->setRequired(true);
		$form->addItem($comment);
		/** tags are deactivated for the moment
		$tags = new ilTextAreaInputGUI($plugin->txt('tags'), 'comment_tags');
		$form->addItem($tags);
		 **/
		$frm_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($frm_id);
		
		$fake_marker = new ilHiddenInputGUI('fake_marker');
		$form->addItem($fake_marker);

		return $form;
	}

	/**
	 *
	 */
	public function showTutorInsertCommentForm()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		$form = $this->initCommentForm();

		$form->addCommandButton('insertTutorComment', $this->lng->txt('insert'));
		$form->addCommandButton('cancelComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	public function cancelComments()
	{
		$this->ctrl->redirect($this, 'editComments');
	}

	public function editMyComments()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editMyComments');

		$ck = new ilTextAreaInputCkeditor($this->plugin);
		$ck->addMathJaxToGlobalTemplate();

		$tbl_data = $this->object->getCommentsTableDataByUserId();
		$this->plugin->includeClass('tables/class.ilInteractiveVideoCommentsTableGUI.php');
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editMyComments');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function updateMyComment()
	{
		$form = $this->initCommentForm();
		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);
			}

			$this->objComment->setCommentText($form->getInput('comment_text'));
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$this->objComment->setCommentTime($comment_time);

			$comment_time_end = $form->getInput('comment_time_end');
			$this->objComment->setCommentTimeEnd($comment_time_end);
			$this->objComment->update();

			$this->editMyComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editMyComment($form);
		}
	}

	public function confirmDeleteMyComment()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editMyComments');

		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteMyComment'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteMyComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editMyComments');

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$comment_id = (int) $comment_id;
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
	}

	public function deleteMyComment()
	{

		if(!isset($_POST['comment_id']) || !is_array($_POST['comment_id']) || !count($_POST['comment_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->editMyComments();
			return;
		}

		$post_ids = $_POST['comment_id'];
		$comments = $this->object->getCommentIdsByObjId($this->obj_id);
		$comment_ids = array_keys($comments);
		$user_ids = array_unique($comments);

		if(count($user_ids)> 1)
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
			$this->editMyComments();
		}

		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($this->plugin->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_comment_ids'));
		}
		$this->ctrl->redirect($this, 'editMyComment');
	}

	public function postTutorComment()
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

		if(
			!isset($_POST['comment_text']) ||
			!is_string($_POST['comment_text']) ||
			!strlen(trim(ilUtil::stripSlashes($_POST['comment_text'])))
		)
		{
			ilUtil::sendFailure($this->plugin->txt('missing_comment_text'));
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure($this->plugin->txt('missing_stopping_point'));
			return;
		}

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim(ilUtil::stripSlashes($_POST['comment_text'])));
		$comment->setCommentTime((float)$_POST['comment_time']);
		$comment->setCommentTimeEnd((float)$_POST['comment_time_end']);
		$comment->setIsTutor(true);
		$comment->create();

		$current_time = $comment->getCommentTime();
		$this->editComments($current_time);
	}

	public function updateComment()
	{
		$form = $this->initCommentForm();

		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);

			}
			$this->objComment->setCommentText($form->getInput('comment_text'));
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$this->objComment->setCommentTime($comment_time);
			$comment_time_end = $form->getInput('comment_time_end');
			$this->objComment->setCommentTimeEnd($comment_time_end);
			if(strlen($_POST['fake_marker']) > 0)
			{
				$marker = $_POST['fake_marker'];
				$marker = '<svg>'.$marker.'</svg>';
				$marker = preg_replace( "/\r|\n|\t/", "", $marker );
				$marker = xvidUtils::secureSvg($marker);
				$this->objComment->setMarker($marker);
				if($this->objComment->getCommentTimeEnd() == 0)
				{
					$this->objComment->setCommentTimeEnd($this->objComment->getCommentTime() + 3 );
				}
			}
			$this->objComment->update();

			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editComment($form);
		}
	}

	/**
	 * @param int $current_time
	 */
	public function editComments($current_time = 0)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		$video_tpl = new ilTemplate("tpl.edit_comment.html", true, true, $this->plugin->getDirectory());

		$video_tpl->setVariable('SCREEN_INFO', $this->plugin->txt('screen_info'));

		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$this->addJavascriptAndCSSToTemplate($tpl);
		$object->addPlayerElements($tpl);

		$video_tpl->setVariable('VIDEO_PLAYER', $object->getPlayer()->get());

		$video_tpl->setVariable('FORM_ACTION', $this->ctrl->getFormAction($this,'showTutorInsertForm'));

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());


		$video_tpl->setVariable('TXT_INS_COMMENT', $this->plugin->txt('insert_comment'));

		$video_tpl->setVariable('TXT_INS_QUESTION', $this->plugin->txt('insert_question'));
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());

		$video_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postTutorComment', '', false, false));

		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig(true));
		global $ilUser;
		$this->object->getLPStatusForUser($ilUser->getId());
		$tbl_data = $this->object->getCommentsTableData(true, true);
		$this->plugin->includeClass('tables/class.ilInteractiveVideoCommentsTableGUI.php');
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editComments');
		$tbl->setData($tbl_data);
		$video_tpl->setVariable('TABLE', $tbl->getHTML());
		$tpl->setContent($video_tpl->get());
	}

	/**
	 *
	 */
	public function insertTutorComment()
	{
		$this->insertComment(1);
	}

	/**
	 * @param int $is_tutor
	 */
	private function insertComment($is_tutor = 0)
	{
		$form = $this->initCommentForm();

		if($form->checkInput())
		{
			$this->objComment = new ilObjComment();

			$this->objComment->setObjId($this->object->getId());
			$this->objComment->setCommentText($form->getInput('comment_text'));
			$this->objComment->setInteractive(0);

			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));

			// calculate seconds
			$comment_time		= $form->getInput('comment_time');
			$this->objComment->setCommentTime($comment_time);
			$comment_time_end	= $form->getInput('comment_time_end');
			$this->objComment->setCommentTimeEnd($comment_time_end);
			$this->objComment->setIsTutor($is_tutor);

			$this->objComment->create();

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->ctrl->redirect($this, 'editComments');
		}
		else
		{
			$form->setValuesByPost();
			ilUtil::sendFailure($this->lng->txt('err_check_input'),true);
			$this->ctrl->redirect($this, 'showTutorInsertCommentForm');
		}

		if($is_tutor)
		{
			$this->editComments();
		}
		else
		{
			$this->showContent();
		}
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editMyComment(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editMyComments');

		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initCommentForm();
			$form->setValuesByArray($this->getCommentFormValues(), true);
		}

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateMyComment'));
		$form->setTitle($this->plugin->txt('edit_comment'));

		$form->addCommandButton('updateMyComment', $this->lng->txt('save'));
		$form->addCommandButton('editMyComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editComment(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initCommentForm();
			$form->setValuesByArray($this->getCommentFormValues(), true);
		}

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateComment'));
		$form->setTitle($this->plugin->txt('edit_comment'));
		$form->addCommandButton('updateComment', $this->lng->txt('save'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param int $comment_id
	 * @return array
	 */
	private function getCommentFormValues($comment_id = 0)
	{		
		if($comment_id == 0)
		{
			if(!isset($_GET['comment_id']) && !isset($_POST['comment_id']))
			{
				ilUtil::sendFailure($this->plugin->txt('no_comment_id_given'), true);
				return $this->showContent();
			}
			else
			{
				$comment_id = (int)$_GET['comment_id'] ? (int)$_GET['comment_id'] : (int)$_POST['comment_id'] ;
			}
		}

		$comment_data				= $this->object->getCommentDataById($comment_id);
		$values['comment_id']		= $comment_data['comment_id'];
		$values['comment_time']		= $comment_data['comment_time'];
		$values['comment_time_end']	= $comment_data['comment_time_end'];
		$values['comment_text']		= $comment_data['comment_text'];
		$values['is_interactive']	= $comment_data['is_interactive'];
		$values['comment_title']	= $comment_data['comment_title'];
		$values['comment_tags']		= $comment_data['comment_tags'];
		$values['is_private']		= $comment_data['is_private'];
		$values['fake_marker']			= $comment_data['marker'];

		return $values;
	}
#endregion

#region QUESTIONS
	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function showTutorInsertQuestionForm(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');

		if(!($form instanceof ilPropertyFormGUI))
		{
			$simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
			$form = $simple_question->initQuestionForm();
			$ck = new ilTextAreaInputCkeditor($this->plugin);
			$ck->appendCkEditorMathJaxSupportToForm($form);
		}

		$form->addCommandButton('insertQuestion', $this->lng->txt('insert'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}


	public function insertQuestion()
	{
		$simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
		$form = $simple_question->initQuestionForm();

		if($form->checkInput())
		{
			$this->objComment = new ilObjComment();

			$this->objComment->setObjId($this->object->getId());
			$this->objComment->setCommentText($form->getInput('question_text'));
			$this->objComment->setInteractive(1);

			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setIsPrivate(0);

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
			$this->objComment->setCommentTime($comment_time);
			$comment_time_end = $form->getInput('comment_time_end');
			$this->objComment->setCommentTimeEnd($comment_time_end);
			$this->objComment->setIsTutor(1);
			$this->objComment->create();

			$this->performQuestionRefresh($this->objComment->getCommentId(), $form);

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->ctrl->redirect($this, 'editComments');
		}
		else
		{
			$form->setValuesByPost();
			ilUtil::sendFailure($this->lng->txt('err_check_input'));
			$this->showTutorInsertQuestionForm($form);
		}
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editQuestion(ilPropertyFormGUI $form = NULL)
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');

		if(!($form instanceof ilPropertyFormGUI))
		{
			$simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
			$form = $simple_question->initQuestionForm();
			$form->setValuesByArray($this->getQuestionFormValues(),true);
		}

		$this->getAnswerDefinitionsJSON();

		$form->addCommandButton('confirmUpdateQuestion', $this->lng->txt('update'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param int $comment_id
	 * @return array
	 */
	private function getQuestionFormValues($comment_id = 0)
	{
		if($comment_id == 0)
		{
			if(!isset($_GET['comment_id']) && !isset($_POST['comment_id']))
			{
				ilUtil::sendFailure($this->plugin->txt('no_comment_id_given'), true);
				return $this->editComments();
			}
			else
			{
				$comment_id = (int)$_GET['comment_id'] ? (int)$_GET['comment_id'] : (int)$_POST['comment_id'];
			}
		}

		$comment_data				= $this->object->getCommentDataById((int)$comment_id);
		$values['comment_id']		= $comment_data['comment_id'];
		$values['comment_time']		= $comment_data['comment_time'];
		$values['comment_time_end']	= $comment_data['comment_time_end'];
		$values['comment_text']		= $comment_data['comment_text'];
		$values['is_interactive']	= $comment_data['is_interactive'];
		$values['comment_title']	= $comment_data['comment_title'];
		$values['comment_tags']		= $comment_data['comment_tags'];

		$question_data = $this->object->getQuestionDataById((int)$comment_id);

		$values['question_text']			= $question_data['question_data']['question_text'];
		$values['question_type']			= $question_data['question_data']['type'];
		$values['feedback_correct']			= $question_data['question_data']['feedback_correct'];
		$values['is_jump_correct']			= $question_data['question_data']['is_jump_correct'];
		$values['show_correct_icon']		= $question_data['question_data']['show_correct_icon'];
		$values['jump_correct_ts']			= $question_data['question_data']['jump_correct_ts'];
		$values['feedback_one_wrong']		= $question_data['question_data']['feedback_one_wrong'];
		$values['show_response_frequency']	= $question_data['question_data']['show_response_frequency'];
		$values['is_jump_wrong']			= $question_data['question_data']['is_jump_wrong'];
		$values['show_wrong_icon']			= $question_data['question_data']['show_wrong_icon'];
		$values['jump_wrong_ts']			= $question_data['question_data']['jump_wrong_ts'];
		$values['limit_attempts']			= $question_data['question_data']['limit_attempts'];
		$values['repeat_question']			= $question_data['question_data']['repeat_question'];
		$values['feedback_correct_obj']		= $question_data['question_data']['feedback_correct_ref_id'];
		$values['feedback_wrong_obj']		= $question_data['question_data']['feedback_wrong_ref_id'];
		$values['show_comment_field']		= $question_data['question_data']['reflection_question_comment'];
		$values['neutral_type']				= $question_data['question_data']['neutral_answer'];
//		$values['question_correct']			= $question_data['question_data']['question_correct']; //marko

		return $values;
	}


	public function confirmUpdateQuestion()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;
		$ilTabs->activateTab('editComments');

		$comment_id = (int)$_POST['comment_id'];
		$form_values = array();

		if(!$chk =  SimpleChoiceQuestion::existUserAnswer($comment_id))
		{
			$this->updateQuestion();
		}
		else
		{
			$confirm = new ilConfirmationGUI();
			$confirm->setFormAction($this->ctrl->getFormAction($this, 'updateQuestion'));
			$confirm->setHeaderText($this->plugin->txt('sure_update_question'));

			$confirm->setCancel($this->lng->txt('cancel'), 'editComments');
			$confirm->setConfirm($this->lng->txt('update'), 'updateQuestion');
			foreach($_POST as $key=>$value)
			{
				//@todo .... very quick ... very dirty .... 
				if($key != 'cmd')
				{
					$form_values[$key] = $value;
				}
			}
			$confirm->addHiddenItem('form_values', serialize($form_values));
			$confirm->addHiddenItem('form_files', serialize($_FILES));
			$tpl->setContent($confirm->getHTML());
		}
	}

	public function updateQuestion()
	{
		$simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
		$form = $simple_question->initQuestionForm();
		if(isset($_POST['form_values']))
		{
			//@todo .... very quick ... very wtf .... 
			$_POST = unserialize($_POST['form_values']);
			$_FILES = unserialize($_REQUEST['form_files']);
		}

		if($form->checkInput())
		{
			$comment_id = (int)$form->getInput('comment_id');
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);
			}
			$this->objComment->setCommentText($form->getInput('question_text'));
			$this->objComment->setInteractive((int)$form->getInput('is_interactive'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));

			// calculate seconds
			$this->objComment->setCommentTime($form->getInput('comment_time'));
			$this->objComment->setCommentTimeEnd($form->getInput('comment_time_end'));
			$this->objComment->update();

			$this->performQuestionRefresh($comment_id, $form);

			ilUtil::sendSuccess($this->lng->txt('saved_successfully'));
			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editQuestion($form);
		}
	}

	/**
	 * @param $comment_id
	 * @param ilPropertyFormGUI $form
	 */
	private function performQuestionRefresh($comment_id, $form)
	{
		$question    = new SimpleChoiceQuestion($comment_id);
		#$question_id = $question->existQuestionForCommentId($comment_id);
		$question->setCommentId($comment_id);
		$question->setType((int)$form->getInput('question_type'));
		if(count($_FILES) > 0 && array_key_exists('question_image', $_FILES))
		{
			$this->object->uploadImage($comment_id, $question, $_FILES['question_image']);
		}
		if(array_key_exists('ffmpeg_thumb', $_POST))
		{
			$file = ilInteractiveVideoFFmpeg::moveSelectedImage($comment_id, $this->object->getId(), $_POST['ffmpeg_thumb']);
			$question->setQuestionImage($file);
		}
		if(array_key_exists('question_image_delete', $_POST))
		{
			ilInteractiveVideoFFmpeg::removeSelectedImage($question->getQuestionImage());
			$question->setQuestionImage(null);
		}
		
		$question->setQuestionText(ilUtil::stripSlashes($form->getInput('question_text'), false));
		$question->setFeedbackCorrect(ilUtil::stripSlashes($form->getInput('feedback_correct'), false));
		$question->setFeedbackOneWrong(ilUtil::stripSlashes($form->getInput('feedback_one_wrong'), false));

		$question->setLimitAttempts((int)$form->getInput('limit_attempts'));
		$question->setFeedbackCorrectId((int)$form->getInput('feedback_correct_obj'));
		$question->setFeedbackWrongId((int)$form->getInput('feedback_wrong_obj'));

		$question->setIsJumpCorrect((int)$form->getInput('is_jump_correct'));
		$question->setShowCorrectIcon((int)$form->getInput('show_correct_icon'));
		$question->setJumpCorrectTs((int) $form->getInput('jump_correct_ts'));

		$question->setIsJumpWrong((int)$form->getInput('is_jump_wrong'));
		$question->setShowWrongIcon((int)$form->getInput('show_wrong_icon'));
		$question->setJumpWrongTs((int)$form->getInput('jump_wrong_ts'));

		$question->setShowResponseFrequency((int)$form->getInput('show_response_frequency'));
		$question->setRepeatQuestion((int)$form->getInput('repeat_question'));
		$question->setReflectionQuestionComment((int)$form->getInput('show_comment_field'));
		$question->setNeutralAnswer((int)$form->getInput('neutral_type'));
		$question->deleteQuestionsIdByCommentId($comment_id);
		$question->create();

	}

	/**
	 * @return string
	 */
	public function getAnswerDefinitionsJSON()
	{
		$simple_choice = new SimpleChoiceQuestion();
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$question_id = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);
		$question = new ilTemplate("tpl.simple_questions.html", true, true, $this->plugin->getDirectory());
		if($question_id > 0)
		{
			$question->setVariable('JSON', $ajax_object->getJsonForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
		}
		else
		{
			$question->setVariable('JSON', json_encode(array()));
			$question->setVariable('QUESTION_TYPE', 0);
		}

		return $question->get();
	}

	public function showResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showResults');

		$simple = new SimpleChoiceQuestionStatistics();
		$tbl_data = $simple->getPointsForUsers($this->obj_id);
		$this->plugin->includeClass('tables/class.SimpleChoiceQuestionsTableGUI.php');
		$tbl = new SimpleChoiceQuestionsTableGUI($this, 'showResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function showMyResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showMyResults');

		$simple = new SimpleChoiceQuestionScoring();
		$tbl_data = $simple->getMyPoints($this->obj_id);
		$this->plugin->includeClass('tables/class.SimpleChoiceQuestionsUserTableGUI.php');
		$tbl = new SimpleChoiceQuestionsUserTableGUI($this, 'showMyResults');
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function showCompleteOverviewOverAllResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showCompleteOverviewOverAllResults');
		$this->plugin->includeClass('tables/class.SimpleChoiceQuestionsCompleteUserTableGUI.php');
		$simple = new SimpleChoiceQuestionStatistics();
		$data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);
		$tbl = new SimpleChoiceQuestionsCompleteUserTableGUI($this, 'showCompleteResults', $data['question']);
		$tbl_data = $data['users'];
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());

	}

	public function confirmDeleteUserResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showResults');

		if(!isset($_POST['user_id']) || !is_array($_POST['user_id']) || !count($_POST['user_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showResults();
			return;
		}

		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteUserResults'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteUserResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showResults');

		$user_ids = $_POST['user_id'];

		foreach($user_ids as $user_id)
		{
			$user_id = (int) $user_id;
			$login = ilObjUser::_lookupName($user_id);

			$confirm->addItem('user_id[]', $user_id, $login['firstname'].' '.$login['lastname']);
		}

		$tpl->setContent($confirm->getHTML());
	}

	public function deleteUserResults()
	{
		if(!isset($_POST['user_id']) || !is_array($_POST['user_id']) || !count($_POST['user_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showResults();
			return;
		}

		$user_ids = $_POST['user_id'];

		if(count($user_ids) > 0)
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteUserResults($user_ids, $this->obj_id);
			ilUtil::sendSuccess($this->plugin->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_user_ids'));
		}
		$this->showResults();
	}

	public function showQuestionsResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showQuestionsResults');

		$simple = new SimpleChoiceQuestionStatistics();
		$tbl_data = $simple->getQuestionsOverview($this->obj_id);
		$this->plugin->includeClass('tables/class.SimpleChoiceQuestionsOverviewTableGUI.php');
		$tbl = new SimpleChoiceQuestionsOverviewTableGUI($this, 'showQuestionsResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

	public function confirmDeleteQuestionsResults()
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showQuestionsResults');


		if(!isset($_POST['question_id']) || !is_array($_POST['question_id']) || !count($_POST['question_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}

		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteQuestionsResults'));
		$confirm->setHeaderText($this->plugin->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteQuestionsResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showQuestionsResults');

		$question_ids = $_POST['question_id'];

		foreach($question_ids as $question_id)
		{
			$question_id = (int) $question_id;
			$confirm->addItem('question_id[]', $question_id, $question_id);
		}

		$tpl->setContent($confirm->getHTML());
	}

	public function deleteQuestionsResults()
	{
		if(!isset($_POST['question_id']) || !is_array($_POST['question_id']) || !count($_POST['question_id']))
		{
			ilUtil::sendFailure($this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}

		$question_ids = $_POST['question_id'];

		if(count($question_ids) > 0)
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteQuestionsResults($question_ids);
			ilUtil::sendSuccess($this->plugin->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($this->plugin->txt('invalid_question_ids'));
		}
		$this->showQuestionsResults();
	}
#endregion

#region AJAX
	public function getQuestionPerAjax()
	{
		$ajax_object = new SimpleChoiceQuestionAjaxHandler();

		$existUserAnswer = SimpleChoiceQuestion::existUserAnswer((int)$_GET['comment_id']);

		$is_repeat_question = SimpleChoiceQuestion::isRepeatQuestionEnabled((int)$_GET['comment_id']);
		$tpl_json      = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);
		if(($is_repeat_question == true)
			|| ($is_repeat_question == false && $existUserAnswer == false))
		{
			$tpl_json->setVariable('JSON', $ajax_object->getJsonForCommentId((int)$_GET['comment_id']));
			$tpl_json->show("DEFAULT", false, true);
			$this->callExit();
		}
		return;
	}

	public function postAnswerPerAjax()
	{
		if(SimpleChoiceQuestion::isLimitAttemptsEnabled((int)$_POST['qid']) == false)
		{
			$answer = is_array($_POST['answer']) ? ilUtil::stripSlashesRecursive($_POST['answer']) : array();
			$simple_choice = new SimpleChoiceQuestion();
			$simple_choice->saveAnswer((int) $_POST['qid'], $answer);
		}
		else if(SimpleChoiceQuestion::existUserAnswerForQuestionId((int)$_POST['qid']) == false)
		{
			$answer = is_array($_POST['answer']) ? ilUtil::stripSlashesRecursive($_POST['answer']) : array();
			$simple_choice = new SimpleChoiceQuestion();
			$simple_choice->saveAnswer((int) $_POST['qid'], $answer);
		}
		$this->showFeedbackPerAjax();
		$this->callExit();
	}

	/**
	 * 
	 */
	public function generateThumbnailsFromSourcePerAjax()
	{
		$tpl_json = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);

		if(array_key_exists('time', $_POST))
		{
			$time = ilUtil::stripSlashes($_POST['time']);
		}
		else
		{
			$time = '00:00:00.0';
		}
		$path = CLIENT_WEB_DIR . '/xvid/xvid_'.$this->object->getId().'/images';
		ilUtil::makeDirParents($path);
		$factory = new ilInteractiveVideoSourceFactory();
		$source = $factory->getVideoSourceObject($this->object->getSourceId());
		if($source->isFileBased())
		{
			$file_path = $source->getPath($this->object->getId());
			try{
				$json = ilInteractiveVideoFFmpeg::extractImageWrapper($file_path, '', $path , $time, true);
				$tpl_json->setVariable('JSON', $json);
				$tpl_json->show("DEFAULT", false, true);
			}catch(ilFFmpegException $e)
			{
				$tpl_json->setVariable('JSON', json_encode(array('error' => $e->getMessage())));
				$tpl_json->show("DEFAULT", false, true);
			}
		

		}
		$this->callExit();
	}

	public function showFeedbackPerAjax()
	{
		$tpl_json = $this->plugin->getTemplate('default/tpl.show_question.html', false, false);
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$feedback      = $ajax_object->getFeedbackForQuestion($_POST['qid']);
		$tpl_json->setVariable('JSON', $feedback);
		$tpl_json->show("DEFAULT", false, true );
	}

	public function postVideoStartedPerAjax()
	{
		global $ilUser;
		$this->object->saveVideoStarted($this->obj_id, $ilUser->getId());
		$this->object->trackProgress();
		$this->callExit();
	}

	public function postVideoFinishedPerAjax()
	{
		global $ilUser;
		$simple = new SimpleChoiceQuestion();
		$qst = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->object->getId());
		$this->object->saveVideoFinished($this->obj_id, $ilUser->getId());
		if(is_array($qst) && count($qst) > 0)
		{
			$points = $simple->getAllUsersWithCompletelyCorrectAnswers($this->obj_id, $ilUser->getId());
			$questions_with_points = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->obj_id);
			if( count($questions_with_points) == $points )
			{
				$this->object->updateLP();
			}
		}
		else
		{
			$this->object->updateLP();
		}

		$this->callExit();
	}
	
	protected function callExit()
	{
		exit();
	}
#endregion

#region EXPORT
	public function completeCsvExport()
	{

		global $lng;

		$simple = new SimpleChoiceQuestionStatistics();
		$data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);

		$csv = array();
		$separator = ";";

		$head_row = array();
		array_push($head_row, $lng->txt('name'));
		foreach ($data['question'] as $key => $row)
		{
			array_push($head_row, trim($row, '"'));
			array_push($head_row, trim($row, '"') . ' ' .$this->plugin->txt('answers') );
		}
		array_push($head_row, $this->plugin->txt('answered') );
		array_push($head_row, $this->plugin->txt('sum'));
		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		$ignore_column = array('name','answerd', 'sum');
		foreach ($data['users'] as $key => $row)
		{
			$csv_row = array();
			foreach ( $row as $type => $value)
			{
				array_push($csv_row, trim($value, '"'));
				if(isset($data['answers'][$key][$type]))
				{
					array_push($csv_row, trim($data['answers'][$key][$type], '"'));
				}
				else if(!in_array($type, $ignore_column))
				{
					array_push($csv_row, '');
				}
			}
			array_push($csv, ilUtil::processCSVRow($csv_row, TRUE, $separator));
		}
		$csv_output = "";
		foreach ($csv as $row)
		{
			$csv_output .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csv_output, $this->object->getTitle() .  ".csv");
	}
	
	public function exportMyComments()
	{
		global $lng;

		$data = $this->object->getCommentsTableDataByUserId();

		$csv = array();
		$separator = ";";

		$head_row = array();
		array_push($head_row, $lng->txt('id'));
		array_push($head_row, $lng->txt('time'));
		array_push($head_row, $this->plugin->txt('time_end') );
		array_push($head_row, $this->plugin->txt('comment_title'));
		array_push($head_row, $this->plugin->txt('comment'));
		array_push($head_row, $this->plugin->txt('visibility'));
		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		foreach ($data as $key => $row)
		{
			$csv_row = array();
			foreach ( $row as $type => $value)
			{
				array_push($csv_row, trim($value, '"'));
			}
			array_push($csv, ilUtil::processCSVRow($csv_row, TRUE, $separator));
		}
		$csv_output = "";
		foreach ($csv as $row)
		{
			$csv_output .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csv_output, $this->object->getTitle() .  ".csv");
	}

	public function exportAllComments()
	{
		global $lng;

		$data = $this->object->getCommentsTableData(true);

		$csv = array();
		$separator = ";";

		$head_row = array();

		array_push($head_row, $lng->txt('id'));
		array_push($head_row, $lng->txt('time'));
		array_push($head_row, $this->plugin->txt('time_end') );
		array_push($head_row, $this->plugin->txt('user_id') );
		array_push($head_row, $this->plugin->txt('comment_title'));
		array_push($head_row, $this->plugin->txt('comment'));
		array_push($head_row, $this->plugin->txt('tutor'));
		array_push($head_row, $this->plugin->txt('interactive'));

		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		foreach ($data as $key => $row)
		{
			$csv_row = array();
			foreach ( $row as $type => $value)
			{
				array_push($csv_row, trim($value, '"'));
			}
			array_push($csv, ilUtil::processCSVRow($csv_row, TRUE, $separator));
		}
		$csv_output = "";
		foreach ($csv as $row)
		{
			$csv_output .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csv_output, $this->object->getTitle() .  ".csv");
	}
#endregion
	/**
	 * @param $a_target
	 */
	public static function _goto($a_target)
	{
		/**
		 * @var $ilCtrl ilCtrl
		 * @var $ilAccess ilAccessHandler 
		 * @var $lng ilLanguage
		 */
		global $ilCtrl, $ilAccess, $lng;

		$t			= explode("_", $a_target[0]);
		$ref_id		= (int) $t[0];
		$class_name	= $a_target[1];

		if ($ilAccess->checkAccess("read", "", $ref_id))
		{
			$ilCtrl->initBaseClass("ilObjPluginDispatchGUI");
			$ilCtrl->setTargetScript("ilias.php");
			$ilCtrl->getCallStructure(strtolower("ilObjPluginDispatchGUI"));
			$ilCtrl->setParameterByClass($class_name, "ref_id", $ref_id);
			$ilCtrl->saveParameterByClass($class_name, 'xvid_referrer_ref_id');
			$ilCtrl->setParameterByClass($class_name, 'xvid_referrer', urlencode($_GET['xvid_referrer']));
			$ilCtrl->redirectByClass(array("ilobjplugindispatchgui", $class_name), "");
		}
		else if($ilAccess->checkAccess("visible", "", $ref_id))
		{
			$ilCtrl->initBaseClass("ilObjPluginDispatchGUI");
			$ilCtrl->setTargetScript("ilias.php");
			$ilCtrl->getCallStructure(strtolower("ilObjPluginDispatchGUI"));
			$ilCtrl->setParameterByClass($class_name, "ref_id", $ref_id);
			$ilCtrl->saveParameterByClass($class_name, 'xvid_referrer_ref_id');
			$ilCtrl->setParameterByClass($class_name, 'xvid_referrer', urlencode($_GET['xvid_referrer']));
			$ilCtrl->redirectByClass(array("ilobjplugindispatchgui", $class_name), "infoScreen");
		}
		else if ($ilAccess->checkAccess("read", "", ROOT_FOLDER_ID))
		{
			ilUtil::sendFailure(sprintf($lng->txt("msg_no_perm_read_item"),
				ilObject::_lookupTitle(ilObject::_lookupObjId($ref_id))));
			include_once("./Services/Object/classes/class.ilObjectGUI.php");
			ilObjectGUI::_gotoRepositoryRoot();
		}
	}
}
