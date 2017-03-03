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
	 * @param string
	 */
	
	protected $path_to_video;

	function insert($a_tpl)
	{
		parent::insert($a_tpl);

		if($this->isCanExtractImages() && $this->getPathToVideo() != '' && file_exists($this->getPathToVideo()))
		{
			$this->supportImageExtractionFromVideo($a_tpl);
		}
	}

	/**
	 * @param ilTemplate $a_tpl
	 */
	public function supportImageExtractionFromVideo($a_tpl)
	{
		global $tpl;
		$tpl->addJavaScript('Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/js/Form/InteractiveVideoPreviewPicker.js');

		$link = ilLinkButton::getInstance();
		$link->setCaption(ilInteractiveVideoPlugin::getInstance()->txt('extract'), false);
		$link->setId('ffmpeg_extract');
		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $link->render());
		$a_tpl->parseCurrentBlock();
		$modal = ilModalGUI::getInstance();
		$modal->setId('ffmpeg_extract_modal');
		$modal->setType(ilModalGUI::TYPE_LARGE);
		$modal->setHeading('fsdfsf');
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