<?php

require_once 'Services/Form/classes/class.ilImageFileInputGUI.php';
require_once 'Services/UIComponent/Modal/classes/class.ilModalGUI.php';

class ilInteractiveVideoPreviewPicker extends ilImageFileInputGUI
{
	/**
	 * @var bool
	 */
	protected $canExtractImages = true;

	/**
	 * @var string
	 */
	protected $path_to_video;

	/**
	 * @param ilTemplate $a_tpl
	 */
	function insert($a_tpl)
	{
		parent::insert($a_tpl);

		if($this->isCanExtractImages() && $this->getPathToVideo() != '' && file_exists($this->getPathToVideo())
			&& defined("PATH_TO_FFMPEG") && PATH_TO_FFMPEG != ''
		)
		{
			$this->supportImageExtractionFromVideo($a_tpl);
		}
	}

	/**
	 * @param ilTemplate $a_tpl
	 */
	public function supportImageExtractionFromVideo($a_tpl)
	{
		global $tpl, $ilCtrl;
		$tpl->addJavaScript('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/js/form/InteractiveVideoPreviewPicker.js');

		$link = ilLinkButton::getInstance();
		$link->setCaption(ilInteractiveVideoPlugin::getInstance()->txt('extract'), false);
		$link->setId('ffmpeg_extract');
		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $link->render());
		$a_tpl->parseCurrentBlock();

		$this->addModalToTemplate($a_tpl, $ilCtrl);

		$hidden = new ilHiddenInputGUI('extract_file_path');
		$hidden->setValue($this->getPathToVideo());
		$hidden->insert($a_tpl);
	}

	/**
	 * @param ilTemplate $a_tpl
	 * @param ilCtrl $ilCtrl
	 */
	protected function addModalToTemplate($a_tpl, $ilCtrl)
	{
		$modal = ilModalGUI::getInstance();
		$modal->setId('ffmpeg_extract_modal');
		$modal->setType(ilModalGUI::TYPE_LARGE);
		$modal->setHeading(ilInteractiveVideoPlugin::getInstance()->txt('extract'));
		$video_tpl = new ilTemplate("tpl.ffmpeg_modal.html", false, false, 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/');

		$time      = new ilInteractiveVideoTimePicker('ffmpeg_time_picker', 'ffmpeg_time_picker');
		$video_tpl->setVariable('AJAX_URL', $ilCtrl->getLinkTarget(new ilObjInteractiveVideoGUI(), 'generateThumbnailsFromSourcePerAjax', '', true, false));
		$video_tpl->setVariable('TIME_PICKER', $time->render());

		$action = ilLinkButton::getInstance();
		$action->setCaption(ilInteractiveVideoPlugin::getInstance()->txt('extract'), false);
		$action->setId('generate_ffmpeg');
		$video_tpl->setVariable('ACTION_BUTTON', $action->render());
		$video_tpl->setVariable('USE_AS_QUESTION_IMAGE', ilInteractiveVideoPlugin::getInstance()->txt('use_this_image'));
		$modal->setBody($video_tpl->get());

		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $modal->getHTML());
		$a_tpl->parseCurrentBlock();
	}

	/**
	 * @return bool
	 */
	public function isCanExtractImages()
	{
		return $this->canExtractImages;
	}

	/**
	 * @param bool $canExtractImages
	 */
	public function setCanExtractImages($canExtractImages)
	{
		$this->canExtractImages = $canExtractImages;
	}

	/**
	 * @return mixed
	 */
	public function getPathToVideo()
	{
		return $this->path_to_video;
	}

	/**
	 * @param mixed $path_to_video
	 */
	public function setPathToVideo($path_to_video)
	{
		$this->path_to_video = $path_to_video;
	}

}