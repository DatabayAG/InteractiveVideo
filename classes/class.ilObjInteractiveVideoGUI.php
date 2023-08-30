<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

use ILIAS\HTTP\Services;

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
	/** @var ilCtrl */
    protected ilCtrl $ctrl;

	/** @var \ilObjInteractiveVideo|null $object */
				protected ?ilObject $object = null;

	/** @var $objComment ilObjComment */
	public $objComment;

	/** @var \ilPlugin|null */
    protected ?ilPlugin $plugin = null;

    protected Services $http;

    public function __construct(
        int $a_ref_id = 0,
        int $a_id_type = self::REPOSITORY_NODE_ID,
        int $a_parent_node_id = 0
    ) {
        /** @var \ILIAS\DI\Container $DIC */
        global $DIC;
        $this->http = $DIC->http();

        parent::__construct($a_ref_id, $a_id_type, $a_parent_node_id);
    }
	protected function appendImageUploadForm(\ilInteractiveVideoPlugin $plugin, \ilPropertyFormGUI $form): void
	{
		$image_upload  = new ilInteractiveVideoPreviewPicker($plugin->txt('question_image'), 'question_image');

        $post = $this->http->wrapper()->post();
        $get = $this->http->wrapper()->query();
        if($post->has('comment_id') || $get->has('comment_id')) {
            $comment_id = $post->retrieve('comment_id', $this->refinery->kindlyTo()->int());
            if($comment_id === 0) {
                $comment_id = $get->retrieve('comment_id', $this->refinery->kindlyTo()->int());
            }
        }


        if($comment_id > 0)
		{
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
    public function getType(): string
	{
		return 'xvid';
	}

	/**
	 * Cmd that will be redirected to after creation of a new object.
	 */
    public function getAfterCreationCmd(): string
	{
		return 'editProperties';
	}

	/**
	 * @return string
	 */
    public function getStandardCmd(): string
	{
		return 'showContent';
	}

	/**
	 * @param string $cmd
	 * @throws ilException
	 */
    public function performCommand(string $cmd): void
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
				$lp_gui = new ilInteractiveVideoLearningProgressGUI($this, $this->object);
				$this->ctrl->forwardCommand($lp_gui);
				break;

			case 'ilpublicuserprofilegui':
				$profile_gui = new ilPublicUserProfileGUI((int)$_GET['user']);
				$profile_gui->setBackUrl($this->ctrl->getLinkTarget($this, 'showContent'));
				$this->tpl->setContent($this->ctrl->forwardCommand($profile_gui));
				break;

			case 'ilcommonactiondispatchergui':
				$gui = ilCommonActionDispatcherGUI::getInstanceFromAjaxCall();
				$this->ctrl->forwardCommand($gui);
				break;
			case "ilinteractivevideoexportgui":
				$this->checkPermission('write');
				$ilTabs->setTabActive('export');
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
					case 'addSubtitle':
					case 'postAddSubtitle':
					case 'confirmDeleteComment':
					case 'confirmRemoveSubtitle':
					case 'deleteComment':
					case 'editComments':
				    case 'editQuestion':
					case 'confirmUpdateQuestion':
				    case 'insertQuestion':
                    case 'completeCsvExport':
                    case 'removeSubtitle ':
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
					case 'insertTutorCommentAjax':
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
						    $class = ilInteractiveVideoPlugin::stripSlashesWrapping($_GET['xvid_plugin_ctrl']);
						    $dir = ltrim($class,'il');
                            $dir = rtrim($dir,'GUI');
						    $path = 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/VideoSources/plugin/' . $dir . '/class.' . $class . '.php';
                            if(file_exists($path)){
                                global $DIC;
						        $class = new $class($DIC);
                                if(method_exists($class, $cmd))
                                {
                                    $class->{$cmd}();
                                }
                            }
                             else {
                                throw new ilException(sprintf("Unsupported plugin command %s ind %s", $cmd, __METHOD__));
                            }
						}
						break;
				}
				break;
		}

		$this->addHeaderAction();
	}

	/**
	 * @throws ilTemplateException
	 */
	public function showContent(): void
	{
		global $tpl, $ilTabs;
		$ilTabs->activateTab('content');

		$video_tpl = $this->buildContentTemplate();

		$tpl->setContent($video_tpl->get());
	}

    /**
	 * @throws ilTemplateException
	 */
	public function getContentAsString(bool $light_version = false): string
	{
		$video_tpl = $this->buildContentTemplate($light_version);
		return $video_tpl->get();
	}

    /**
	 * @throws ilTemplateException
	 */
	protected function buildContentTemplate(bool $light_version = false): \ilTemplate
	{
		/**
		 * @var $tpl    ilTemplate
		 */
		global $tpl, $DIC;
		$plugin = ilInteractiveVideoPlugin::getInstance();
        $DIC->ui()->mainTemplate()->addJavaScript($this->plugin->getDirectory() . '/js/InteractiveVideoQuestionCreator.js');
        if($this->object->isMarkerActive()){
            $DIC->ui()->mainTemplate()->addJavaScript($this->plugin->getDirectory() . '/js/InteractiveVideoOverlayMarker.js');
            $DIC->ui()->mainTemplate()->addOnLoadCode('il.InteractiveVideoOverlayMarker.checkForEditScreen();');
        }
		$player_id = ilInteractiveVideoUniqueIds::getInstance()->getNewId();
		$video_tpl = new ilTemplate("tpl.video_tpl.html", true, true, $plugin->getDirectory());

		$object = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$object->addPlayerElements($tpl);

		if($this->object->getTaskActive())
		{
			$video_tpl->setCurrentBlock('task_description');
			$video_tpl->setVariable('TASK_TEXT',$plugin->txt('task'));
			$video_tpl->setVariable('TASK_DESCRIPTION', $this->object->getTask());
			$video_tpl->setVariable('PLAYER_ID', $player_id);
			$video_tpl->parseCurrentBlock();
		}

		$this->addBackButtonIfParameterExists($video_tpl);

		$video_tpl->setVariable('VIDEO_PLAYER', $object->getPlayer($player_id)->get());
		if( ! $light_version) {
            $video_tpl->setVariable('IV_BOOTSTRAP_CLASS_IF_NOT_LIGHT_VERSION', 'col-sm-6 col-md-6 col-lg-6');
        }
		$form = new ilPropertyFormGUI();
		$ckeditor = new ilTextAreaInputCkeditorGUI('comment_text', 'comment_text');
		$form->addItem($ckeditor);
		$video_tpl->setVariable('COMMENT_TEXT', $form->getHTML());
		$video_tpl->setVariable('PLAYER_ID', $player_id);
		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());
		$this->objComment->setIsPublic($this->object->isPublic());
		$this->objComment->setIsAnonymized($this->object->isAnonymized());
		$this->objComment->setIsRepeat($this->object->isRepeat());
		$modal = ilInteractiveVideoModalExtension::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setType(ilModalGUI::TYPE_LARGE);
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_QUESTION_OVERLAY", $modal->getHTML());

        if($this->object->getEnableCommentStream() !== "0"){
            $video_tpl->setVariable('TXT_COMMENTS', $plugin->txt('comments'));
        }
        if($this->object->doesTocCommentExists()){
            $video_tpl->setVariable('TXT_TOC', $plugin->txt('toc'));
        }

		if($light_version) {
            $video_tpl->setVariable('LIGHT_VERSION', 'iv_light_version');
        }
		if($this->object->getEnableToolbar() == "1"){
			$video_tpl->setVariable('SHOW_ALL_COMMENTS', $plugin->txt('show_all_comments'));
			$video_tpl->setVariable('AUTHOR_FILTER', $plugin->txt('author_filter'));
			$video_tpl->setVariable('LAYOUT_FILTER', $plugin->txt('layout_filter'));
		}

		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig($player_id, $this->object->getSourceId(), false));

		if($this->object->getEnableComment() == 1 && ! $light_version)
		{
            if(!$this->checkPermissionBool('write'))
            {
                $comments_tpl = new ilTemplate("tpl.comments_form.html", true, true, $this->plugin->getDirectory());
                $comments_tpl->setVariable('PLAYER_ID', $player_id);
                $comments_tpl->setVariable('COMMENT_TIME_END', $this->plugin->txt('time_end'));
                $picker = new ilInteractiveVideoTimePicker('comment_time_end', 'comment_time_end_' . $player_id);
                $comments_tpl->setVariable('COMMENT_TIME_END_PICKER', $picker->render());
                if($this->object->isMarkerActive()) {
                    $comments_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment'));
                } else {
                    $comments_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment_only'));
                }
                $comments_tpl->setVariable('TXT_ENDTIME_WARNING', $this->plugin->txt('endtime_warning'));
                $comments_tpl->setVariable('TXT_NO_TEXT_WARNING', $this->plugin->txt('no_text_warning'));
                $comments_tpl->setVariable('TXT_IS_PRIVATE', $this->plugin->txt('is_private_comment'));
                $marker_template = '';
                if( $this->object->isMarkerActive() &&
                    $this->object->getMarkerForStudents() == 1 || $DIC->access()->checkAccess('write', '', $this->object->getRefId()))
                {
                    $marker_template = $this->buildMarkerEditorTemplate()->get();
                }
                $comments_tpl->setVariable('MARKER_EDITOR', $marker_template);
                $comments_tpl->setVariable('TXT_POST', $this->lng->txt('save'));
                $comments_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));
                $video_tpl->setVariable("COMMENTS_FORM", $comments_tpl->get());
            }
            else if($this->checkPermissionBool('write'))
            {
                $comments_tpl = new ilTemplate("tpl.comments_form.html", true, true, $this->plugin->getDirectory());
                $comments_tpl->setVariable('PLAYER_ID', $player_id);
                $comments_tpl->setVariable('COMMENT_TIME_END', $this->plugin->txt('time_end'));
                $picker = new ilInteractiveVideoTimePicker('comment_time_end', 'comment_time_end_' . $player_id);
                $comments_tpl->setVariable('COMMENT_TIME_END_PICKER', $picker->render());

                if($this->object->isMarkerActive()) {
                    $comments_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment'));
                } else {
                    $comments_tpl->setVariable('TXT_COMMENT', $this->plugin->txt('insert_comment_only'));
                }
                $comments_tpl->setVariable('TXT_ENDTIME_WARNING', $this->plugin->txt('endtime_warning'));
                $comments_tpl->setVariable('TXT_NO_TEXT_WARNING', $this->plugin->txt('no_text_warning'));
                $comments_tpl->setVariable('TXT_IS_PRIVATE', $this->plugin->txt('is_private_comment'));
                $marker_template = '';
                if( $this->object->isMarkerActive() ){
                    $marker_template = $this->buildMarkerEditorTemplate()->get();
                }

                $comments_tpl->setVariable('MARKER_EDITOR', $marker_template);
                $comments_tpl->setVariable('TXT_POST', $this->lng->txt('save'));
                $comments_tpl->setVariable('TXT_CANCEL', $this->plugin->txt('cancel'));
                $video_tpl->setVariable("COMMENTS_FORM", $comments_tpl->get());
            }
		}

        $this->appendQuestionModalToTemplate($video_tpl);
		return $video_tpl;
	}

    protected function appendQuestionModalToTemplate(\ilTemplate $video_tpl): void
    {
        $modal = ilInteractiveVideoModalExtension::getInstance();
        $modal->setId("ilQuestionModal");
        $modal->setType(ilInteractiveVideoModalExtension::TYPE_XL);
        $video_tpl->setVariable("MODAL_QUESTION_OVERLAY", $modal->getHTML());
        $modal = ilInteractiveVideoModalExtension::getInstance();
        $modal->setId("ilInteractiveVideoAjaxModal");
        $modal->setType(ilInteractiveVideoModalExtension::TYPE_XL);
        $video_tpl->setVariable("MODAL_INTERACTION_OVERLAY", $modal->getHTML());
    }

    protected function buildMarkerEditorTemplate(): \ilTemplate
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
        $marker_tpl->setVariable('TXT_ADD_MARKER_INFO', $this->plugin->txt('insert_marker_info'));
        $marker_tpl->setVariable('TXT_DELETE', $this->plugin->txt('delete_marker'));
        $marker_tpl->setVariable('TXT_TEXT', $this->plugin->txt('text'));
        $marker_tpl->setVariable('TXT_FONT_SIZE', $this->plugin->txt('font_size'));
        return $marker_tpl;
    }

	/**
	 * @param $video_tpl ilTemplate
	 */
	protected function addBackButtonIfParameterExists($video_tpl): void
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
	 * @throws ilTemplateException
	 */
	public function getInteractiveForm(): string
	{
		/**
		 * $tpl ilTemplate
		 */
		global $tpl, $DIC;
		$plugin = ilInteractiveVideoPlugin::getInstance();

        $DIC->ui()->mainTemplate()->addJavaScript($plugin->getDirectory() . '/js/InteractiveVideoQuestionCreator.js');
        $DIC->ui()->mainTemplate()->addCss($plugin->getDirectory() . '/templates/default/xvid.css');
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
			$question->setVariable('JSON', $ajax_object->getAnswersForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
			$question->setVariable('QUESTION_TEXT', $simple_choice->getQuestionTextQuestionId($question_id));
		}
		else
		{
            $answers = [];
			$answers_array = [];
			$answers_correct = [];
            $post = $this->http->wrapper()->post();
            if($post->has('answer'))
            {
                $answers_array = $post->retrieve('answer', $this->refinery->kindlyTo()->listOf($this->refinery->kindlyTo()->string()));
            }
            if($post->has('correct'))
            {
                $answers_correct = $post->retrieve('correct', $this->refinery->kindlyTo()->listOf($this->refinery->kindlyTo()->int()));
            }
			if(sizeof($answers_array) > 0)
			{
				foreach($answers_array as $key => $value)
				{
					$correct = 0;
					if(array_key_exists($key, $answers_correct))
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
     * @var array
     */
    protected $custom_css = [
        '/templates/default/xvid.css',
        '/libs/npm/node_modules/plyr/dist/plyr.css',
        '/libs/Bootstraptoggle/bootstrap2-toggle.min.css',
        '/libs/npm/node_modules/bootstrap-timepicker/css/bootstrap-timepicker.min.css'
    ];

    /**
     * @var array
     */
    protected $custom_javascript = [
         		'/libs/Bootstraptoggle/bootstrap2-toggle.min.js',
		        '/libs/npm/node_modules/plyr/dist/plyr.min.js',
		        '/libs/npm/node_modules/svg.js/dist/svg.min.js',
		        '/libs/npm/node_modules/svg.draggable.js/dist/svg.draggable.min.js',
		        '/libs/npm/node_modules/bootstrap-timepicker/js/bootstrap-timepicker.min.js',
		        '/js/InteractiveVideoQuestionViewer.js',
		        '/js/InteractiveVideoPlayerComments.js',
		        '/js/InteractiveVideoPlayerFunctions.js',
		        '/js/InteractiveVideoPlayerAbstract.js',
		        '/js/InteractiveVideoPlayerResume.js',
		        '/js/InteractiveVideoSubtitle.js',
		        '/js/InteractiveVideoOverlayMarker.js',
		        '/js/InteractiveVideoModalHelper.js'
    ];

    protected function addJavascriptAndCSSToTemplate($tpl): void
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
	 * @param      $player_id
	 * @param      $video_type
	 * @throws ilTemplateException
	 */
	protected function initPlayerConfig($player_id, $video_type, bool $edit_screen = false): string
	{
		/**
		 * $ilUser ilObjUser
		 * $tpl ilTemplate
		 */
		global $ilUser, $tpl, $DIC;

		$plugin = ilInteractiveVideoPlugin::getInstance();
		$this->addJavascriptAndCSSToTemplate($DIC->ui()->mainTemplate());
		ilTextAreaInputCkeditorGUI::appendJavascriptFile();

		$config_tpl = new ilTemplate("tpl.video_config.html", true, true, $plugin->getDirectory());
		$config_tpl->setVariable('PLAYER_ID', $player_id);
		$org_ref_id = (int) $_GET['ref_id'];
		$this->ctrl->setParameterByClass('ilObjInteractiveVideoGUI', 'ref_id', $this->ref_id);
		$config_tpl->setVariable('PLAYER_TYPE', $video_type);
		$config_tpl->setVariable('VIDEO_FINISHED_POST_URL', $this->ctrl->getLinkTargetByClass(array('ilRepositoryGUI', 'ilObjInteractiveVideoGUI'), 'postVideoFinishedPerAjax', '', true, false));
		$config_tpl->setVariable('VIDEO_STARTED_POST_URL', $this->ctrl->getLinkTargetByClass(array('ilRepositoryGUI', 'ilObjInteractiveVideoGUI'), 'postVideoStartedPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_GET_URL', $this->ctrl->getLinkTargetByClass(array('ilRepositoryGUI', 'ilObjInteractiveVideoGUI'), 'getQuestionPerAjax', '', true, false));
		$config_tpl->setVariable('QUESTION_POST_URL', $this->ctrl->getLinkTargetByClass(array('ilRepositoryGUI', 'ilObjInteractiveVideoGUI'), 'postAnswerPerAjax', '', true, false));
		$config_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTargetByClass(array('ilRepositoryGUI', 'ilObjInteractiveVideoGUI'), 'postComment', '', true, false));
        $config_tpl->setVariable('GET_COMMENT_MARKER_MODAL', $this->ctrl->getLinkTarget($this, 'getCommentAndMarkerForm', '', true, false));
        $config_tpl->setVariable('GET_CHAPTER_MODAL', $this->ctrl->getLinkTarget($this, 'getChapterForm', '', true, false));
        $config_tpl->setVariable('GET_QUESTION_CREATION_MODAL', $this->ctrl->getLinkTarget($this, 'showTutorInsertQuestionFormAjax', '', true, false));
        $this->ctrl->setParameterByClass('ilObjInteractiveVideoGUI', 'ref_id', $org_ref_id);
		$config_tpl->setVariable('SEND_BUTTON', $plugin->txt('send'));
		$config_tpl->setVariable('CLOSE_BUTTON', $plugin->txt('close'));
		$config_tpl->setVariable('FEEDBACK_JUMP_TEXT', $plugin->txt('feedback_jump_text'));
		$config_tpl->setVariable('LEARNING_RECOMMENDATION_TEXT', $plugin->txt('learning_recommendation'));
		$config_tpl->setVariable('MORE_INFORMATION_TEXT', $plugin->txt('more_informations'));
		$config_tpl->setVariable('SOLUTION_TEXT', $plugin->txt('solution'));
		$config_tpl->setVariable('REPEAT_TEXT', $plugin->txt('repeat'));
		$config_tpl->setVariable('ALREADY_ANSWERED_TEXT', $plugin->txt('already_answered'));
		$config_tpl->setVariable('COMPULSORY', $plugin->txt('compulsory_question'));
		$config_tpl->setVariable('QUESTION_TEXT', $plugin->txt('question'));
		$config_tpl->setVariable('PRIVATE_TEXT', $plugin->txt('is_private_comment'));
		$config_tpl->setVariable('RESET_TEXT', $plugin->txt('reset'));
		$config_tpl->setVariable('AUTHOR_FILTER', $plugin->txt('author_filter'));
		$config_tpl->setVariable('LAYOUT_FILTER', $plugin->txt('layout_filter'));
		$config_tpl->setVariable('SWITCH_ON', $plugin->txt('switch_on'));
		$config_tpl->setVariable('SWITCH_OFF', $plugin->txt('switch_off'));
		$config_tpl->setVariable('SAVE', $plugin->txt('save'));
		$config_tpl->setVariable('ADD_COMMENT', $plugin->txt('insert_comment'));
        if($this->object->isMarkerActive()) {
            $config_tpl->setVariable('ADD_COMMENT', $plugin->txt('insert_comment'));
        } else {
            $config_tpl->setVariable('ADD_COMMENT', $plugin->txt('insert_comment_only'));
        }
		$config_tpl->setVariable('SHOW_BEST_SOLUTION', $plugin->txt('show_best_solution'));
		$config_tpl->setVariable('AT_LEAST_ONE_ANSWER', $plugin->txt('at_least_one_answer'));
        $config_tpl->setVariable('REPLY_TO_TEXT',  $plugin->txt('reply_to'));
        $config_tpl->setVariable('JUMP_TO_TIME',  $plugin->txt('jump_to_timestamp'));
        $config_tpl->setVariable('SIMILAR_SIZE',  $plugin->txt('similarSize'));
        $config_tpl->setVariable('BIG_VIDEO',  $plugin->txt('bigVideo'));
        $config_tpl->setVariable('VERY_LARGE',  $plugin->txt('veryBigVideo'));
		$config_tpl->setVariable('IS_CHRONOLOGIC_VALUE', $this->object->isChronologic());
		$config_tpl->setVariable('AUTO_RESUME_AFTER_QUESTION', $this->object->isAutoResumeAfterQuestion());
		$config_tpl->setVariable('ANON_COMMENTS', $this->object->isAnonymized());
		$config_tpl->setVariable('FIXED_MODAL', $this->object->isFixedModal());
		$config_tpl->setVariable('SHOW_TOC_FIRST', $this->object->getShowTocFirst());
		$config_tpl->setVariable('ENABLE_COMMENT_STREAM', $this->object->getEnableCommentStream());
		$config_tpl->setVariable('LAYOUT_WIDTH', $this->object->getLayoutWidthTransformed());
		$config_tpl->setVariable('HAS_TRACKS', $this->getSubtitleDataAndFilesForJson());
		$config_tpl->setVariable('SHOW_TOOLBAR', $this->object->getEnableToolbar());
		$config_tpl->setVariable('SHOW_ONLY_UNTIL_PLAYHEAD', $this->object->isChronologic());
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

		$stop_points = array();
		$comments    = array();
        $comments_toc= array();
		$image_cache = array();
        $compulsory_questions = array();
		if( ! $edit_screen)
		{
			$stop_points = $this->objComment->getStopPoints();
			$comments    = $this->objComment->getContentComments();
			$comments_toc= $this->objComment->getContentComments(true);
			$image_cache = ilObjComment::getUserImageCache();
            $compulsory_questions = SimpleChoiceQuestion::getAllCompulsoryQuestions($this->obj_id);
		}

		$config_tpl->setVariable('STOP_POINTS', json_encode($stop_points));
		$config_tpl->setVariable('COMPULSORY_QUESTIONS', json_encode($compulsory_questions));
		$config_tpl->setVariable('COMMENTS', json_encode($comments));
		$config_tpl->setVariable('COMMENTS_TOC', json_encode($comments_toc));
		$config_tpl->setVariable('USER_IMAGES_CACHE', json_encode($image_cache));
		$config_tpl->setVariable('INTERACTIVE_VIDEO_REF_ID', $this->object->getRefId());
		$config_tpl->setVariable('INTERACTIVE_INSTALLATION_CLIENT_ID', CLIENT_ID);

		return $config_tpl->get();
	}
    public function showTutorInsertQuestionFormAjax(): void
    {
        $simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
        $form = $simple_question->initQuestionForm(true);
        $ck = new ilTextAreaInputCkeditor($this->plugin);
        $ck->appendCkEditorMathJaxSupportToForm($form);
        $form->addCommandButton('insertQuestion', $this->lng->txt('insert'));
        $form->addCommandButton('editComments', $this->lng->txt('cancel'));
        echo $form->getHTML();
        $this->callExit();
    }

    public function getCommentAndMarkerForm(): void
    {
        $form = $this->initCommentForm();

        $form->addCommandButton('insertTutorCommentAjax', $this->lng->txt('insert'));
        $form->addCommandButton('cancelCommentsAjax', $this->lng->txt('cancel'));
        $my_tpl = $this->getCommentTemplate();
        $my_tpl->setVariable('FORM',$form->getHTML());
        echo $my_tpl->get();
        $this->callExit();
    }

    public function getChapterForm(): void
    {
        $form = $this->initChapterForm();

        $form->addCommandButton('insertTutorChapter', $this->lng->txt('insert'));
        $form->addCommandButton('cancelCommentsAjax', $this->lng->txt('cancel'));
        echo $form->getHTML();
        $this->callExit();
    }

    /**
     *
     */
    public function insertTutorCommentAjax(): void
    {
        $this->insertComment(1, false, true);
    }
    /**
     *
     */
    public function cancelCommentsAjax(): void
    {
        $this->redirectToShowContentOrEditComments(true);
    }

    /**
     * @param $ajax
     */
    private function redirectToShowContentOrEditComments($ajax): void
    {
        if ($ajax) {
            $this->ctrl->redirect($this, 'showContent');
        } else {
            $this->ctrl->redirect($this, 'editComments');
        }
    }

    protected function getCommentTemplate(): \ilTemplate
    {
        /**
         * @var $tpl ilTemplate
         * @var $ilAccess ilAccessHandler
         */
        global $tpl, $ilAccess, $DIC;

        $my_tpl = new ilTemplate("tpl.comment_form.html", true, true, $this->plugin->getDirectory());
        $object = new ilInteractiveVideoSourceFactoryGUI($this->object);
        $object->addPlayerElements($tpl);

        if($this->object->isMarkerActive()) {
            $marker_template = '';
            if($this->object->getMarkerForStudents() == 1 || $ilAccess->checkAccess('write', '', $this->object->getRefId()))
            {
                $marker_template = $this->buildMarkerEditorTemplate()->get();
            }

            $player_id = ilInteractiveVideoUniqueIds::getInstance()->getNewId();
            $my_tpl->setVariable('PLAYER', $object->getPlayer($player_id)->get() . $this->initPlayerConfig($player_id, $this->object->getSourceId(), true));
            $my_tpl->setVariable('MARKER', $marker_template);
            $my_tpl->setVariable('PLAYER_ID', $player_id);
            $DIC->ui()->mainTemplate()->addOnLoadCode('il.InteractiveVideoPlayerFunction.refreshTimerInEditScreen("'.$player_id.'");');
        }

        return $my_tpl;
    }

	/**
	 * @param ilPropertyFormGUI $a_form
	 * @return bool
	 */
    protected function validateCustom(ilPropertyFormGUI $form): bool
	{
		return parent::validateCustom($form);
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
    protected function updateCustom(ilPropertyFormGUI $form): void
	{
		$factory = new ilInteractiveVideoSourceFactoryGUI($this->object);
		$factory->checkForm($form);

		$is_task = $form->getInput('is_task');
		$this->object->setTaskActive((int)$is_task);

		$task = $form->getInput('task');
		$this->object->setTask(ilInteractiveVideoPlugin::stripSlashesWrapping($task, false));

		$is_anonymized = $form->getInput('is_anonymized');
		$this->object->setIsAnonymized((int)$is_anonymized);

		$is_repeat = $form->getInput('is_repeat');
		$this->object->setIsRepeat((int)$is_repeat);

		$is_public = $form->getInput('is_public');
		$this->object->setIsPublic((int)$is_public);

		$is_online = $form->getInput('is_online');
		$this->object->setOnline((int)$is_online);

		$is_chronologic = $form->getInput('is_chronologic');
		$this->object->setIsChronologic((int)$is_chronologic);

		$enable_comment = $form->getInput('enable_comment');
		$this->object->setEnableComment((int)$enable_comment);

		$show_toolbar = $form->getInput('show_toolbar');
		$this->object->setEnableToolbar((int)$show_toolbar);

        $show_toc_first = $form->getInput('show_toc_first');
		$this->object->setShowTocFirst((int)$show_toc_first);

        $enable_comment_stream = $form->getInput('enable_comment_stream');
		$this->object->setEnableCommentStream((int)$enable_comment_stream);

		$auto_resume = $form->getInput('auto_resume');
		$this->object->setAutoResumeAfterQuestion((int)$auto_resume);

		$fixed_modal = $form->getInput('fixed_modal');
		$this->object->setFixedModal((int)$fixed_modal);

        $marker_for_students = $form->getInput('marker_for_students');
        $this->object->setMarkerForStudents((int)$marker_for_students);

        $layout_width = $form->getInput('layout_width');
        $this->object->setLayoutWidth((int)$layout_width);

		$factory = new ilInteractiveVideoSourceFactory();
		$source = $factory->getVideoSourceObject($form->getInput('source_id'));
		$source->doUpdateVideoSource($this->obj_id);

		$source_id = $form->getInput('source_id');
		$this->object->setSourceId(ilInteractiveVideoPlugin::stripSlashesWrapping($source_id));

		$this->object->update();

		parent::updateCustom($form);
	}

	/**
	 * @param string $type
	 * @return array
	 */
    protected function initCreationForms(string $new_type): array
	{
		if(ilInteractiveVideoPlugin::getInstance()->isCoreMin52())
		{
			$form_array =  array(
				self::CFORM_NEW => $this->initCreateForm($new_type),
				self::CFORM_IMPORT => $this->initImportForm($new_type)
			);
		}
		else
		{
			$form_array =  array(
				self::CFORM_NEW => $this->initCreateForm($new_type)
			);
		}
		return $form_array;
	}

	/**
	 * @param string $type
	 * @return ilPropertyFormGUI
	 */
    protected function initCreateForm(string $new_type): ilPropertyFormGUI
	{
		$form = parent::initCreateForm($new_type);

		$form = $this->appendFormsFromFactory($form);

		$online = new ilCheckboxInputGUI($this->lng->txt('online'), 'is_online');
		$form->addItem($online);

		return $form;
	}

    /**
     * @param ilPropertyFormGUI $a_form
     * @throws ilTemplateException
     */
    protected function initEditCustomForm(ilPropertyFormGUI $a_form): void
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
     * @throws ilTemplateException
     */
	protected function appendCkEditorMathJaxSupportToForm(ilPropertyFormGUI $a_form): void
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
	protected function appendDefaultFormOptions(ilPropertyFormGUI $a_form): void
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$section = new ilFormSectionHeaderGUI();
		$section->setTitle($plugin->txt('task'));
		$a_form->addItem($section);

		$description_switch = new ilCheckboxInputGUI($plugin->txt('task_switch'),'is_task');
		$description_switch->setInfo($plugin->txt('task_switch_info'));
		$description = xvidUtils::constructTextAreaFormElement('task', 'task');
		$description_switch->addSubItem($description);
		$a_form->addItem($description_switch);

        $section = new ilFormSectionHeaderGUI();
        $section->setTitle($plugin->txt('display'));
        $a_form->addItem($section);

        $show_toolbar = new ilCheckboxInputGUI($plugin->txt('show_toolbar'), 'show_toolbar');
        $show_toolbar->setInfo($plugin->txt('show_toolbar_info'));
        $a_form->addItem($show_toolbar);

        $show_toc_first = new ilCheckboxInputGUI($plugin->txt('show_toc_first'), 'show_toc_first');
        $show_toc_first->setInfo($plugin->txt('show_toc_first_info'));
        $a_form->addItem($show_toc_first);

        $enable_comment_stream = new ilCheckboxInputGUI($plugin->txt('enable_comment_stream'), 'enable_comment_stream');
        $enable_comment_stream->setInfo($plugin->txt('enable_comment_stream_info'));
        $a_form->addItem($enable_comment_stream);

        $display_width_group = new ilRadioGroupInputGUI($plugin->txt('display_width'), 'layout_width');
        $opt = new ilRadioOption(
            $plugin->txt('similarSize'),
            ilObjInteractiveVideo::LAYOUT_SIMILAR,
            $plugin->txt('similarSize_info')
        );
        $display_width_group->addOption($opt);
        $opt = new ilRadioOption(
            $plugin->txt('bigVideo'),
            ilObjInteractiveVideo::LAYOUT_BIG_VIDEO,
            $plugin->txt('bigVideo_info')
        );
        $display_width_group->addOption($opt);
        $opt = new ilRadioOption(
            $plugin->txt('veryBigVideo'),
            ilObjInteractiveVideo::LAYOUT_VERY_BIG_VIDEO,
            $plugin->txt('veryBigVideo_info')
        );
        $display_width_group->addOption($opt);

        $a_form->addItem($display_width_group);

		$section = new ilFormSectionHeaderGUI();
		$section->setTitle($plugin->txt('comments'));
		$a_form->addItem($section);

		$anonymize = new ilCheckboxInputGUI($plugin->txt('is_anonymized'), 'is_anonymized');
		$anonymize->setInfo($plugin->txt('is_anonymized_info'));
		$a_form->addItem($anonymize);

		$is_public = new ilCheckboxInputGUI($plugin->txt('is_public'), 'is_public');
		$is_public->setInfo($plugin->txt('is_public_info'));
		$a_form->addItem($is_public);

		$chronology = new ilCheckboxInputGUI($plugin->txt('is_chronologic_settings'), 'is_chronologic');
		$chronology->setInfo($plugin->txt('is_chronologic_settings_info'));
		$a_form->addItem($chronology);

		$enable_comment = new ilCheckboxInputGUI($plugin->txt('enable_comment'), 'enable_comment');
		$enable_comment->setInfo($plugin->txt('enable_comment_info'));
        $enable_comment->setValue(1);
		$a_form->addItem($enable_comment);

        if($this->object->isMarkerActive()) {
            $marker_for_students = new ilCheckboxInputGUI($this->plugin->txt('marker_for_students'), 'marker_for_students');
            $marker_for_students->setInfo($this->plugin->txt('marker_for_students_info'));
            $a_form->addItem($marker_for_students);
        }

		$section = new ilFormSectionHeaderGUI();
		$section->setTitle($plugin->txt('questions'));
		$a_form->addItem($section);

		$repeat = new ilCheckboxInputGUI($plugin->txt('is_repeat'), 'is_repeat');
		$repeat->setInfo($plugin->txt('is_repeat_info'));
		$a_form->addItem($repeat);

		$section = new ilFormSectionHeaderGUI();
		$section->setTitle($plugin->txt('modal_section'));
		$a_form->addItem($section);

		$auto_resume = new ilCheckboxInputGUI($plugin->txt('auto_resume'), 'auto_resume');
		$auto_resume->setInfo($plugin->txt('auto_resume_info'));
		$auto_resume->setValue(1);
		$a_form->addItem($auto_resume);

		$fixed_modal = new ilCheckboxInputGUI($plugin->txt('fixed_modal'), 'fixed_modal');
		$fixed_modal->setInfo($plugin->txt('fixed_modal_info'));
		$fixed_modal->setValue(1);
		$a_form->addItem($fixed_modal);
	}

	/**
	 * @param array $a_values
	 */
    protected function getEditFormCustomValues(array &$a_values): void
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
		$a_values["enable_comment"]			= $this->object->getEnableComment();
		$a_values["show_toolbar"]			= $this->object->getEnableToolbar();
		$a_values["show_toc_first"]		= $this->object->getShowTocFirst();
		$a_values["enable_comment_stream"]		= $this->object->getEnableCommentStream();
		$source_id = $this->object->getSourceId();
        if($source_id === 'opc' || $source_id === '') {
            if(array_key_exists('xvid_source_id', $_GET) && $_GET['xvid_source_id'] !== ''){
                $source_id = ilInteractiveVideoPlugin::stripSlashesWrapping($_GET['xvid_source_id']);
            }
        }

		$a_values['source_id']			= $source_id;
		$a_values['is_task']			= $this->object->getTaskActive();
		$a_values['task']				= $this->object->getTask();
		$a_values['auto_resume']		= $this->object->isAutoResumeAfterQuestion();
		$a_values['fixed_modal']		= $this->object->isFixedModal();
        $a_values["marker_for_students"]= $this->object->getMarkerForStudents();
        $a_values["layout_width"]       = $this->object->getLayoutWidth();
	}

	public function editProperties(): void
	{
	    global $DIC;
        $customJS = ilInteractiveVideoPlugin::stripSlashesWrapping($_GET['xvid_custom_js']);
        $DIC->ui()->mainTemplate()->addOnLoadCode('"' . $customJS . '"');
        $DIC->ui()->mainTemplate()->addOnLoadCode('console.log('. $customJS .')');
		$this->edit();
	}

	protected function getSubtitleDataAndFilesForJson(){
		$data = array();
		$subtitle_data = $this->object->getSubtitleData();
		$subtitle_files = $this->getSubtitleFiles();
		$dir  = $this->getPathForSubtitleFiles();

		if(is_array($subtitle_files) && count($subtitle_files) > 0) {
			foreach($subtitle_files as $key => $name){
				$track = new stdClass();
				$track->label = $subtitle_data[$name]['l'];
				$track->src = $dir . $name;
				$track->srclang = $subtitle_data[$name]['s'];
				$data[] = $track;
			}
		}
		#print_r($data); exit;
		return json_encode($data);
	}

	protected function getPathForSubtitleFiles(): string
	{
		return ilFileUtils::getWebspaceDir() . '/xvid/xvid_' . $this->object->getId() . '/subtitles/';
	}

	public function addSubtitle(): void
	{
		/**
		 * @var $ilTabs ilTabsGUI
		 */
		global $ilTabs, $tpl;

		$ilTabs->addSubTab('editProperties', $this->lng->txt('settings'), $this->ctrl->getLinkTarget($this, 'editProperties'));
		$ilTabs->addSubTab('addSubtitle', $this->plugin->txt('subtitle'), $this->ctrl->getLinkTarget($this, 'addSubtitle'));

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('addSubtitle');

		$ilCtrl = $this->ctrl;

		$form = new ilPropertyFormGUI();
		$form->setTarget("_top");
		$form->setFormAction($ilCtrl->getFormAction($this, "update"));
		$form->setTitle($this->plugin->txt("subtitle"));

		$file = new ilFileInputGUI($this->plugin->txt('subtitle'), 'subtitle');
		$file->setSuffixes(array('vtt'));
		$form->addItem($file);

		$subtitle_data = $this->object->getSubtitleData();
		$subtitle_files = $this->getSubtitleFiles();

		if(is_array($subtitle_files) && count($subtitle_files) > 0) {
			foreach($subtitle_files as $name){
				$title = new ilNonEditableValueGUI();
				$title->setTitle($this->lng->txt('file'));
				$title->setValue($name);

				$short = new ilTextInputGUI($this->plugin->txt('short_title'), 's#' . $name);
				$short_title = '';
				if(array_key_exists($name, $subtitle_data)) {
					$short_title = $subtitle_data[$name]['s'];
				}
				$short->setValue($short_title);
				$short->setRequired(true);
				$title->addSubItem($short);

				$long = new ilTextInputGUI($this->plugin->txt('long_title'), 'l#' . $name);
				$long_title = '';
				if(array_key_exists($name, $subtitle_data)) {
					$long_title = $subtitle_data[$name]['l'];
				}
				$long->setValue($long_title);
				$title->addSubItem($long);

				$button = ilLinkButton::getInstance();
				$button->setCaption("remove");
				$ilCtrl->setParameterByClass('ilObjInteractiveVideoGUI', "remove_subtitle_file", $name);
				$remove_link = $ilCtrl->getLinkTargetByClass('ilObjInteractiveVideoGUI',  "confirmRemoveSubtitle");
				$ilCtrl->setParameterByClass('ilObjInteractiveVideoGUI', "remove_subtitle_file", "");
				$button->setUrl($remove_link);

				$title->setInfo($button->render());
				$form->addItem($title);
			}
		}


		$form->addCommandButton('postAddSubtitle', $this->lng->txt('save'));
		$form->addCommandButton('editProperties', $this->lng->txt('cancel'));
		$tpl->setContent($form->getHTML());
	}

	/**
	 * @return array<string, string>
	 */
	protected function getSubtitleFiles(): array{
		$sub_titles = array();
		$directory = $this->getPathForSubtitleFiles();

		if(file_exists($directory)) {
			if ($handle = opendir($directory)) {
				while (false !== ($entry = readdir($handle))) {
					if ($entry != "." && $entry != "..") {
						$sub_titles[$entry] = $entry;
					}
				}
			}
			closedir($handle);
		}

		return $sub_titles;
	}

	/**
	 */
	protected function removeSubtitle(): void{

        $post = $this->http->wrapper()->post();
        if($post->has('remove_subtitle_file'))
        {
            $filename = $post->retrieve('remove_subtitle_file', $this->refinery->kindlyTo()->string());
            $file = ilFileUtils::getWebspaceDir() . '/xvid/xvid_' . $this->object->getId() . '/subtitles/' . $filename;
            if(file_exists($file)) {
                unlink($file);
                $this->object->removeSubtitleData($filename);

                $this->tpl->setOnScreenMessage("success", $this->plugin->txt('subtitle_removed'), true);
                $this->ctrl->redirect($this, 'addSubtitle');

            }
        }
	}

	/**
	 *
	 */
	public function confirmRemoveSubtitle(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editProperties');
		$ilTabs->activateSubTab('addSubtitle');
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'removeSubtitle'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_subtitle'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'removeSubtitle');
		$confirm->setCancel($this->lng->txt('cancel'), 'addSubtitle');

		$filename = ilInteractiveVideoPlugin::stripSlashesWrapping($_GET['remove_subtitle_file']);
		$confirm->addItem('remove_subtitle_file', $filename, $filename);
		$tpl->setContent($confirm->getHTML());

	}

	public function postAddSubtitle(): void
	{
		if(array_key_exists('tmp_name', $_FILES['subtitle'])
			&& $_FILES['subtitle']['tmp_name'] != ''
			&& array_key_exists('name', $_FILES['subtitle'])
			&& $_FILES['subtitle']['name'] != ''
			&& file_exists($_FILES['subtitle']['tmp_name']))
		{
			$tmp_name = ilInteractiveVideoPlugin::stripSlashesWrapping($_FILES['subtitle']['tmp_name']);
			$file_name = ilInteractiveVideoPlugin::stripSlashesWrapping($_FILES['subtitle']['name']);
            $file_name = str_replace(' ', '_', $file_name);
			$part			= 'xvid_' . $this->object->getId() . '/subtitles/';
			$path			= xvidUtils::ensureFileSavePathExists($part);
			$new_file		= $path.$file_name;
			if(@copy($tmp_name, $new_file))
			{
				chmod($new_file, 0770);
			}

		}
		$data_short = array();
		$data_long  = array();
		foreach ($_POST as $name => $value) {

			if (substr($name, 0, 2) === "l#") {
				$data_long = $this->fillDataForSubtitles($name, $value, $data_long);
			} elseif (substr($name, 0, 2) === "s#") {
				$data_short = $this->fillDataForSubtitles($name, $value, $data_short);
				$short_title = $data_short;
				array_pop($short_title);
				if($short_title == '') {
                    $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('you_need_a_short_title'), true);
					$this->ctrl->redirect($this, 'addSubtitle');
				}
			}
		}
		$this->object->saveSubtitleData($data_short, $data_long);

		$this->addSubtitle();
	}

	/**
	 * @param $name
	 * @param $value
	 * @param $data
	 * @return bool|null|string|string[]
	 */
	protected function fillDataForSubtitles($name, $value, $data)
	{
		$name  = ilArrayUtil::stripSlashesRecursive($name);
		$value = ilArrayUtil::stripSlashesRecursive($value);

		$cut             = substr($name, 2);
		$cut             = preg_replace('/_vtt$/', '.vtt', $cut);
		$cut             = preg_replace('/_srt$/', '.srt', $cut);
		$data[$cut]      = $value;
		return $data;
	}

	/**ilMediaPoolPresentationGUI
	 * @return ilPropertyFormGUI
	 */
    protected function initEditForm(): ilPropertyFormGUI
	{
		$form = parent::initEditForm();
		$this->initEditCustomForm($form);
		return $form;
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
    public function save(): void
	{
		$this->saveObject();
	}

	/**
	 * Overwriting this method is necessary to handle creation problems with the api
	 */
    public function saveObject(): void
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
                $this->tpl->setOnScreenMessage("failure", $plugin->txt($e->getMessage()), true);
			}
			else
			{
                $this->tpl->setOnScreenMessage("failure", $e->getMessage(), true);
			}

			$this->ctrl->setParameterByClass('ilrepositorygui', 'ref_id', (int)$_GET['ref_id']);
			$this->ctrl->redirectByClass('ilrepositorygui');
		}
	}

	/**
	 * @param ilPropertyFormGUI $a_form
	 */
	protected function appendFormsFromFactory(ilPropertyFormGUI $a_form): \ilPropertyFormGUI
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
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('at_least_one_source'), true);
		}
		return $a_form;
	}

	/**
	 * @see ilDesktopItemHandling::addToDesk()
	 */
    public function addToDeskObject(): void
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

		ilDesktopItemGUI::addToDesktop();
        $this->tpl->setOnScreenMessage("success", $this->lng->txt('added_to_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
	 * @see ilDesktopItemHandling::removeFromDesk()
	 */
    public function removeFromDeskObject(): void
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

		ilDesktopItemGUI::removeFromDesktop();
        $this->tpl->setOnScreenMessage("success", $this->lng->txt('removed_from_desktop'), true);
		$this->ctrl->redirect($this);
	}

	/**
				 * @param string $a_sub_type
				 * @param int    $a_sub_id
				 * @return \ilObjectListGUI|\ilObjInteractiveVideoListGUI|null
				 */
				protected function initHeaderAction(?string $sub_type = null, ?int $sub_id = null): ?ilObjectListGUI
	{
        return parent::initHeaderAction();
	}

    protected function setTabs(): void
	{
		/**
		 * @var $ilTabs   ilTabsGUI
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilTabs, $ilAccess, $ilCtrl;

		if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('content', $this->lng->txt('content'), $this->ctrl->getLinkTarget($this, 'showContent'));
		}

		$this->addInfoTab();

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editProperties', $this->lng->txt('settings'), $this->ctrl->getLinkTarget($this, 'editProperties'));
			if($ilCtrl->getCmd() === 'editProperties')
			{
				$ilTabs->addSubTab('editProperties', $this->lng->txt('settings'), $this->ctrl->getLinkTarget($this, 'editProperties'));
				if( ! $this->object->getVideoSourceObject($this->object->getSourceId())->hasOwnPlayer()) {
					$ilTabs->addSubTab('addSubtitle', $this->plugin->txt('subtitle'), $this->ctrl->getLinkTarget($this, 'addSubtitle'));
				}
			}
		}

		if($ilAccess->checkAccess('write', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', ilInteractiveVideoPlugin::getInstance()->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editComments'));
		}
		else if($ilAccess->checkAccess('read', '', $this->object->getRefId()))
		{
			$ilTabs->addTab('editComments', ilInteractiveVideoPlugin::getInstance()->txt('questions_comments'), $this->ctrl->getLinkTarget($this, 'editMyComments'));
		}
		$a = $this->object;
		if(! $this->object instanceof ilObjRootFolder) {
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
        }


		$this->addPermissionTab();
	}

	public function setSubTabs(string $a_tab): void
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
	 */
	public function hasPermission(string $permission): bool
	{
		return $this->checkPermissionBool($permission);
	}

    /**
	 * @param $permission
	 * @throws ilObjectException
	 */
	public function ensurePermission(string $permission): void
	{
		$this->checkPermission($permission);
	}

    /**
     * @param array $permissions
     * @return bool
     * @throws ilObjectException
     */
	public function ensureAtLeastOnePermission(array $permissions)
	{
		foreach ($permissions as $permission) {
			if($this->checkPermissionBool($permission)) {
				return true;
			}
		}
		// Since all $permissions returned false, this checkPermission() will lead to general behaviour of redirecting and sending failure
		$this->checkPermission($permission);
	}

	public function getPluginInstance(): \ilPlugin
	{
		return ilInteractiveVideoPlugin::getInstance();
	}

#region COMMENTS

    /**
     * @throws ilTemplateException
     */
	public function postComment(): void
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;
        $post = $this->http->wrapper()->post();
        if($post->has('comment_text')) {
            $comment_text = $post->retrieve('comment_text', $this->refinery->kindlyTo()->string());
            if(!strlen(trim(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_text)))){
                $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('missing_comment_text'));
                $this->showContent();
                return;
            }
        }

        if($post->has('comment_time')) {
            $comment_time = $post->retrieve('comment_time', $this->refinery->kindlyTo()->string());
            if(!strlen(trim(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time)))){
                $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('missing_stopping_point'));
                $this->showContent();
                return;
            }
        }

        if($post->has('comment_time_end')) {
            $seconds_end = $post->retrieve('comment_time_end', $this->refinery->kindlyTo()->string());
        } else {
            $seconds_end = 0;
        }

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim($comment_text));
		$comment->setCommentTime($comment_time);
        if($post->has('is_table_of_content')) {
            $is_table_of_content = $post->retrieve('is_table_of_content', $this->refinery->kindlyTo()->int());
        } else {
            $is_table_of_content = 0;
        }
		$comment->setIsTableOfContent($is_table_of_content);
		$comment->setCommentTimeEnd($seconds_end);

        if($post->has('is_reply_to')) {
            $comment->setIsReplyTo($post->retrieve('is_reply_to', $this->refinery->kindlyTo()->int()));
        }

		if($ilUser->getId() == ANONYMOUS_USER_ID)
		{
			// NO private-flag for Anonymous!!
			$comment->setIsPrivate(0);
		}
		else
		{
			$is_private = 0;
            if($post->has('is_private')) {
                $private = $post->retrieve('is_private', $this->refinery->kindlyTo()->int());
                if($private === 1) {
                    $is_private = 1;
                }
            }

			$comment->setIsPrivate($is_private );
		}

        if($post->has('marker')) {
            $marker = $post->retrieve('marker', $this->refinery->kindlyTo()->string());
        } else {
            $marker = '';
        }
        if($marker > 0)
        {
            $marker_clean = $this->cleanMarker($marker);
            $comment->setMarker($marker_clean);
            if($comment->getCommentTimeEnd() == 0)
            {
                $comment->setCommentTimeEnd($comment->getCommentTime() + 3 );
            }
        }
		$comment->create();
		$this->callExit();
	}

    /**
     * @param $marker
     * @return string|string[]
     */
    protected function cleanMarker($marker): string
    {
        $marker = '<svg>'.trim($marker).'</svg>';
        $marker = xvidUtils::secureSvg($marker);
        $marker = preg_replace( "/\r|\n|\t|<svg>|<\/svg>/", "", $marker );
        $marker = '<svg>'.trim($marker).'</svg>';
        return $marker;
    }

	/**
	 *
	 */
	public function confirmDeleteComment(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editComments');

        $post = $this->http->wrapper()->post();
        $post_ids = [];
        if($post->has('comment_id')) {
            $post_ids = $post->retrieve('comment_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }


        if(!count($post_ids))
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'), true);
            $this->ctrl->redirect($this, 'editComments');
		}
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteComment'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editComments');

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(is_array($wrong_comment_ids) && (count($wrong_comment_ids) == 0))
		{
			foreach($post_ids as $comment_id)
			{
			    $texts = $this->object->getCommentTextById($comment_id);
			    if(strlen($texts['title']) > 0){
			        $text = $texts['title'];
                } else {
                    $text = $texts['text'];
                }
				$confirm->addItem('comment_id[]', $comment_id, $text);
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
		}
	}

	public function deleteComment(): void
	{
        $post = $this->http->wrapper()->post();
        $post_ids = [];
        if($post->has('comment_id')) {
            $post_ids = $post->retrieve('comment_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }
		if(!count($post_ids)) {
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'));
			$this->editComments();
			return;
		}

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(is_array($wrong_comment_ids) && (count($wrong_comment_ids) == 0))
		{
			$this->object->deleteComments($post_ids);
            $this->tpl->setOnScreenMessage("success", ilInteractiveVideoPlugin::getInstance()->txt('comments_successfully_deleted'));
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
		}
		$this->editComments();
	}

    /**
	 * @throws ilTemplateException
	 */
	private function initCommentForm(): \ilPropertyFormGUI
	{
		/**
		 * $ilUser ilObjUser
		 */
		global $ilUser;
		$plugin = ilInteractiveVideoPlugin::getInstance();
        $post = $this->http->wrapper()->post();
		$form = new ilPropertyFormGUI();

		$form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
        if($this->object->isMarkerActive()) {
            $form->setTitle($plugin->txt('insert_comment'));
        } else {
            $form->setTitle($plugin->txt('insert_comment_only'));
        }
		$this->appendCkEditorMathJaxSupportToForm($form);
		$section_header = new ilFormSectionHeaderGUI();
		$section_header->setTitle($plugin->txt('general'));
		$form->addItem($section_header);

		$title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
		$form->addItem($title);

		$time = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'comment_time');
		#$time->setShowTime(true);
		#$time->setShowSeconds(true);

		if($post->has('comment_time'))
		{
			$seconds = $post->retrieve('comment_time', $this->refinery->kindlyTo()->int());
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);

		$time_end = new ilInteractiveVideoTimePicker($plugin->txt('time_end'), 'comment_time_end');
		#$time_end->setShowTime(true);
		#$time_end->setShowSeconds(true);

        if($post->has('comment_time_end'))
		{
            $seconds = $post->retrieve('comment_time_end', $this->refinery->kindlyTo()->int());
            $time->setValueByArray(array('comment_time_end' => (int)$seconds));
        }
		$form->addItem($time_end);

		if($ilUser->getId() != ANONYMOUS_USER_ID)
		{
			$is_private = new ilCheckboxInputGUI($plugin->txt('is_private_comment'), 'is_private');
            if( $this->object->isPublic() == 0) {
                $is_private->setChecked(true);
            }
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
		$fake_marker = new ilHiddenInputGUI('fake_marker');
		$form->addItem($fake_marker);

		return $form;
	}

    private function initChapterForm(): \ilPropertyFormGUI
    {
        $plugin = ilInteractiveVideoPlugin::getInstance();

        $post = $this->http->wrapper()->post();
        $form = new ilPropertyFormGUI();
        $form->setFormAction($this->ctrl->getFormAction($this, 'insertComment'));
        $form->setTitle($plugin->txt('insert_chapter'));
        $this->appendCkEditorMathJaxSupportToForm($form);
        $section_header = new ilFormSectionHeaderGUI();
        $section_header->setTitle($plugin->txt('general'));
        $form->addItem($section_header);

        $title = new ilTextInputGUI($this->lng->txt('title'), 'comment_title');
        $title->setRequired(true);
        $form->addItem($title);

        $time = new ilInteractiveVideoTimePicker($this->lng->txt('time'), 'comment_time');
        #$time->setShowTime(true);
        #$time->setShowSeconds(true);

        if($post->has('comment_time')) {
            $seconds = $post->retrieve('comment_time', $this->refinery->kindlyTo()->int());
            $time->setValueByArray(array('comment_time' => (int)$seconds));
        }
        $form->addItem($time);

        $section_header = new ilFormSectionHeaderGUI();
        $section_header->setTitle($plugin->txt('comment'));
        $form->addItem($section_header);

        $comment = xvidUtils::constructTextAreaFormElement('comment', 'comment_text');
        $form->addItem($comment);

        $frm_id = new ilHiddenInputGUI('comment_id');
        $form->addItem($frm_id);

        $is_toc = new ilHiddenInputGUI('is_table_of_content');
        $is_toc->setValue(1);
        $form->addItem($is_toc);

        return $form;
    }

	/**
	 *
	 */
	public function showTutorInsertChapterForm(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('editComments');

		$form = $this->initChapterForm();

		$form->addCommandButton('insertTutorChapter', $this->lng->txt('insert'));
		$form->addCommandButton('cancelComments', $this->lng->txt('cancel'));
        $this->addJavascriptAndCSSToTemplate($tpl);
		$tpl->setContent($form->getHTML());
	}

	/**
	 *
	 */
	public function showTutorInsertCommentForm(): void
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

        $my_tpl = $this->getCommentTemplate();
        $my_tpl->setVariable('FORM',$form->getHTML());
        if($this->object->isMarkerActive()){
            $tpl->addOnLoadCode('il.InteractiveVideoOverlayMarker.checkForEditScreen();');
        }
        $this->addJavascriptAndCSSToTemplate($tpl);
        $tpl->setContent($my_tpl->get());
	}

	public function cancelComments(): void
	{
		$this->ctrl->redirect($this, 'editComments');
	}

	public function editMyComments(): void
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
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editMyComments');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

    /**
     * @throws ilTemplateException
     */
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
			$this->objComment->setIsTableOfContent((int)$form->getInput('is_table_of_content'));

			// calculate seconds
			$comment_time = $form->getInput('comment_time');
            $start_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
            $this->objComment->setCommentTime($start_time);

			$comment_time_end = $form->getInput('comment_time_end');
            $end_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
            $this->objComment->setCommentTimeEnd($end_time);
			$this->objComment->update();

			if($comment_time_end <= $comment_time && $comment_time_end !== 0){
                $this->tpl->setOnScreenMessage("failure", $this->plugin->txt('endtime_warning'));
                $form->setValuesByPost();
                return $this->editMyComment($form);
            }

			$this->editMyComments();
		}
		else
		{
			$form->setValuesByPost();
			return $this->editMyComment($form);
		}
	}

    /**
     *
     */
	public function confirmDeleteMyComment(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

        $post = $this->http->wrapper()->post();
		$ilTabs->activateTab('editComments');
		$this->setSubTabs('editComments');
		$ilTabs->activateSubTab('editMyComments');

        $post = $this->http->wrapper()->post();
        $post_ids = [];
        if($post->has('comment_id')) {
            $post_ids = $post->retrieve('comment_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
            if(!count($post_ids)) {
                $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'), true);
                $this->ctrl->redirect($this, 'editMyComments');
            }
        }

		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteMyComment'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_comment'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteMyComment');
		$confirm->setCancel($this->lng->txt('cancel'), 'editMyComments');

		$comment_ids = array_keys($this->object->getCommentIdsByObjId($this->obj_id));
		$wrong_comment_ids = array_diff($post_ids, $comment_ids);

		if(is_array($wrong_comment_ids) && (count($wrong_comment_ids) == 0))
		{
			foreach($post_ids as $comment_id)
			{
                $texts = $this->object->getCommentTextById($comment_id);
                if(strlen($texts['title']) > 0){
                    $text = $texts['title'];
                } else {
                    $text = $texts['text'];
                }
                $confirm->addItem('comment_id[]', $comment_id, $text);
			}

			$tpl->setContent($confirm->getHTML());
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('invalid_comment_ids'));
		}
	}

    /**
     *
     */
	public function deleteMyComment(): void
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();

        $post = $this->http->wrapper()->post();
        $post_ids = [];
        if($post->has('comment_id')) {
            $post_ids = $post->retrieve('comment_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
            if(!count($post_ids)) {
                $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'), true);
                $this->ctrl->redirect($this, 'editMyComments');
            }
        }

		$comments = $this->object->getCommentIdsByObjId($this->obj_id);
		$comment_ids = array_keys($comments);
		$user_ids = array_unique($comments);

		if(is_array($user_ids) && (count($user_ids)> 1))
		{
            $this->tpl->setOnScreenMessage("failure", $plugin->txt('invalid_comment_ids'));
			$this->editMyComments();
		}

		$wrong_comment_ids = array_diff($post_ids, $comment_ids);
		if(is_array($wrong_comment_ids) && (count($wrong_comment_ids) == 0))
		{
			$this->object->deleteComments($post_ids);
            $this->tpl->setOnScreenMessage("success", $plugin->txt('comments_successfully_deleted'));
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", $plugin->txt('invalid_comment_ids'));
		}
		$this->ctrl->redirect($this, 'editMyComments');
	}

	public function postTutorComment(): void
	{
		/**
		 * @var $ilUser ilObjUser
		 */
		global $ilUser;

        $post = $this->http->wrapper()->post();
        $comment_text = '';
        if($post->has('comment_text')) {
            $comment_text = $post->retrieve('comment_text', $this->refinery->kindlyTo()->string());
        }
		if(	!strlen(trim(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_text)))) {
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('missing_comment_text'));
			$this->editComments();
			return;
		}

        $comment_time = null;
        if($post->has('comment_time')) {
            $comment_time = $post->retrieve('comment_time', $this->refinery->kindlyTo()->float());
        }
        $comment_time_end = null;
        if($post->has('comment_time_end')) {
            $comment_time_end = $post->retrieve('comment_time_end', $this->refinery->kindlyTo()->float());
        }
		if(!strlen(trim(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time)))) {
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('missing_stopping_point'));
			$this->editComments();
			return;
		}

		$comment = new ilObjComment();
		$comment->setObjId($this->object->getId());
		$comment->setUserId($ilUser->getId());
		$comment->setCommentText(trim(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_text)));
		$comment->setCommentTime((float)$comment_time);
		$comment->setCommentTimeEnd((float)$comment_time_end);
		$comment->setIsTutor(true);
		$comment->create();

		$current_time = $comment->getCommentTime();
		$this->editComments($current_time);
	}

    /**
     * @throws ilTemplateException
     */
	public function updateComment(): void
	{
		$valid = false;
		$form = $this->initCommentForm();

		if($form->checkInput()) {
			$valid            = true;
			$comment_time     = $form->getInput('comment_time');
            $start_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
            $comment_time_end = $form->getInput('comment_time_end');
            $end_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time_end));
            if ($end_time > 0 && $start_time > $end_time) {
				$valid = false;
                $this->tpl->setOnScreenMessage("failure", $this->plugin->txt('endtime_warning'));
			}
			$comment_id = $form->getInput('comment_id');
			if ($comment_id > 0) {
				$this->objComment = new ilObjComment($comment_id);
			}
			$this->objComment->setCommentText($form->getInput('comment_text'));
			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));
            $this->objComment->setIsTableOfContent((int)$form->getInput('is_table_of_content'));
            $this->objComment->setMarker($form->getInput('fake_marker'));

			$this->objComment->setCommentTime($start_time);
			$this->objComment->setCommentTimeEnd($end_time);
		}
		if($valid){
			$this->objComment->update();
			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editComment($form);
		}
	}

	public function updateChapter(): void
	{
		$valid = false;
		$form = $this->initChapterForm();

		if($form->checkInput()) {
			$valid            = true;
			$comment_time     = $form->getInput('comment_time');
			$comment_id = $form->getInput('comment_id');
			if ($comment_id > 0) {
				$this->objComment = new ilObjComment($comment_id);
			}
			$this->objComment->setCommentText($form->getInput('comment_text'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setInteractive(0);
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));
            $this->objComment->setIsTableOfContent((int)$form->getInput('is_table_of_content'));
			$this->objComment->setCommentTime($comment_time);
		}
		if($valid){
			$this->objComment->update();
			$this->editComments();
		}
		else
		{
			$form->setValuesByPost();
			$this->editChapter($form);
		}
	}

	public function editComments(int $current_time = 0): void
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
		$player_id = ilInteractiveVideoUniqueIds::getInstance()->getNewId();
		$video_tpl->setVariable('VIDEO_PLAYER', $object->getPlayer($player_id)->get());

		$video_tpl->setVariable('FORM_ACTION', $this->ctrl->getFormAction($this,'showTutorInsertForm'));

		$this->objComment = new ilObjComment();
		$this->objComment->setObjId($this->object->getId());


        if($this->object->isMarkerActive()) {
            $video_tpl->setVariable('TXT_INS_COMMENT', $plugin->txt('insert_comment'));
        } else {
            $video_tpl->setVariable('TXT_INS_COMMENT', $plugin->txt('insert_comment_only'));
        }

		$video_tpl->setVariable('PLAYER_ID', $player_id);
		$video_tpl->setVariable('TXT_INS_QUESTION', $plugin->txt('insert_question'));
		$video_tpl->setVariable('TXT_INS_CHAPTER', $plugin->txt('insert_chapter'));

		$modal = ilInteractiveVideoModalExtension::getInstance();
		$modal->setId("ilQuestionModal");
		$modal->setBody('');
		$video_tpl->setVariable("MODAL_QUESTION_OVERLAY", $modal->getHTML());

		$video_tpl->setVariable('POST_COMMENT_URL', $this->ctrl->getLinkTarget($this, 'postTutorComment', '', false, false));

		$video_tpl->setVariable('CONFIG', $this->initPlayerConfig($player_id, $this->object->getSourceId(),true));

		$tbl_data = $this->object->getCommentsTableData(true, true);
		$tbl = new ilInteractiveVideoCommentsTableGUI($this, 'editComments');
        $tbl->setIsPublic($this->object->isPublic());
		$tbl->setData($tbl_data);
		$video_tpl->setVariable('TABLE', $tbl->getHTML());
		$tpl->setContent($video_tpl->get());
	}

	/**
	 *
	 */
	public function insertTutorComment(): void
	{
		$this->insertComment(1);
	}

	/**
	 *
	 */
	public function insertTutorChapter(): void
	{
		$this->insertComment(1, true);
	}

    /**
	 * @throws ilTemplateException
	 */
	private function insertComment(int $is_tutor = 0, bool $is_chapter = false, bool $ajax = false): void
	{
	    if($is_chapter) {
            $form = $this->initChapterForm();
        } else {
            $form = $this->initCommentForm();
        }

		if($form->checkInput())
		{
			$this->objComment = new ilObjComment();

			$this->objComment->setObjId($this->object->getId());
			$this->objComment->setCommentText($form->getInput('comment_text'));
			$this->objComment->setIsTableOfContent($is_chapter);
			$this->objComment->setInteractive(0);

			// $this->objComment->setCommentTags((string)$form->getInput('comment_tags'));
			$this->objComment->setCommentTitle((string)$form->getInput('comment_title'));
			$this->objComment->setIsPrivate((int)$form->getInput('is_private'));
			$this->objComment->setIsTableOfContent((int)$form->getInput('is_table_of_content'));

			// calculate seconds
			$comment_time		= $form->getInput('comment_time');
            $start_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
			$this->objComment->setCommentTime($start_time);
			$comment_time_end	= $form->getInput('comment_time_end');
            $end_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time_end));
            $this->objComment->setCommentTimeEnd($end_time);
			$this->objComment->setIsTutor($is_tutor);
            $fake_marker	= $form->getInput('fake_marker');
            if(strlen($fake_marker) > 0)
            {
                $this->objComment->setMarker($fake_marker);
                if( $this->objComment->getCommentTimeEnd() == 0)
                {
                    $this->objComment->setCommentTimeEnd( $this->objComment->getCommentTime() + 3 );
                }
            } else {
                $this->objComment->setMarker('');
            }
			$this->objComment->create();
            $this->tpl->setOnScreenMessage("success", $this->lng->txt('saved_successfully'));
            $this->redirectToShowContentOrEditComments($ajax);
		}
		else
		{
			$form->setValuesByPost();
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('err_check_input'),true);
			if($is_chapter === true) {
                $this->ctrl->redirect($this, 'showTutorInsertChapterForm');
            }
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
	 * @param \ilPropertyFormGUI $form
	 * @throws ilTemplateException
	 */
	public function editMyComment(ilPropertyFormGUI $form = NULL): void
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
	 * @param \ilPropertyFormGUI $form
	 * @throws ilTemplateException
	 */
	public function editComment(ilPropertyFormGUI $form = NULL): void
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

        $my_tpl = $this->getCommentTemplate();
        $my_tpl->setVariable('FORM',$form->getHTML());

        if($this->object->isMarkerActive()){
            $tpl->addOnLoadCode('il.InteractiveVideoOverlayMarker.checkForEditScreen();');
        }
		$tpl->setContent($my_tpl->get());
	}

	/**
	 * @param ilPropertyFormGUI $form
	 */
	public function editChapter(ilPropertyFormGUI $form = NULL): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$ilTabs->activateTab('editComments');
		if(!($form instanceof ilPropertyFormGUI))
		{
			$form = $this->initChapterForm();
			$form->setValuesByArray($this->getChapterFomValues(), true);
		}

		$form->setFormAction($this->ctrl->getFormAction($this, 'updateChapter'));
		$form->setTitle(ilInteractiveVideoPlugin::getInstance()->txt('edit_chapter'));
		$form->addCommandButton('updateChapter', $this->lng->txt('save'));
		$form->addCommandButton('editComments', $this->lng->txt('cancel'));

		$tpl->setContent($form->getHTML());
	}

    /**
	 * @return array|void
	 * @throws ilTemplateException
	 */
	private function getCommentFormValues(int $comment_id = 0)
	{
	    $values = [];
        $post = $this->http->wrapper()->post();
        $get = $this->http->wrapper()->query();
		if($comment_id === 0) {
            if($post->has('comment_id') || $get->has('comment_id')) {
                $comment_id = $post->retrieve('comment_id', $this->refinery->kindlyTo()->int());
                if($comment_id === 0) {
                    $comment_id = $get->retrieve('comment_id', $$this->refinery->kindlyTo()->int());
                }

                if($comment_id) {
                    $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('no_comment_id_given'), true);
                    return $this->showContent();
                }
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
		$values['is_table_of_content'] = $comment_data['is_table_of_content'];
		$values['is_reply_to']      = $comment_data['is_table_of_content'];
		$values['is_table_of_content'] = $comment_data['is_table_of_content'];
		$values['fake_marker']      = strip_tags($comment_data['marker'], ['rect', 'ellipse', 'path', 'line', 'text']);

		return $values;
	}

	private function getChapterFomValues(int $comment_id = 0)
	{
        $post = $this->http->wrapper()->post();
        $get = $this->http->wrapper()->query();
        if($comment_id === 0) {
            if($post->has('comment_id') || $get->has('comment_id')) {
                $comment_id = $post->retrieve('comment_id', $this->refinery->kindlyTo()->int());
                if($comment_id === 0) {
                    $comment_id = $get->retrieve('comment_id', $$this->refinery->kindlyTo()->int());
                }

                if($comment_id) {
                    $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('no_comment_id_given'), true);
                    return $this->showContent();
                }
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
		$values['is_table_of_content'] = $comment_data['is_table_of_content'];

		return $values;
	}
#endregion

#region QUESTIONS
    /**
     * @return ilPropertyFormGUI
     * @throws ilTemplateException
     */
	public function initQuestionForm()
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();
        $simple_question = new SimpleChoiceQuestionFormEditGUI($this->plugin, $this->object);
        $form = $simple_question->initQuestionForm(true);
        return $form;

        //Todo fix form creation
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

		if($post->has('comment_time'))
		{
            $seconds = $post->retrieve('comment_time', $this->refinery->kindlyTo()->int());
			$time->setValueByArray(array('comment_time' => (int)$seconds));
		}
		$form->addItem($time);

		$repeat_question = new ilCheckboxInputGUI($plugin->txt('repeat_question'), 'repeat_question');
		$repeat_question->setInfo($plugin->txt('repeat_question_info'));
		$form->addItem($repeat_question);

		$compulsory_question = new ilCheckboxInputGUI($plugin->txt('compulsory_question'), 'compulsory_question');
        $compulsory_question->setInfo($plugin->txt('compulsory_question_info'));
		$form->addItem($compulsory_question);

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

		if($post->has('jump_correct_ts'))
		{
			$seconds = $post->retrieve('jump_correct_ts', $this->refinery->kindlyTo()->int());
			$time->setValueByArray(array('jump_correct_ts' => (int)$seconds));
		}
		$is_jump_correct->addSubItem($jump_correct_ts);
		$feedback_correct->addSubItem($is_jump_correct);
		//$this->appendRepositorySelector($feedback_correct, 'feedback_correct_obj');
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

        if($post->has('jump_wrong_ts'))
        {
            $seconds = $post->retrieve('jump_wrong_ts', $this->refinery->kindlyTo()->int());
            $time->setValueByArray(array('jump_wrong_ts' => (int)$seconds));
        }
		$is_jump_wrong->addSubItem($jump_wrong_ts);
		$feedback_one_wrong->addSubItem($is_jump_wrong);
		$this->appendRepositorySelector($feedback_one_wrong, 'feedback_wrong_obj');
		$form->addItem($feedback_one_wrong);

        $show_best_solution = new ilCheckboxInputGUI($plugin->txt('show_best_solution'), 'show_best_solution');
        $show_best_solution->setInfo($plugin->txt('show_best_solution_info'));

        $show_best_solution_text = xvidUtils::constructTextAreaFormElement('best_solution_text', 'show_best_solution_text');
        $show_best_solution_text->setInfo($plugin->txt('best_solution_text_info'));
        $show_best_solution->addSubItem($show_best_solution_text);

        $form->addItem($show_best_solution);

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

		$modal = ilInteractiveVideoModalExtension::getInstance();
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
	 * @param $post_var
	 */
	protected function appendRepositorySelector(\ilTextAreaInputGUI $form, string $post_var): void
	{
		$plugin = ilInteractiveVideoPlugin::getInstance();
		$this->ctrl->setParameterByClass('ilformpropertydispatchgui', 'postvar', $post_var);
		$explorer_gui = new ilInteractiveVideoSelectionExplorerGUI(
			array('ilpropertyformgui', 'ilformpropertydispatchgui', 'ilInteractiveVideoRepositorySelectorInputGUI'),
			'handleExplorerCommand'
		);
		$explorer_gui->setId($post_var);

		$root_ref_id = new ilInteractiveVideoRepositorySelectorInputGUI(
			$plugin->txt($post_var),
			$post_var, $explorer_gui, false
		);

		$root_ref_id->setInfo($plugin->txt($post_var . '_info'));
		$form->addSubItem($root_ref_id);
	}

    /**
	 * @param \ilPropertyFormGUI $form
	 * @throws ilTemplateException
	 */
	public function showTutorInsertQuestionForm(ilPropertyFormGUI $form = NULL): void
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
        $this->addJavascriptAndCSSToTemplate($tpl);
		$tpl->setContent($form->getHTML());
	}

    /**
     * @throws ilTemplateException
     */
	public function insertQuestion(): void
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
            $start_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
            $this->objComment->setCommentTime($start_time);
			$comment_time_end = $form->getInput('comment_time_end');
            $end_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time_end));
            $this->objComment->setCommentTimeEnd($end_time);
			$this->objComment->setIsTutor(1);
            $this->objComment->setMarker('');
			$this->objComment->create();

			$this->performQuestionRefresh($this->objComment->getCommentId(), $form);

            $this->tpl->setOnScreenMessage("success", $this->lng->txt('saved_successfully'));
			$this->ctrl->redirect($this, 'editComments');
		}
		else
		{
			$form->setValuesByPost();
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('err_check_input'));
			$this->showTutorInsertQuestionForm($form);
		}
	}

    /**
	 * @param \ilPropertyFormGUI $form
	 * @throws ilTemplateException
	 */
	public function editQuestion(ilPropertyFormGUI $form = NULL): void
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
	 * @return array|void
	 * @throws ilTemplateException
	 */
	private function getQuestionFormValues(int $comment_id = 0)
	{
	    $values = array();

        $post = $this->http->wrapper()->post();
        $get = $this->http->wrapper()->query();
        if($comment_id == 0)
		{
            if($post->has('comment_id') || $get->has('comment_id')) {
                $comment_id = $post->retrieve('comment_id', $this->refinery->kindlyTo()->int());
                if($comment_id === 0) {
                    $comment_id = $get->retrieve('comment_id', $$this->refinery->kindlyTo()->int());
                }

                if($comment_id) {
                    $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('no_comment_id_given'), true);
                    return $this->editComments();
                }
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
		$values['show_best_solution']	    = $question_data['question_data']['show_best_solution'];
		$values['show_best_solution_text']  = $question_data['question_data']['show_best_solution_text'];
		$values['is_jump_wrong']			= $question_data['question_data']['is_jump_wrong'];
		$values['show_wrong_icon']			= $question_data['question_data']['show_wrong_icon'];
		$values['jump_wrong_ts']			= $question_data['question_data']['jump_wrong_ts'];
		$values['limit_attempts']			= $question_data['question_data']['limit_attempts'];
		$values['repeat_question']			= $question_data['question_data']['repeat_question'];
		$values['compulsory_question']		= $question_data['question_data']['compulsory_question'];
		$values['feedback_correct_obj']		= $question_data['question_data']['feedback_correct_ref_id'];
		$values['feedback_wrong_obj']		= $question_data['question_data']['feedback_wrong_ref_id'];
		$values['show_comment_field']		= $question_data['question_data']['reflection_question_comment'];
		$values['neutral_type']				= $question_data['question_data']['neutral_answer'];
//		$values['question_correct']			= $question_data['question_data']['question_correct']; //marko

		return $values;
	}

    /**
     *
     */
	public function confirmUpdateQuestion(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;
		$ilTabs->activateTab('editComments');

        $post = $this->http->wrapper()->post();

        if($post->has('comment_id')) {
            $comment_id = $post->retrieve('comment_id', $this->refinery->kindlyTo()->int());
        }
		$form_values = array();

		if($comment_id > 0 && !$chk =  SimpleChoiceQuestion::answerExists($comment_id))
		{
			$this->updateQuestion();
		}
		else
		{
            $form = $this->initQuestionForm();
            $form->checkInput();
			$confirm = new ilConfirmationGUI();
			$confirm->setFormAction($this->ctrl->getFormAction($this, 'updateQuestion'));
			$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_update_question'));

			$confirm->setCancel($this->lng->txt('cancel'), 'editComments');
			$confirm->setConfirm($this->lng->txt('update'), 'updateQuestion');
            global $DIC;
            $form = $DIC->http()->request()->getParsedBody();
            foreach($form as $key=>$value)
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

    /**
     * @throws ilTemplateException
     */
	public function updateQuestion(): void
	{
        global $DIC;
		$form = $this->initQuestionForm();
		if($DIC->http()->wrapper()->post()->has('form_values')) {
			//@todo .... very quick ... very wtf ....
			$post = unserialize($_POST['form_values']);
			$_FILES = unserialize($_REQUEST['form_files']);
		} else {
            $post = $DIC->http()->request()->getParsedBody();
        }

		if(is_array($post))
		{
			$comment_id = $post['comment_id'];
			if($comment_id > 0)
			{
				$this->objComment = new ilObjComment($comment_id);
			}
			$this->objComment->setCommentText($post['question_text']);
			$this->objComment->setInteractive((int)$post['is_interactive']);
			$this->objComment->setCommentTitle((string)$post['comment_title']);

			// calculate seconds
            $comment_time = $post['comment_time'];
            $start_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time));
            $this->objComment->setCommentTime($start_time);
            $comment_time_end = $post['comment_time_end'];
            $end_time = ilInteractiveVideoTimePicker::getSecondsFromString(ilInteractiveVideoPlugin::stripSlashesWrapping($comment_time_end));
            $this->objComment->setCommentTimeEnd($end_time);

			$this->objComment->update();

			$this->performQuestionRefresh($comment_id, $post);

            $this->tpl->setOnScreenMessage("success", $this->lng->txt('saved_successfully'));
			$this->editComments();
		}

	}

	/**
	 * @param $comment_id
	 */
	private function performQuestionRefresh($comment_id, $form): void
	{
        global $DIC;
		$question    = new SimpleChoiceQuestion($comment_id);
		$question->setCommentId($comment_id);

        $question->setType((int)$this->getValueFromFormOrArray('question_type', $form));

		if(is_array($_FILES) && count($_FILES) > 0 && array_key_exists('question_image', $_FILES))
		{
			$this->object->uploadImage($comment_id, $question, $_FILES['question_image']);
		}
		$post = $DIC->http()->request()->getParsedBody();
        if(array_key_exists('ffmpeg_thumb', $post))
		{
			$file = ilInteractiveVideoFFmpeg::moveSelectedImage($comment_id, $this->object->getId(), $post['ffmpeg_thumb']);
			$question->setQuestionImage($file);
		}
		if(array_key_exists('question_image_delete', $post))
		{
			ilInteractiveVideoFFmpeg::removeSelectedImage($question->getQuestionImage());
			$question->setQuestionImage(null);
		}

        $question->setQuestionText(ilInteractiveVideoPlugin::stripSlashesWrapping($this->getValueFromFormOrArray('question_text', $form)));
        $question->setFeedbackCorrect(ilInteractiveVideoPlugin::stripSlashesWrapping($this->getValueFromFormOrArray('feedback_correct', $form)));
        $question->setFeedbackOneWrong(ilInteractiveVideoPlugin::stripSlashesWrapping($this->getValueFromFormOrArray('feedback_one_wrong', $form)));

        $question->setLimitAttempts((int)$this->getValueFromFormOrArray('limit_attempts', $form));
        $question->setIsJumpCorrect((int)$this->getValueFromFormOrArray('is_jump_correct', $form));
        $question->setShowCorrectIcon((int)$this->getValueFromFormOrArray('show_correct_icon', $form));
        $question->setFeedbackCorrectId((int)$this->getValueFromFormOrArray('feedback_correct_obj', $form));
        $question->setFeedbackWrongId((int)$this->getValueFromFormOrArray('feedback_wrong_obj', $form));

        $question->setJumpCorrectTs((int)$this->getValueFromFormOrArray('jump_correct_ts', $form));

        $question->setIsJumpWrong((int)$this->getValueFromFormOrArray('is_jump_wrong', $form));
        $question->setShowWrongIcon((int)$this->getValueFromFormOrArray('show_wrong_icon', $form));
        $question->setJumpWrongTs((int)$this->getValueFromFormOrArray('jump_wrong_ts', $form));

        $question->setShowResponseFrequency((int)$this->getValueFromFormOrArray('show_response_frequency', $form));
        $question->setShowBestSolution((int)$this->getValueFromFormOrArray('show_best_solution', $form));
        $question->setShowBestSolutionText(ilInteractiveVideoPlugin::stripSlashesWrapping($this->getValueFromFormOrArray('show_best_solution_text', $form)));
        $question->setRepeatQuestion((int)$this->getValueFromFormOrArray('repeat_question', $form));
        $question->setCompulsoryQuestion((int)$this->getValueFromFormOrArray('compulsory_question', $form));
        $question->setReflectionQuestionComment((int)$this->getValueFromFormOrArray('show_comment_field', $form));
        $question->setNeutralAnswer((int)$this->getValueFromFormOrArray('neutral_type', $form));

        $question->deleteQuestionsIdByCommentId($comment_id);
        $qid = $question->create();

	}

    private function getValueFromFormOrArray(string $key, $form)
    {
        if(is_array($form)){
            if(array_key_exists($key, $form)){
                return $form[$key];
            }
        } elseif($form instanceof ilPropertyFormGUI) {
            return $form->getInput($key);
        }
        return '';
    }

    /**
	 * @throws ilTemplateException
	 */
	public function getAnswerDefinitionsJSON(): string
	{
        global $DIC;
		$simple_choice = new SimpleChoiceQuestion();
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
        $qid = $DIC->http()->wrapper()->query()->retrieve('comment_id', $DIC->refinery()->kindlyTo()->int());
		$question_id = $qid;
		$question = new ilTemplate("tpl.simple_questions.html", true, true, ilInteractiveVideoPlugin::getInstance()->getDirectory());
		if($question_id > 0)
		{
			$question->setVariable('JSON', $ajax_object->getAnswersForQuestionId($question_id));
			$question->setVariable('QUESTION_TYPE', $simple_choice->getTypeByQuestionId($question_id));
		}
		else
		{
			$question->setVariable('JSON', json_encode(array()));
			$question->setVariable('QUESTION_TYPE', 0);
		}

		return $question->get();
	}

    /**
     *
     */
	public function showResults(): void
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
		$tbl = new SimpleChoiceQuestionsTableGUI($this, 'showResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

    /**
     *
     */
	public function showMyResults(): void
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
		$tbl = new SimpleChoiceQuestionsUserTableGUI($this, 'showMyResults');
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

    /**
     *
     */
	public function showCompleteOverviewOverAllResults(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showCompleteOverviewOverAllResults');
		$simple = new SimpleChoiceQuestionStatistics();
		$data = $simple->getScoreForAllQuestionsAndAllUser($this->obj_id);
		$tbl = new SimpleChoiceQuestionsCompleteUserTableGUI($this, 'showCompleteResults', $data['question']);
		$tbl_data = $data['users'];
		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());

	}

    /**
     *
     */
	public function confirmDeleteUserResults(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showResults');
        $post = $this->http->wrapper()->post();
        $user_ids = [];
        if($post->has('user_id')) {
            $user_ids = $post->retrieve('user_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }
		if(!count($user_ids))
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'));
			$this->showResults();
			return;
		}
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteUserResults'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteUserResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showResults');

		foreach($user_ids as $user_id)
		{
			$login = ilObjUser::_lookupName($user_id);

			$confirm->addItem('user_id[]', $user_id, $login['firstname'].' '.$login['lastname']);
		}
		$tpl->setContent($confirm->getHTML());
	}

	public function deleteUserResults(): void
	{
        $post = $this->http->wrapper()->post();
        $user_ids = [];
        if($post->has('user_id')) {
            $user_ids = $post->retrieve('user_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }
		if(!count($user_ids))
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'));
			$this->showResults();
			return;
		}


		if(is_array($user_ids) && (count($user_ids) > 0))
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteUserResults($user_ids, $this->obj_id);
			$this->object->refreshLearningProgress();
            $this->tpl->setOnScreenMessage("success", ilInteractiveVideoPlugin::getInstance()->txt('results_successfully_deleted'));
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('invalid_user_ids'));
		}
		$this->showResults();
	}

	public function showQuestionsResults(): void
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
		$tbl = new SimpleChoiceQuestionsOverviewTableGUI($this, 'showQuestionsResults');

		$tbl->setData($tbl_data);
		$tpl->setContent($tbl->getHTML());
	}

    /**
     *
     */
	public function confirmDeleteQuestionsResults(): void
	{
		/**
		 * @var $tpl    ilTemplate
		 * @var $ilTabs ilTabsGUI
		 */
		global $tpl, $ilTabs;

		$this->setSubTabs('editComments');

		$ilTabs->activateTab('editComments');
		$ilTabs->activateSubTab('showQuestionsResults');
        $post = $this->http->wrapper()->post();
        $question_ids = [];
        if($post->has('question_id')) {
            $question_ids = $post->retrieve('question_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }

		if(!count($question_ids))
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}
		$confirm = new ilConfirmationGUI();
		$confirm->setFormAction($this->ctrl->getFormAction($this, 'deleteQuestionsResults'));
		$confirm->setHeaderText(ilInteractiveVideoPlugin::getInstance()->txt('sure_delete_results'));
		$confirm->setConfirm($this->lng->txt('confirm'), 'deleteQuestionsResults');
		$confirm->setCancel($this->lng->txt('cancel'), 'showQuestionsResults');

		foreach($question_ids as $question_id)
		{
		    $title = ilObjComment::getCommentTitleByQuestionId($question_id);
			$confirm->addItem('question_id[]', $question_id, $title);
		}

		$tpl->setContent($confirm->getHTML());
	}

    /**
     *
     */
	public function deleteQuestionsResults(): void
	{
        $post = $this->http->wrapper()->post();
        $question_ids = [];
        if($post->has('question_id')) {
            $question_ids = $post->retrieve('question_id', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->int()]));
        }
		if(!count($question_ids))
		{
            $this->tpl->setOnScreenMessage("failure", $this->lng->txt('select_one'));
			$this->showQuestionsResults();
			return;
		}

		if((count($question_ids) > 0))
		{
			$simple = new SimpleChoiceQuestion();
			$simple->deleteQuestionsResults($question_ids);
			$this->object->refreshLearningProgress();
            $this->tpl->setOnScreenMessage("success", ilInteractiveVideoPlugin::getInstance()->txt('results_successfully_deleted'));
		}
		else
		{
            $this->tpl->setOnScreenMessage("failure", ilInteractiveVideoPlugin::getInstance()->txt('invalid_question_ids'));
		}
		$this->showQuestionsResults();
	}
