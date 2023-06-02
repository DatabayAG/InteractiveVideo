<?php

require_once 'Services/UIComponent/Modal/classes/class.ilModalGUI.php';

class ilInteractiveVideoModalExtension extends ilModalGUI
{
	const TYPE_XL = 'xlarge';

	/**
	 * Get HTML
	 *
	 * @return string html
	 */
    public function getHTML(): string
	{
		$tpl = new ilTemplate("tpl.modal.html", true, true, "Services/UIComponent/Modal");

		if (count($this->getButtons()) > 0)
		{
			foreach ($this->getButtons() as $b)
			{
				$tpl->setCurrentBlock("button");
				$tpl->setVariable("BUTTON", $b->render());
				$tpl->parseCurrentBlock();
			}
			$tpl->setCurrentBlock("footer");
			$tpl->parseCurrentBlock();
		}

		$tpl->setVariable("HEADING", $this->getHeading());

		$tpl->setVariable("MOD_ID", $this->getId());
		$tpl->setVariable("BODY", $this->getBody());

		switch ($this->getType())
		{
			case self::TYPE_LARGE:
				$tpl->setVariable("CLASS", "modal-lg");
				break;

			case self::TYPE_SMALL:
				$tpl->setVariable("CLASS", "modal-sm");
				break;

			case self::TYPE_XL:
				$tpl->setVariable("CLASS", "modal-xl");
				break;
		}

		return $tpl->get();
	}

	/**
	 * Get instance
	 *
	 * @return ilModalGUI panel instance
	 */
    public static function getInstance(): self
	{
		return new ilInteractiveVideoModalExtension();
	}
}