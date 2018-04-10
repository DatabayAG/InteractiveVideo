<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Repository/classes/class.ilObjectPluginGUI.php';
require_once 'Services/PersonalDesktop/interfaces/interface.ilDesktopItemHandling.php';
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactory.php';
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/class.ilInteractiveVideoSourceFactoryGUI.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionAjaxHandler.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionScoring.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionStatistics.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('Form/class.ilTextAreaInputCkeditorGUI.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('Form/class.ilInteractiveVideoTimePicker.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('Form/class.ilInteractiveVideoPreviewPicker.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilInteractiveVideoFFmpeg.php');

/**
 * Class ilObjInteractiveVideoGUI
 * @author               Nadia Ahmad <nahmad@databay.de>
 * @ilCtrl_isCalledBy    ilObjInteractiveVideoGUI: ilRepositoryGUI, ilAdministrationGUI, ilObjPluginDispatchGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilPermissionGUI, ilInfoScreenGUI, ilObjectCopyGUI, ilRepositorySearchGUI, ilPublicUserProfileGUI, ilCommonActionDispatcherGUI, ilMDEditorGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilInteractiveVideoLearningProgressGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilPropertyFormGUI
 * @ilCtrl_Calls         ilObjInteractiveVideoGUI: ilInteractiveVideoExportGUI
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
	 * @var
	 */
	public $plugin;

	/**
	 * @param ilInteractiveVideoPlugin $plugin
	 * @param ilPropertyFormGUI $form
	 */
	protected function appendImageUploadForm($plugin, $form)
	{
		$image_upload  = new ilInteractiveVideoPreviewPicker($plugin->txt('question_image'), 'question_image');
		if(isset($_GET['comment_id']) || isset($_POST['comment_id']))
		{
			$comment_id = (int)$_GET['comment_id'] ? (int)$_GET['comment_id'] : (int)$_POST['comment_id'];
			if($comment_id != 0)
			{
				$question_data = $this->object->getQuestionDataById((int)$comment_id);
				if(array_key_exists('question_data', $question_data) && array_key_exists('question_image', $question_data['question_data']) )
				{
					$image_upload->setValue($question_data['question_data']['question_image']);
					$image_upload->setImage($question_data['question_data']['question_image']);
				}
			}
		}
		$factory = new ilInteractiveVideoSourceFactory();
		$source = $factory->getVideoSourceObject($this->object->getSourceId());
		if($source->isFileBased())
		{
			$image_upload->setPathToVideo($source->getPath($this->object->getId()));
		}
		else
		{
			$image_upload->setCanExtractImages(false);
		}

		$form->addItem($image_upload);
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
		 * @var $tpl    ilTemplate
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
				$form = $this->initQuestionForm();
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
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$ilTabs->activateTab('content');

		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $plugin->getDirectory());

		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$object->addPlayerElements($tpl);

		if($this->object->getTaskActive())
		{
			$video_tpl->setCurrentBlock('task_description');
			$video_tpl->setVariable('TASK_TEXT',$plugin->txt('task'));
			$video_tpl->setVariable('TASK_DESCRIPTION', $this->object->getTask());
			$video_tpl->parseCurrentBlock();
		}

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
		require_once("./Services/UIComponent/Modal/classes/class.ilModalGUI.php");
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setType(ilModalGUI::TYPE_LARGE);
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());
		$video_tpl->setVariable('TXT_COMMENTS', $plugin->txt('comments'));
		$video_tpl->setVariable('SHOW_ALL_COMMENTS', $plugin->txt('show_all_comments'));
		$video_tpl->setVariable('AUTHOR_FILTER', $plugin->txt('author_filter'));
		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig());

		if($this->object->getDisableComment() != 1)
		{
			$comments_tpl = new ilTemplate("tpl.comments_form.html", true, true, $plugin->getDirectory());
			$comments_tpl->setVariable('COMMENT_TIME_END', $plugin->txt('time_end'));
			$picker = new ilInteractiveVideoTimePicker('comment_time_end', 'comment_time_end');
			$comments_tpl->setVariable('COMMENT_TIME_END_PICKER', $picker->render());
			$comments_tpl->setVariable('TXT_COMMENT', $plugin->txt('insert_comment'));
			$comments_tpl->setVariable('TXT_ENDTIME_WARNING', $plugin->txt('endtime_warning'));
			$comments_tpl->setVariable('TXT_NO_TEXT_WARNING', $plugin->txt('no_text_warning'));
			$comments_tpl->setVariable('TXT_IS_PRIVATE', $plugin->txt('is_private_comment'));


			$comments_tpl->setVariable('TXT_POST', $this->lng->txt('save'));
			$comments_tpl->setVariable('TXT_CANCEL', $plugin->txt('cancel'));
			$video_tpl->setVariable("COMMENTS_FORM", $comments_tpl->get());
		}

		$tpl->setContent($video_tpl->get());
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
			$type		=  $ilObjDataCache->lookupType($obj_id);
			$txt		= ilInteractiveVideoPlugin::getInstance()->txt('back_to') . ' ' . $title;
			$back_to_text = sprintf(ilInteractiveVideoPlugin::getInstance()->txt('back_to_title'), $title, $lng->txt($type));

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
	 * @return string
	 */
	public function getInteractiveForm()
	{
		/**
		 * $tpl ilTemplate
		 */
		global $tpl;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$tpl->addJavaScript($plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionCreator.js');
		$tpl->addCss($plugin->getDirectory() . '/templates/default/xvid.css');
		$simple_choice = new SimpleChoiceQuestion();
        $ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$question_id = $simple_choice->existQuestionForCommentId((int)$_GET['comment_id']);
		$question = new ilTemplate("tpl.simple_questions.html", true, true, $plugin->getDirectory());

		$ck_editor = new ilTemplate("tpl.ckeditor_mathjax.html", true, true, $plugin->getDirectory());
		$mathJaxSetting = new ilSetting('MathJax');
		if($mathJaxSetting->get('enable'))
		{
			$tpl->addJavaScript($mathJaxSetting->get('path_to_mathjax'));
			$ck_editor->setVariable('MATH_JAX_CONFIG', $mathJaxSetting->get('path_to_mathjax'));
		}
		$question->setVariable('CK_CONFIG', $ck_editor->get());
		$question->setVariable('ANSWER_TEXT',		$plugin->txt('answer_text'));
		$question->setVariable('CORRECT_SOLUTION', 	$plugin->txt('correct_solution'));
		if($question_id > 0)
		{
			$question->setVariable('JSON', $ajax_object->getJsonForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
			$question->setVariable('QUESTION_TEXT', $simple_choice->getQuestionTextQuestionId($question_id));
		}
		else
		{
			$answers = array();
			if(is_array($_POST) && array_key_exists('answer', $_POST) && sizeof($_POST['answer'] > 0))
			{
				$post_answers = ilUtil::stripSlashesRecursive($_POST['answer']);
				foreach($post_answers as $key => $value)
				{
					$correct = 0;
					if(is_array($_POST['correct']) && array_key_exists($key, $_POST['correct']))
					{
						$correct = 1;
					}
					array_push($answers, array('answer' => $value, 'correct' => $correct));
				}
			}
			$question->setVariable('JSON', json_encode($answers));
			$question->setVariable('QUESTION_TYPE', 0);
			$question->setVariable('QUESTION_TEXT', '');
		}
		$lng = ilInteractiveVideoPlugin::getInstance();
		$question->setVariable('LABEL_FEEDBACK_NEUTRAL',		json_encode($lng->txt('feedback_neutral')));
		$question->setVariable('LABEL_JUMP_NEUTRAL',			json_encode($lng->txt('feedback_jump_neutral')));
		$question->setVariable('LABEL_JUMP_NEUTRAL_INFO',		json_encode($lng->txt('feedback_jump_neutral_info')));
		$question->setVariable('LABEL_REPOSITORY_NEUTRAL',		json_encode($lng->txt('feedback_repository_neutral')));
		$question->setVariable('LABEL_REPOSITORY_NEUTRAL_INFO',	json_encode($lng->txt('feedback_repository_neutral_info')));
		$question->setVariable('LABEL_FEEDBACK_CORRECT',		json_encode($lng->txt('feedback_correct')));
		$question->setVariable('LABEL_JUMP_CORRECT',			json_encode($lng->txt('is_jump_correct')));
		$question->setVariable('LABEL_JUMP_CORRECT_INFO',		json_encode($lng->txt('is_jump_correct_info')));
		$question->setVariable('LABEL_REPOSITORY_CORRECT',		json_encode($lng->txt('feedback_correct_obj')));
		$question->setVariable('LABEL_REPOSITORY_CORRECT_INFO',	json_encode($lng->txt('feedback_correct_obj_info')));
		$question->setVariable('LABEL_TIME',	json_encode($lng->txt('time_for_preview')));
		$question->setVariable('QUESTION_ID', $question_id);
		return $question->get();
	}
	


	/**
	 * @return string
	 */
	protected function initPlayerConfig($edit_screen = false)
	{
		/**
		 * $ilUser ilObjUser
		 * $tpl ilTemplate
		 */
		global $ilUser, $tpl;

		$plugin = ilInteractiveVideoPlugin::getInstance();

		$tpl->addCss($plugin->getDirectory() . '/templates/default/xvid.css');
		$tpl->addCss($plugin->getDirectory() . '/libs/Bootstraptoggle/bootstrap2-toggle.min.css');
		$tpl->addJavaScript($plugin->getDirectory() . '/libs/Bootstraptoggle/bootstrap2-toggle.min.js');
		$tpl->addJavaScript($plugin->getDirectory() . '/js/jquery.InteractiveVideoQuestionViewer.js');
		$tpl->addJavaScript($plugin->getDirectory() . '/js/InteractiveVideoPlayerComments.js');
		$tpl->addJavaScript($plugin->getDirectory() . '/js/InteractiveVideoPlayerFunctions.js');
		$tpl->addJavaScript($plugin->getDirectory() . '/js/InteractiveVideoPlayerAbstract.js');
		ilTextAreaInputCkeditorGUI::appendJavascriptFile();

		$config_tpl = new ilTemplate("tpl.video_config.html", true, true, $plugin->getDirectory());
		$config_tpl->setVariable('VIDEO_FINISHED_POST_URL', $this->ctrl->getLinkTarget($this, 'postVideoFinishedPerAjax', '', true, false));
		$config_tpl->setVariable('VIDEO_STARTED_POST_URL', $this->ctrl->getLinkTarget($this, 'postVideoStartedPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_GET_URL', $this->ctrl->getLinkTarget($this, 'getQuestionPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_POST_URL', $this->ctrl->getLinkTarget($this, 'postAnswerPerAjax', '', true, false));
		$config_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postComment', '', true, false));
		$config_tpl->setVariable('SEND_BUTTON', $plugin->txt('send'));
		$config_tpl->setVariable('CLOSE_BUTTON', $plugin->txt('close'));
		$config_tpl->setVariable('FEEDBACK_JUMP_TEXT', $plugin->txt('feedback_jump_text'));
		$config_tpl->setVariable('LEARNING_RECOMMENDATION_TEXT', $plugin->txt('learning_recommendation'));
		$config_tpl->setVariable('MORE_INFORMATION_TEXT', $plugin->txt('more_informations'));
		$config_tpl->setVariable('ALREADY_ANSWERED_TEXT', $plugin->txt('already_answered'));
		$config_tpl->setVariable('QUESTION_TEXT', $plugin->txt('question'));
		$config_tpl->setVariable('PRIVATE_TEXT', $plugin->txt('is_private_comment'));
		$config_tpl->setVariable('RESET_TEXT', $plugin->txt('reset'));
		$config_tpl->setVariable('AUTHOR_FILTER', $plugin->txt('author_filter'));
		$config_tpl->setVariable('SWITCH_ON', $plugin->txt('switch_on'));
		$config_tpl->setVariable('SWITCH_OFF', $plugin->txt('switch_off'));
		$config_tpl->setVariable('SAVE', $plugin->txt('save'));
		$config_tpl->setVariable('ADD_COMMENT', $plugin->txt('insert_comment'));
		$config_tpl->setVariable('IS_CHRONOLOGIC_VALUE', $this->object->isChronologic());
		$ck_editor = new ilTemplate("tpl.ckeditor_mathjax.html", true, true, $plugin->getDirectory());
		$mathJaxSetting = new ilSetting('MathJax');
		if($mathJaxSetting->get('enable'))
		{
			
			$tpl->addJavaScript($mathJaxSetting->get('path_to_mathjax'));
			$ck_editor->setVariable('MATH_JAX_CONFIG', $mathJaxSetting->get('path_to_mathjax'));
		}
		$ck_editor->touchBlock('small_editor');
		$config_tpl->setVariable('CK_CONFIG', $ck_editor->get());

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

		$stop_points = $this->objComment->getStopPoints();
		$comments = $this->objComment->getContentComments();

		if($edit_screen)
		{
			$config_tpl->setVariable('STOP_POINTS', json_encode(array()));
			$config_tpl->setVariable('COMMENTS', json_encode(array()));
			$config_tpl->setVariable('USER_IMAGES_CACHE', json_encode(array()));
		}
		else
		{
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

		$this->object->update();

		parent::updateCustom($a_form);
	}

	/**
	 * @param string $type
	 * @return array
	 */
	protected function initCreationForms($type)
	{
		if(ilInteractiveVideoPlugin::getInstance()->isCoreMin52())
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
		$this->appendCkEditorMathJaxSupportToForm($a_form);
		$online = new ilCheckboxInputGUI($this->lng->txt('online'), 'is_online');
		$a_form->addItem($online);
		$this->appendDefaultFormOptions($a_form);

	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function appendCkEditorMathJaxSupportToForm(ilPropertyFormGUI $a_form)
	{
		/**
		 * @var $tpl ilTemplate
		 */
		global $tpl;
		$ck_editor = new ilTemplate("tpl.ckeditor_mathjax.html", true, true, $this->plugin->getDirectory());
		$mathJaxSetting = new ilSetting('MathJax');
		if($mathJaxSetting->get('enable'))
		{
			$tpl->addJavaScript($mathJaxSetting->get('path_to_mathjax'));
			$ck_editor->setVariable('MATH_JAX_CONFIG', $mathJaxSetting->get('path_to_mathjax'));
		}
		$custom = new ilCustomInputGUI();
		$custom->setHtml($ck_editor->get());
		$a_form->addItem($custom);
	}


	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function appendDefaultFormOptions(ilPropertyFormGUI $a_form)
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$description_switch = new ilCheckboxInputGUI($plugin->txt('task_switch'),'is_task');
		$description_switch->setInfo($plugin->txt('task_switch_info'));
		$description = xvidUtils::constructTextAreaFormElement('task', 'task');
		$description_switch->addSubItem($description);
		$a_form->addItem($description_switch);

		$anonymized = new ilCheckboxInputGUI($plugin->txt('is_anonymized'), 'is_anonymized');
		$anonymized->setInfo($plugin->txt('is_anonymized_info'));
		$a_form->addItem($anonymized);

		$is_public = new ilCheckboxInputGUI($plugin->txt('is_public'), 'is_public');
		$is_public->setInfo($plugin->txt('is_public_info'));
		$a_form->addItem($is_public);

		$repeat = new ilCheckboxInputGUI($plugin->txt('is_repeat'), 'is_repeat');
		$repeat->setInfo($plugin->txt('is_repeat_info'));
		$a_form->addItem($repeat);

		$chrono = new ilCheckboxInputGUI($plugin->txt('is_chronologic'), 'is_chronologic');
		$chrono->setInfo($plugin->txt('is_chronologic_info'));
		$a_form->addItem($chrono);

		$no_comment = new ilCheckboxInputGUI($plugin->txt('no_comment'), 'no_comment');
		$no_comment->setInfo($plugin->txt('no_comment_info'));
		$a_form->addItem($no_comment);
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
		$a_values["no_comment"]			= $this->object->getDisableComment();
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
		$plugin = ilInteractiveVideoPlugin::getInstance();

		try
		{
			parent::saveObject();
		}
		catch(Exception $e)
		{
			if(
				$plugin->txt($e->getMessage()) != '-' . $e->getMessage() . '-' &&
				$plugin->txt($e->getMessage()) != '-rep_robj_xvid_' . $e->getMessage() . '-'
			)
			{
				ilUtil::sendFailure($plugin->txt($e->getMessage()), true);
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
		$plugin = ilInteractiveVideoPlugin::getInstance();
		$factory = new ilInteractiveVideoSourceFactory();
		$sources = $factory->getVideoSources();
		
		$item_group = new ilRadioGroupInputGUI($plugin->txt('source'), 'source_id');
		$a_form->addItem($item_group);
		$non_active = true;
		foreach($sources as $key => $source)
		{
			/** @var ilInteractiveVideoSourceGUI $gui */
			if($factory->isActive($source->getClass()))
			{
				$op = new ilRadioOption($plugin->txt($source->getId()), $source->getId());
				$gui= $source->getGUIClass();
				$gui->getForm($op, $this->obj_id);
				$item_group->addOption($op);
				$non_active = false;
			}
		}

		$item_group->setValue($factory->getDefaultVideoSource());

		if($non_active)
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('at_least_one_source'));
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
			$ilTabs->addTab('editComments', ilInteractiveVideoPlugin::getInstance()->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editComments'));
		}
		else if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', ilInteractiveVideoPlugin::getInstance()->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editMyComments'));
		}

		require_once 'Services/Tracking/classes/class.ilLearningProgressAccess.php';
		if(ilLearningProgressAccess::checkAccess($this->object->getRefId(), true))
		{
			if($this->checkPermissionBool('write') || $this->checkPermissionBool('read_learning_progress'))
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
			if(ilInteractiveVideoPlugin::getInstance()->isCoreMin52())
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
		$plugin = ilInteractiveVideoPlugin::getInstance();

		switch($a_tab)
		{
			case 'editComments':
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('editComments', $plugin->txt('questions_comments_sub_tab'),$this->ctrl->getLinkTarget($this,'editComments'));
				}
				$ilTabs->addSubTab('editMyComments', $plugin->txt('my_comments'),$this->ctrl->getLinkTarget($this,'editMyComments'));
				$ilTabs->addSubTab('showMyResults', $plugin->txt('show_my_results'), $this->ctrl->getLinkTarget($this, 'showMyResults'));
				
				if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
				{
					$ilTabs->addSubTab('showResults', $plugin->txt('user_results'), $this->ctrl->getLinkTarget($this, 'showResults'));
					$ilTabs->addSubTab('showQuestionsResults', $plugin->txt('question_results'), $this->ctrl->getLinkTarget($this, 'showQuestionsResults'));
					$ilTabs->addSubTab('showCompleteOverviewOverAllResults', $plugin->txt('complete_question_results'), $this->ctrl->getLinkTarget($this, 'showCompleteOverviewOverAllResults'));
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
	 * Public wrapper for permission assumption
	 * @param string[] $permissions
	 * @return bool
	 */
	public function ensureAtLeastOnePermission(array $permissions)
	{
		foreach ($permissions as $permission) {
			if($this->checkPermissionBool($permission)) {
				return true;
			}
		}
		// Since all $permissions returned false, this checkPermission() will lead to general behaviour of redirecting and sending failure
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
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('missing_comment_text'));
			$this->showContent();
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('missing_stopping_point'));
			$this->showContent();
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

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteComment'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editComments');

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
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
			ilUtil::sendSuccess(ilInteractiveVideoPlugin::getInstance()->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
		}
		$this->editComments();
	}

	/**
	 * @return ilPropertyFormGUI
	 */
	private function initCommentForm()
	{
		/**
		 * $ilUser ilObjUser
		 */
		global $ilUser;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
		$form->setTitle($plugin->txt('insert_comment'));
		$this->appendCkEditorMathJaxSupportToForm($form);
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('general'));
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

		$time_end = new ilInteractiveVideoTimePicker($plugin->txt('time_end'), 'comment_time_end');
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
			$is_private = new ilCheckboxInputGUI($plugin->txt('is_private_comment'), 'is_private');
			$form->addItem($is_private);
		}

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('comment'));
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

		$mathJaxSetting = new ilSetting('MathJax');
		if($mathJaxSetting->get('enable'))
		{
			$tpl->addJavaScript($mathJaxSetting->get('path_to_mathjax'));
		}
		$tbl_data = $this->object->getCommentsTableDataByUserId();
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilInteractiveVideoCommentsTableGUI.php');
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
			return $this->editMyComment($form);
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

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteMyComment'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteMyComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editMyComments');

		$post_ids = $_POST['comment_id'];

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(count($wrong_comment_ids) == 0)
		{
			foreach($post_ids as $comment_id)
			{
				$confirm->addItem('comment_id[]', $comment_id, $this->object->getCommentTextById($comment_id));
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
		}
	}

	public function deleteMyComment()
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();

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
			ilUtil::sendFailure($plugin->txt('invalid_comment_ids'));
			$this->editMyComments();
		}

		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(count($wrong_comment_ids) == 0)
		{
			$this->object->deleteComments($_POST['comment_id']);
			ilUtil::sendSuccess($plugin->txt('comments_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure($plugin->txt('invalid_comment_ids'));
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
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('missing_comment_text'));
			$this->editComments();
			return;
		}

		if(!isset($_POST['comment_time']) || !strlen(trim(ilUtil::stripSlashes($_POST['comment_time']))))
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('missing_stopping_point'));
			$this->editComments();
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
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		$video_tpl = new ilTemplate("tpl.edit_comment.html", true, true, $plugin->getDirectory());

		$video_tpl->setVariable('SCREEN_INFO', $plugin->txt('screen_info'));

		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$object->addPlayerElements($tpl);

		$video_tpl->setVariable('VIDEO_PLAYER', $object->getPlayer()->get());

		$video_tpl->setVariable('FORM_ACTION', $this->ctrl->getFormAction($this,'showTutorInsertForm'));

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());


		$video_tpl->setVariable('TXT_INS_COMMENT', $plugin->txt('insert_comment'));
		$video_tpl->setVariable('TXT_INS_QUESTION', $plugin->txt('insert_question'));

		require_once("./Services/UIComponent/Modal/classes/class.ilModalGUI.php");
		$modal = ilModalGUI::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_OVERLAY", $modal->getHTML());

		$video_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postTutorComment', '', false, false));

		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig(true));
		global $ilUser;
		$this->object->getLPStatusForUser($ilUser->getId());
		$tbl_data = $this->object->getCommentsTableData(true, true);
		$plugin->includeClass('class.ilInteractiveVideoCommentsTableGUI.php');
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
		$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt('edit_comment'));

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
		$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt('edit_comment'));
		$form->addCommandButton('updateComment', $this->lng->txt('save'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

	/**
	 * @param int $comment_id
	 */
	private function getCommentFormValues($comment_id = 0)
	{		
		if($comment_id == 0)
		{
			if(!isset($_GET['comment_id']) && !isset($_POST['comment_id']))
			{
				ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('no_comment_id_given'), true);
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

		return $values;
	}
#endregion

#region QUESTIONS
	/**
	 * @return ilPropertyFormGUI
	 */
	public function initQuestionForm()
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$form = new ilPropertyFormGUI();
		$form->setFormAction($this->ctrl->getFormAction($this, 'insertQuestion'));
		$form->setTitle($plugin->txt('insert_question'));

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		$title->setInfo($plugin->txt('comment_title_info'));
		$title->setRequired(true);
		$form->addItem($title);
		
		$time = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'comment_time');

		if(isset($_POST['comment_time']))
		{
			$seconds = $_POST['comment_time'];
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);

		$repeat_question = new ilCheckboxInputGUI($plugin->txt('repeat_question'), 'repeat_question');
		$repeat_question->setInfo($plugin->txt('repeat_question_info'));
		$form->addItem($repeat_question);

		$limit_attempts = new ilCheckboxInputGUI($plugin->txt('limit_attempts'), 'limit_attempts');
		$limit_attempts->setInfo($plugin->txt('limit_attempts_info'));
		$form->addItem($limit_attempts);

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('question'));
		$form->addItem($section_header);

		$question_type = new ilSelectInputGUI($plugin->txt('question_type'), 'question_type');
		$type_options = array(0 => $plugin->txt('single_choice'), 1 => $plugin->txt('multiple_choice'), 2 => $plugin->txt('reflection'));
		$question_type->setOptions($type_options);
		$question_type->setInfo($plugin->txt('question_type_info'));
		$form->addItem($question_type);

		$question_text = xvidUtils::constructTextAreaFormElement('question_text', 'question_text');
		$question_text->setRequired(true);
		$form->addItem($question_text);

		$this->appendImageUploadForm($plugin, $form);

		$neutral_type = new ilSelectInputGUI($plugin->txt('neutral_type'), 'neutral_type');
		$neutral_type_options = array(0 => $plugin->txt('with_correct'), 1 => $plugin->txt('neutral'));

		$neutral_type->setOptions($neutral_type_options);
		$neutral_type->setInfo($plugin->txt('neutral_type_info'));
		$form->addItem($neutral_type);
		

		$answer = new ilCustomInputGUI($this->lng->txt('answers'), 'answer_text');
		$answer->setHtml($this->getInteractiveForm());
		$form->addItem($answer);

		//New Section: Feedback

		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('feedback'));
		$form->addItem($section_header);

		// Feedback correct
		$feedback_correct = xvidUtils::constructTextAreaFormElement('feedback_correct', 'feedback_correct');
		$show_correct_icon = new ilCheckboxInputGUI($plugin->txt('show_correct_icon'), 'show_correct_icon');
		$show_correct_icon->setInfo($plugin->txt('show_correct_icon_info'));
		$show_correct_icon->setChecked(true);

		$feedback_correct->addSubItem($show_correct_icon);
		$is_jump_correct = new ilCheckboxInputGUI($plugin->txt('is_jump_correct'), 'is_jump_correct');
		$is_jump_correct->setInfo($plugin->txt('is_jump_correct_info'));

		$jump_correct_ts = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'jump_correct_ts');

		if(isset($_POST['jump_correct_ts']))
		{
			$seconds = $_POST['jump_correct_ts'];
			$time->setValueByArray(array('jump_correct_ts' => (int)$seconds));
		}
		$is_jump_correct->addSubItem($jump_correct_ts);
		$feedback_correct->addSubItem($is_jump_correct);
		$this->appendRepositorySelector($feedback_correct, 'feedback_correct_obj');
		$form->addItem($feedback_correct);

		// Feedback wrong
		$feedback_one_wrong = xvidUtils::constructTextAreaFormElement('feedback_one_wrong', 'feedback_one_wrong');
		$show_wrong_icon = new ilCheckboxInputGUI($plugin->txt('show_wrong_icon'), 'show_wrong_icon');
		$show_wrong_icon->setInfo($plugin->txt('show_wrong_icon_info'));
		$show_wrong_icon->setChecked(true);

		$feedback_one_wrong->addSubItem($show_wrong_icon);

		$is_jump_wrong = new ilCheckboxInputGUI($plugin->txt('is_jump_wrong'), 'is_jump_wrong');
		$is_jump_wrong->setInfo($plugin->txt('is_jump_wrong_info'));
		$jump_wrong_ts = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'jump_wrong_ts');

		if(isset($_POST['jump_wrong_ts']))
		{
			$seconds = $_POST['jump_wrong_ts'];
			$time->setValueByArray(array('jump_correct_ts' => (int)$seconds));
		}
		$is_jump_wrong->addSubItem($jump_wrong_ts);
		$feedback_one_wrong->addSubItem($is_jump_wrong);
		$this->appendRepositorySelector($feedback_one_wrong, 'feedback_wrong_obj');
		$form->addItem($feedback_one_wrong);

		$show_response_frequency = new ilCheckboxInputGUI($plugin->txt('show_response_frequency'), 'show_response_frequency');
		$show_response_frequency->setInfo($plugin->txt('show_response_frequency_info'));
		$form->addItem($show_response_frequency);

		$show_comment_field = new ilCheckboxInputGUI($plugin->txt('show_comment_field'), 'show_comment_field');
		$show_comment_field->setInfo($plugin->txt('show_comment_field_info'));
		$form->addItem($show_comment_field);

		$is_interactive = new ilHiddenInputGUI('is_interactive');
		$is_interactive->setValue(1);
		$form->addItem($is_interactive);

		$comment_text = new ilHiddenInputGUI('comment_text');
		$comment_text->setValue('dummy text');
		$form->addItem($comment_text);

		$comment_id = new ilHiddenInputGUI('comment_id');
		$form->addItem($comment_id);

		$modal = ilModalGUI::getInstance();
		$modal->setId('simple_question_warning');
		$modal->setType(ilModalGUI::TYPE_MEDIUM);
		$modal->setHeading($plugin->txt('save_without_correct'));
		$warning_dialog = new ilTemplate("tpl.question_edit_modal.html", true, true, ilInteractiveVideoPlugin::getInstance()->getDirectory());
		$warning_dialog->setVariable('INFO_TEXT', $plugin->txt('save_without_correct_detail') );
		$warning_dialog->setVariable('SAVE_ANYWAY', $plugin->txt('save_anyway') );
		$warning_dialog->setVariable('CANCEL', $plugin->txt('CANCEL') );
		$modal->setBody($warning_dialog->get());
		$mod = new ilCustomInputGUI('', '');
		$mod->setHtml($modal->getHTML());
		$form->addItem($mod);


		return $form;
	}

	/**
	 * @param ilPropertyFormGUI $form
	 * @param $post_var
	 */
	protected function appendRepositorySelector($form, $post_var)
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();
		require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
		$plugin->includeClass('Form/class.ilInteractiveVideoSelectionExplorerGUI.php');
		$this->ctrl->setParameterByClass('ilformpropertydispatchgui', 'postvar', $post_var);
		$explorer_gui = new ilInteractiveVideoSelectionExplorerGUI(
			array('ilpropertyformgui', 'ilformpropertydispatchgui', 'ilInteractiveVideoRepositorySelectorInputGUI'),
			'handleExplorerCommand'
		);
		$explorer_gui->setId($post_var);

		$plugin->includeClass('Form/class.ilInteractiveVideoRepositorySelectorInputGUI.php');
		$root_ref_id = new ilInteractiveVideoRepositorySelectorInputGUI(
			$plugin->txt($post_var),
			$post_var, $explorer_gui, false
		);

		$root_ref_id->setInfo($plugin->txt($post_var . '_info'));
		$form->addSubItem($root_ref_id);
	}

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
			$form = $this->initQuestionForm();
			$this->appendCkEditorMathJaxSupportToForm($form);
		}

		$form->addCommandButton('insertQuestion', $this->lng->txt('insert'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}


	public function insertQuestion()
	{
		$form = $this->initQuestionForm();

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
			$form = $this->initQuestionForm();
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
				ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('no_comment_id_given'), true);
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
			require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
			$confirm = new ilConfirmationGUI();
			$confirm->setFormAction($this->ctrl->getFormAction($this, 'updateQuestion'));
			$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_update_question'));

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
		$form = $this->initQuestionForm();
		if(isset($_POST['form_values']))
		{
			//@todo .... very quick ... very wtf .... 
			$_POST = unserialize($_POST['form_values']);
			$_FILES = unserialize($_REQUEST['form_files']);
		}

		if($form->checkInput())
		{
			$comment_id = $form->getInput('comment_id');
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
		$question->setIsJumpCorrect((int)$form->getInput('is_jump_correct'));
		$question->setShowCorrectIcon((int)$form->getInput('show_correct_icon'));
		$question->setFeedbackCorrectId((int)$form->getInput('feedback_correct_obj'));
		$question->setFeedbackWrongId((int)$form->getInput('feedback_wrong_obj'));
		
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
		$question = new ilTemplate("tpl.simple_questions.html", true, true, ilInteractiveVideoPlugin::getInstance()->getDirectory());
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
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionsTableGUI.php');
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
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionsUserTableGUI.php');
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
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionsCompleteUserTableGUI.php');
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

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteUserResults'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteUserResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showResults');

		$user_ids = $_POST['user_id'];

		foreach($user_ids as $user_id)
		{
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
			ilUtil::sendSuccess(ilInteractiveVideoPlugin::getInstance()->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('invalid_user_ids'));
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
		ilInteractiveVideoPlugin::getInstance()->includeClass('class.SimpleChoiceQuestionsOverviewTableGUI.php');
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

		require_once 'Services/Utilities/classes/class.ilConfirmationGUI.php';
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteQuestionsResults'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteQuestionsResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showQuestionsResults');

		$question_ids = $_POST['question_id'];

		foreach($question_ids as $question_id)
		{
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
			ilUtil::sendSuccess(ilInteractiveVideoPlugin::getInstance()->txt('results_successfully_deleted'));
		}
		else
		{
			ilUtil::sendFailure(ilInteractiveVideoPlugin::getInstance()->txt('invalid_question_ids'));
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
		$tpl_json      = ilInteractiveVideoPlugin::getInstance()->getTemplate('default/tpl.show_question.html', false, false);
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
		$tpl_json = ilInteractiveVideoPlugin::getInstance()->getTemplate('default/tpl.show_question.html', false, false);

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
		$tpl_json = ilInteractiveVideoPlugin::getInstance()->getTemplate('default/tpl.show_question.html', false, false);
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
		$feedback      = $ajax_object->getFeedbackForQuestion($_POST['qid']);
		$tpl_json->setVariable('JSON', $feedback);
		$tpl_json->show("DEFAULT", false, true );
	}

	public function postVideoStartedPerAjax()
	{
		global $ilUser;
		$this->object->saveVideoStarted($this->obj_id, $ilUser->getId());
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
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$simple = new SimpleChoiceQuestionStatistics();
		$data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);

		$csv = array();
		$separator = ";";

		$head_row = array();
		array_push($head_row, $lng->txt('name'));
		foreach ($data['question'] as $key => $row)
		{
			array_push($head_row, trim($row, '"'));
			array_push($head_row, trim($row, '"') . ' ' .$plugin->txt('answers') );
		}
		array_push($head_row, $plugin->txt('answered') );
		array_push($head_row, $plugin->txt('sum'));
		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		$ignore_colum = array('name','answerd', 'sum');
		foreach ($data['users'] as $key => $row)
		{
			$csvrow = array();
			foreach ( $row as $type => $value)
			{
				array_push($csvrow, trim($value, '"'));
				if(isset($data['answers'][$key][$type]))
				{
					array_push($csvrow, trim($data['answers'][$key][$type], '"'));
				}
				else if(!in_array($type, $ignore_colum))
				{
					array_push($csvrow, '');
				}
			}
			array_push($csv, ilUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
	}
	
	public function exportMyComments()
	{
		global $lng;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$data = $this->object->getCommentsTableDataByUserId();

		$csv = array();
		$separator = ";";

		$head_row = array();
		array_push($head_row, $lng->txt('id'));
		array_push($head_row, $lng->txt('time'));
		array_push($head_row, $plugin->txt('time_end') );
		array_push($head_row, $plugin->txt('comment_title'));
		array_push($head_row, $plugin->txt('comment'));
		array_push($head_row, $plugin->txt('visibility'));
		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		foreach ($data as $key => $row)
		{
			$csvrow = array();
			foreach ( $row as $type => $value)
			{
				array_push($csvrow, trim($value, '"'));
			}
			array_push($csv, ilUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
	}

	public function exportAllComments()
	{
		global $lng;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$data = $this->object->getCommentsTableData(true);

		$csv = array();
		$separator = ";";

		$head_row = array();

		array_push($head_row, $lng->txt('id'));
		array_push($head_row, $lng->txt('time'));
		array_push($head_row, $plugin->txt('time_end') );
		array_push($head_row, $plugin->txt('user_id') );
		array_push($head_row, $plugin->txt('comment_title'));
		array_push($head_row, $plugin->txt('comment'));
		array_push($head_row, $plugin->txt('tutor'));
		array_push($head_row, $plugin->txt('interactive'));

		array_push($csv, ilUtil::processCSVRow($head_row, TRUE, $separator) );
		foreach ($data as $key => $row)
		{
			$csvrow = array();
			foreach ( $row as $type => $value)
			{
				array_push($csvrow, trim($value, '"'));
			}
			array_push($csv, ilUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($row, $separator) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
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
