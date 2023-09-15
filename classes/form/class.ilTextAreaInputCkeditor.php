<?php

class ilTextAreaInputCkeditor
{
	/**
	 * @var ilInteractiveVideoPlugin
	 */
	protected $plugin;

	/**
	 * ilTextAreaInputCkeditor constructor.
	 * @param ilInteractiveVideoPlugin $plugin
	 */
	public function __construct($plugin)
	{
		$this->plugin = $plugin;
	}

    /**
     * @return ilTemplate
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	protected function getCkEditorTemplate()
	{
		$ck_editor      = new ilTemplate("tpl.ckeditor_mathjax.html", true, true, $this->plugin->getDirectory());

		$mathJaxSetting = $this->addMathJaxToGlobalTemplate();
		if($mathJaxSetting->get('enable'))
		{
			$ck_editor->setVariable('MATH_JAX_CONFIG', $mathJaxSetting->get('path_to_mathjax'));
		}

		return $ck_editor;
	}

	/**
	 * @return ilSetting
	 */
	public function addMathJaxToGlobalTemplate()
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
     * @param ilTemplate $custom_tpl
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	public function appendCkEditorToTemplate($custom_tpl)
	{
		$ck_editor = $this->getCkEditorTemplate();
		$ck_editor->touchBlock('small_editor');
		$custom_tpl->setVariable('CK_CONFIG', $ck_editor->get());
	}

    /**
     * @param ilPropertyFormGUI $a_form
     * @throws ilSystemStyleException
     * @throws ilTemplateException
     */
	public function appendCkEditorMathJaxSupportToForm($a_form)
	{
		$ck_editor = $this->getCkEditorTemplate();
		$custom = new ilCustomInputGUI();
		$custom->setHtml($ck_editor->get());
		$a_form->addItem($custom);
	}
}