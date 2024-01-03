<?php

class ilTextAreaInputCkeditor
{
	/**
	 * @var ilInteractiveVideoPlugin
	 */
	protected $plugin;

	/**
	 * ilTextAreaInputCkeditor constructor.
	 * @param ilInteractiveVideoPlugin|ilPlugin $plugin
	 */
	public function __construct($plugin)
	{
		$this->plugin = $plugin;
	}

    /**
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 */
	protected function getCkEditorTemplate(): \ilTemplate
	{
		$ck_editor      = new ilTemplate("tpl.ckeditor_mathjax.html", true, true, $this->plugin->getDirectory());

		$mathJaxSetting = $this->addMathJaxToGlobalTemplate();
		if($mathJaxSetting->get('enable'))
		{
			$ck_editor->setVariable('MATH_JAX_CONFIG', $mathJaxSetting->get('path_to_mathjax'));
		}

		return $ck_editor;
	}

	public function addMathJaxToGlobalTemplate(): \ilSetting
	{
		/**
		 * @var $tpl ilTemplate
		 */
		global $tpl;

		$mathJaxSetting = new ilSetting('MathJax');
		if($mathJaxSetting->get('enable'))
		{
			$tpl->addJavaScript($mathJaxSetting->get('path_to_mathjax'));
		}
		return $mathJaxSetting;
	}

    /**
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 */
	public function appendCkEditorToTemplate(\ilTemplate $custom_tpl): void
	{
		$ck_editor = $this->getCkEditorTemplate();
		$ck_editor->touchBlock('small_editor');
		$custom_tpl->setVariable('CK_CONFIG', $ck_editor->get());
	}

    /**
	 * @throws ilSystemStyleException
	 * @throws ilTemplateException
	 */
	public function appendCkEditorMathJaxSupportToForm(\ilPropertyFormGUI $a_form): void
	{
		$ck_editor = $this->getCkEditorTemplate();
		$custom = new ilCustomInputGUI();
		$custom->setHtml($ck_editor->get());
		$a_form->addItem($custom);
	}
}