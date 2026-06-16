<?php

class ilInteractiveVideoModalExtension
{
    protected string $heading = "";
    protected string $body = "";
    protected string $id = "";

    public const TYPE_LARGE = "large";
    public const TYPE_MEDIUM = "medium";
    public const TYPE_SMALL = "small";
    const TYPE_XL = 'xlarge';

    protected string $type = self::TYPE_MEDIUM;
    protected array $buttons = array();

    /**
     * Get HTML
     * @return string html
     * @throws ilTemplateException
     */
    public function getHTML(): string
	{
        $tpl = new ilTemplate("tpl.modal.html", true, true, 'public/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/');
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
     * @return ilInteractiveVideoModalExtension panel instance
     */
    public static function getInstance(): self
	{
		return new ilInteractiveVideoModalExtension();
	}

    public function setId(string $a_val): void
    {
        $this->id = $a_val;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setHeading(string $a_val): void
    {
        $this->heading = $a_val;
    }


    public function getHeading(): string
    {
        return $this->heading;
    }

    public function setBody(string $a_val): void
    {
        $this->body = $a_val;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    /**
     * Set type
     *
     * @param string $a_val type const ilInteractiveVideoModalExtension::TYPE_SMALL|ilInteractiveVideoModalExtension::TYPE_MEDIUM|ilInteractiveVideoModalExtension::TYPE_LARGE
     */
    public function setType(string $a_val): void
    {
        $this->type = $a_val;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function addButton(ilButtonBase $but): void
    {
        $this->buttons[] = $but;
    }

    /**
     * Get buttons
     * @return ilButtonBase[]
     */
    public function getButtons(): array
    {
        return $this->buttons;
    }
    public static function initJS(ilGlobalTemplateInterface $a_main_tpl = null): void
    {
        global $DIC;

        $tpl = $a_main_tpl ?? $DIC["tpl"];

        $tpl->addJavaScript("assets/js/LegacyModal.js");
    }
}
