<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Services/Form/classes/class.ilPropertyFormGUI.php';
require_once 'Services/Form/classes/class.ilDateTimeInputGUI.php';

/**
 * Class ilObjInteractiveVideoGUI
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilTimeInputGUI extends ilDateTimeInputGUI
{
	protected $mode = null;
	protected $date_obj = null;
	protected $date;
	protected $showdate = true;
	protected $time = "00:00:00";
	protected $showtime = false;
	protected $showseconds = false;
	protected $minute_step_size = 1;
	protected $show_empty = false;
	protected $startyear = '';

	protected $activation_title = '';
	protected $activation_post_var = '';

	const MODE_SELECT = 1;
	const MODE_INPUT = 2;

	/**
	 * Constructor
	 * @param    string $a_title   Title
	 * @param    string $a_postvar Post Variable
	 */
	function __construct($a_title = "", $a_postvar = "")
	{
		parent::__construct($a_title, $a_postvar);
		$this->setType("datetime");
		$this->setMode(self::MODE_SELECT);
	}

	/**
	 * Set Show Date Information.
	 * @param    boolean $a_showdate Show Date Information
	 */
	function setShowDate($a_showdate)
	{
		$this->showdate = $a_showdate;
	}

	/**
	 * Get Show Date Information.
	 * @return   boolean Show Date Information
	 */
	function getShowDate()
	{
		return $this->showdate;
	}

	/**
	 * Set minute step size
	 * E.g 5 => The selection will only show 00,05,10... minutes
	 * @param int minute step_size 1,5,10,15,20...
	 */
	public function setMinuteStepSize($a_step_size)
	{
		$this->minute_step_size = $a_step_size;
	}

	/**
	 * Get minute step size
	 * @access public
	 */
	public function getMinuteStepSize()
	{
		return $this->minute_step_size;
	}

	/**
	 * Set Show Seconds.
	 * @param    boolean $a_showseconds Show Seconds
	 */
	function setShowSeconds($a_showseconds)
	{
		$this->showseconds = $a_showseconds;
	}

	/**
	 * Get Show Seconds.
	 * @return   boolean Show Seconds
	 */
	function getShowSeconds()
	{
		return $this->showseconds;
	}

	/**
	 * Set value by array
	 * @param    array $a_values value array
	 */
	function setValueByArray($a_values)
	{
		if(isset($a_values[$this->getPostVar()]))
		{
			$time_array = xvidUtils::timespanArray($a_values[$this->getPostVar()]);

			$this->setDate(new ilDateTime(date('Y-m-d', time()) . ' ' . $time_array['h'] . ':' . $time_array['i'] . ':' . $time_array['s'],
				IL_CAL_DATETIME, 0));
		}

		if($this->activation_post_var)
		{
			$this->activation_checked = (bool)$a_values[$this->activation_post_var];
		}

		foreach($this->getSubItems() as $item)
		{
			$item->setValueByArray($a_values);
		}
	}

	/**
	 * Check input, strip slashes etc. set alert, if input is not ok.
	 * @return   boolean     Input ok, true/false
	 */
	function checkInput()
	{
		if($this->getDisabled())
		{
			return true;
		}

		$post = $_POST[$this->getPostVar()];

		// empty date valid with input field
		if(!$this->getRequired() && $this->getMode() == self::MODE_INPUT && $post["date"] == "")
		{
			return true;
		}

		if($this->getMode() == self::MODE_SELECT)
		{
			if($this->getShowTime())
			{
				$post["time"]["h"] = ilUtil::stripSlashes($post["time"]["h"]);
				$post["time"]["m"] = ilUtil::stripSlashes($post["time"]["m"]);
				$post["time"]["s"] = ilUtil::stripSlashes($post["time"]["s"]);
				$dt['hours']       = (int)$post['time']['h'];
				$dt['minutes']     = (int)$post['time']['m'];
				$dt['seconds']     = (int)$post['time']['s'];
			}
		}
		else
		{
			$post["time"]  = ilUtil::stripSlashes($post["time"]);
			$time          = explode(":", $post["time"]);
			$dt['hours']   = (int)$time[0];
			$dt['minutes'] = (int)$time[1];
			$dt['seconds'] = (int)$time[2];
		}

		if($dt['hours'] > 23 || $dt['minutes'] > 59 || $dt['seconds'] > 59)
		{
			$dt = false;
		}
		return (bool)$dt;
	}

	/**
	 * Insert property html

	 */
	function render()
	{
		global $lng;

		$tpl = new ilTemplate("tpl.prop_datetime.html", true, true, "Services/Form");

		$lng->loadLanguageModule("jscalendar");
		require_once("./Services/Calendar/classes/class.ilCalendarUtil.php");
		ilCalendarUtil::initJSCalendar();

		if(strlen($this->getActivationPostVar()))
		{
			$tpl->setCurrentBlock('prop_date_activation');
			$tpl->setVariable('CHECK_ENABLED_DATE', $this->getActivationPostVar());
			$tpl->setVariable('TXT_DATE_ENABLED', $this->activation_title);
			$tpl->setVariable('CHECKED_ENABLED', $this->activation_checked ? 'checked="checked"' : '');
			$tpl->setVariable('CHECKED_DISABLED', $this->getDisabled() ? 'disabled="disabled" ' : '');
			$tpl->parseCurrentBlock();
		}

		if($this->getMode() == self::MODE_SELECT)
		{
			if(is_a($this->getDate(), 'ilDate'))
			{
				$date_info = $this->getDate()->get(IL_CAL_FKT_GETDATE, '', 'UTC');
			}
			elseif(is_a($this->getDate(), 'ilDateTime'))
			{
				$date_info = $this->getDate()->get(IL_CAL_FKT_GETDATE, '', 0);
			}
			else
			{
				$timestamp = mktime(0, 0, 0, 1, 1, 2015);
				$this->setDate(new ilDateTime($timestamp, IL_CAL_UNIX));
				$date_info = $this->getDate()->get(IL_CAL_FKT_GETDATE, '', 0);
			}

			// display invalid input again
			if(is_array($this->invalid_input))
			{
				$date_info['year'] = $this->invalid_input['y'];
				$date_info['mon']  = $this->invalid_input['m'];
				$date_info['mday'] = $this->invalid_input['d'];
			}
		}

		if($this->getShowTime())
		{
			if($this->getMode() == self::MODE_INPUT)
			{
				$value = $this->getDate();
				$tpl->setCurrentBlock("prop_time_input_field");
				$tpl->setVariable("DATE_ID", $this->getPostVar());
				$tpl->setVariable("TIME_VALUE", $value);
				$tpl->setVariable("DISABLED", $this->getDisabled() ? " disabled=\"disabled\"" : "");
				$tpl->parseCurrentBlock();
			}

			$tpl->setCurrentBlock("prop_time");

			if($this->getMode() == self::MODE_SELECT)
			{
				$tpl->setVariable("TIME_SELECT",
					ilUtil::makeTimeSelect($this->getPostVar() . "[time]", !$this->getShowSeconds(),
						$date_info['hours'], $date_info['minutes'], $date_info['seconds'],
						true, array('minute_steps' => $this->getMinuteStepSize(),
									'disabled'     => $this->getDisabled())));
			}

			$tpl->setVariable("TXT_TIME", $this->getShowSeconds()
				? "(" . $lng->txt("hh_mm_ss") . ")"
				: "(" . $lng->txt("hh_mm") . ")");

			$tpl->parseCurrentBlock();
		}
		return $tpl->get();
	}
}