#endregion

#region AJAX
    /**
     *
     */
	public function getQuestionPerAjax(): void
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

    /**
     *
     */
	public function postAnswerPerAjax(): void
	{
        $post = $this->http->wrapper()->post();

		if( $post->has('qid'))
		{
            $qid = $post->retrieve('qid', $this->refinery->kindlyTo()->int());
            if(!SimpleChoiceQuestion::isLimitAttemptsEnabled($qid)){
                if($post->has('answer')) {
                    $answer = [];
                    $answer = $post->retrieve('answer', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->string()]));
                    $simple_choice = new SimpleChoiceQuestion();
                    $simple_choice->saveAnswer($qid, $answer);
                }
            }
            if(SimpleChoiceQuestion::existUserAnswerForQuestionId((int)$qid) == false)
            {
                $answer = [];
                $answer = $post->retrieve('answer', $this->refinery->kindlyTo()->tupleOf([$this->refinery->kindlyTo()->string()]));
                $simple_choice = new SimpleChoiceQuestion();
                $simple_choice->saveAnswer($qid, $answer);
            }
		}

		$this->object->refreshLearningProgress([$this->user->getId()]);

		$this->showFeedbackPerAjax();
		$this->callExit();
	}

	/**
	 *
	 */
	public function generateThumbnailsFromSourcePerAjax(): void
	{
		$tpl_json = ilInteractiveVideoPlugin::getInstance()->getTemplate('default/tpl.show_question.html', false, false);
        $post = $this->http->wrapper()->post();

		if($post->has('time'))
		{
			$time = $post->retrieve('time', $this->refinery->kindlyTo()->string());
		}
		else
		{
			$time = '00:00:00.0';
		}
		$path = CLIENT_WEB_DIR . '/xvid/xvid_'.$this->object->getId().'/images';
        ilFileUtils::makeDirParents($path);
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

	public function showFeedbackPerAjax(): void
	{
		$tpl_json = ilInteractiveVideoPlugin::getInstance()->getTemplate('default/tpl.show_question.html', false, false);
		$ajax_object   = new SimpleChoiceQuestionAjaxHandler();
        $post = $this->http->wrapper()->post();
        $qid = null;
        if($post->has('qid'))
        {
            $qid = $post->retrieve('qid', $this->refinery->kindlyTo()->int());
        }
		$feedback      = $ajax_object->getFeedbackForQuestion($qid);
		$tpl_json->setVariable('JSON', $feedback);
		$tpl_json->show("DEFAULT", false, true );
	}

	public function postVideoStartedPerAjax(): void
	{
		global $DIC;

		$this->object->trackReadEvent();
		$this->object->saveVideoStarted($this->obj_id, $DIC->user()->getId());
        $this->object->updateLearningProgressForActor();

		$this->callExit();
	}

	public function postVideoFinishedPerAjax(): void
	{
		global $ilUser;

        $this->object->saveVideoFinished($this->obj_id, $ilUser->getId());
        $this->object->updateLearningProgressForActor();

		$this->callExit();
	}

	protected function callExit(): void
	{
		exit();
	}
#endregion

#region EXPORT
    /**
     *
     */
	public function completeCsvExport(): void
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
		array_push($csv, ilCSVUtil::processCSVRow($head_row, TRUE, $separator) );
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
			array_push($csv, ilCSVUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($separator, $row) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
	}

    /**
     *
     */
	public function exportMyComments(): void
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
		array_push($head_row, $plugin->txt('reply_to'));

		array_push($csv, ilCSVUtil::processCSVRow($head_row, TRUE, $separator) );
		foreach ($data as $key => $row)
		{
			$csvrow = array();
			foreach ( $row as $type => $value)
			{
				array_push($csvrow, trim($value, '"'));
			}
			array_push($csv, ilCSVUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($separator, $row) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
	}

    /**
     *
     */
	public function exportAllComments(): void
	{
		global $lng;
		$plugin = ilInteractiveVideoPlugin::getInstance();

		$data = $this->object->getCommentsTableData(true, false, false, true);

		$csv = array();
		$separator = ";";

		$head_row = array();

		array_push($head_row, $lng->txt('id'));
		array_push($head_row, $lng->txt('time'));
		array_push($head_row, $plugin->txt('time_end') );
		array_push($head_row, $plugin->txt('user') );
		array_push($head_row, $this->lng->txt('login') );
		array_push($head_row, $this->lng->txt('firstname') );
		array_push($head_row, $this->lng->txt('lastname') );
		array_push($head_row, $this->lng->txt('email') );
		array_push($head_row, $plugin->txt('comment_title'));
		array_push($head_row, $plugin->txt('comment'));
		array_push($head_row, $plugin->txt('tutor'));
        array_push($head_row, $plugin->txt('interactive'));
		//array_push($head_row, $plugin->txt('compulsory'));
		array_push($head_row, $plugin->txt('type'));
		array_push($head_row, 'marker');
		array_push($head_row, $plugin->txt('reply_to'));
		//array_push($head_row, $plugin->txt('toc'));

		array_push($csv, ilCSVUtil::processCSVRow($head_row, TRUE, $separator) );

		foreach ($data as $key => $row)
		{
			$csvrow = array();
			foreach ( $row as $type => $value)
			{
				array_push($csvrow, trim($value, '"'));
			}
			array_push($csv, ilCSVUtil::processCSVRow($csvrow, TRUE, $separator));
		}
		$csvoutput = "";
		foreach ($csv as $row)
		{
			$csvoutput .= join($separator, $row) . "\n";
		}
		ilUtil::deliverData($csvoutput, $this->object->getTitle() .  ".csv");
	}
#endregion
    public static function _goto(array $a_target): void
	{
		/**
		 * @var $ilCtrl ilCtrl
		 * @var $ilAccess ilAccessHandler
		 */
		global $ilCtrl, $ilAccess, $lng, $DIC;

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
            $DIC->ui()->mainTemplate()->setOnScreenMessage("failure", sprintf($lng->txt("msg_no_perm_read_item"),
                ilObject::_lookupTitle(ilObject::_lookupObjId($ref_id))));
            ilObjectGUI::_gotoRepositoryRoot();
		}
	}
}
