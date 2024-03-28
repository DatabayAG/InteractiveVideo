<?php
/**
 * Class ilInteractiveVideoTimePicker
 */
class ilInteractiveVideoTimePicker extends ilSubEnabledFormPropertyGUI
{
	/**
	 * @var string
	 */
	protected $value = "";

	/**
	 * @var string
	 */
    protected string $title = "";

	/**
	 * @var string
	 */
    protected string $info = "";

	/**
	 * @var string
	 */
	protected $id;

    protected $dic;

	/**
	 * ilInteractiveVideoTimePicker constructor.
	 * @param string $a_title
	 * @param string $a_id
	 */
	public function __construct(string $a_title = "", string $a_id = "")
	{
        global $DIC;
        $this->dic = $DIC;
		parent::__construct($a_title, $a_id);
		$this->setTitle($a_title);
		$this->setId($a_id);
		$this->setType("interactive_video_time_picker");
	}

	/**
	 * @return bool
	 */
    public function checkInput(): bool
	{
        if($this->dic->http()->wrapper()->post()->has($this->getPostVar()))
        {
            $post = $this->dic->http()->wrapper()->post()->retrieve($this->getPostVar(), $this->dic->refinery()->kindlyTo()->string());
            if($this->dic->http()->wrapper()->post()->has($this->getPostVar())){
                $post = $this->dic->http()->wrapper()->post()->retrieve($this->getPostVar(), $this->dic->refinery()->kindlyTo()->string());
            }
        }

		return $this->checkSubItemsInput();
	}

    /**
     * @param string $a_value
     */
	public function setValue(string $a_value): void
	{
		$this->value = $a_value;
	}

	public function getValue(): string
	{
		return $this->value;
	}

	public function getId(): string
	{
		return $this->id;
	}

	public function setId(string $id): void
	{
		$this->id = $id;
	}

    /**
     * @throws ilTemplateException
     */
    public function render(): string
	{
		$my_tpl = new ilTemplate('tpl.time_picker.html', true, true, 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/');
		$value = $this->getValue();
        if($value === "") {
            $value = 0;
        }

		$my_tpl->setVariable("VALUE", $value);
		$my_tpl->setVariable("ID", $this->getId());

		return $my_tpl->get();
	}

    /**
     * @throws ilTemplateException
     */
    public function insert(ilTemplate $a_tpl): void
	{
		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $this->render());
		$a_tpl->parseCurrentBlock();
	}

	/**
	 * @param $a_values
	 */
	public function setValueByArray($a_values): void
	{
		if ($this->getPostVar() && isset($a_values[$this->getPostVar()]))
		{
			$this->setValue($a_values[$this->getPostVar()]);
		}
		foreach($this->getSubItems() as $item)
		{
			$item->setValueByArray($a_values);
		}
	}

	public static function getSecondsFromString(string $comment_time): int
	{
		$seconds = 0;
		$comment_time = explode(':', $comment_time);
		if(is_array($comment_time) && sizeof($comment_time) == 3)
		{
			$seconds = ((int)$comment_time[0] * 3600) + ((int)$comment_time[1] * 60) + (int)$comment_time[2];
		}
		return $seconds;
	}

	/**
	 * @param $seconds
	 * @return false|string
	 */
	public static function getTimeStringFromSeconds($seconds): string
	{
        $hour = floor($seconds / 3600);
        $min = floor($seconds / 60 );
        $sec = floor($seconds % 60);
        return sprintf('%02d:%02d:%02d', $hour, $min, $sec);
	}
}
