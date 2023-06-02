<?php
require_once './Services/Form/classes/class.ilSubEnabledFormPropertyGUI.php';
/**
 * Class ilInteractiveVideoTimePicker
 */
class ilInteractiveVideoTimePicker extends ilSubEnabledFormPropertyGUI
{
	/**
	 * @var string
	 */
	protected $value;

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

	/**
	 * ilInteractiveVideoTimePicker constructor.
	 * @param string $a_title
	 * @param string $a_id
	 */
	public function __construct($a_title = "", $a_id = "")
	{
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
		if(!is_array($_POST[$this->getPostVar()]))
		{
			$_POST[$this->getPostVar()] = $this->getSecondsFromString(ilUtil::stripSlashes($_POST[$this->getPostVar()]));
		}
		return $this->checkSubItemsInput();
	}

	/**
	 * @param $a_value
	 */
	public function setValue($a_value)
	{
		$this->value = $a_value;
	}

	/**
	 * @return string
	 */
	public function getValue()
	{
		return $this->value;
	}

	/**
	 * @return string
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * @param string $id
	 */
	public function setId($id)
	{
		$this->id = $id;
	}

	/**
	 * @return string
	 */
	public function render()
	{
		$my_tpl = new ilTemplate('tpl.time_picker.html', true, true, 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/');
		$value = $this->getValue();
		$my_tpl->setVariable("VALUE", $this->getTimeStringFromSeconds($value));
		$my_tpl->setVariable("ID", $this->getId());

		return $my_tpl->get();
	}

	/**
	 * @param ilTemplate $a_tpl
	 */
	public function insert($a_tpl)
	{
		$a_tpl->setCurrentBlock("prop_generic");
		$a_tpl->setVariable("PROP_GENERIC", $this->render());
		$a_tpl->parseCurrentBlock();
	}

	/**
	 * @param $a_values
	 */
	public function setValueByArray($a_values)
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

	/**
	 * @param string $comment_time
	 * @return int
	 */
	public static function getSecondsFromString($comment_time)
	{
		$seconds = 0;
		$comment_time = preg_split('/:/', $comment_time);
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
	public static function getTimeStringFromSeconds($seconds)
	{
		return gmdate('H:i:s', $seconds);
	}
}