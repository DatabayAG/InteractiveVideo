<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */


/**
 * Class xvidUtils
 *
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class xvidUtils 
{

	/**
	 * @param $seconds
	 * @return mixed
	 */
	public static function timespanArray( $seconds )
	{
		$time = array();
		if(!is_array($seconds))
		{
			$td['s'] = $seconds % 60;

			$td['m'] = (($seconds - $td['sec']) / 60) % 60;

			$td['h'] = (((($seconds - $td['sec']) / 60) -
						$td['min']) / 60) % 24;

			foreach($td as $key => $value)
			{
				$time[$key] = sprintf("%02d", $value);
			}
			return $time;
		}
		else
		{
			foreach($seconds['time'] as $key => $value)
			{
				$time[$key] = sprintf("%02d", $value);
			}
			return $time;
		}
	}

	/**
	 * @param $txt
	 * @param $name
	 * @return ilTextAreaInputGUI
	 */
	public static function constructTextAreaFormElement($txt, $name)
	{
		$text_area = new ilTextAreaInputCkeditorGUI(ilInteractiveVideoPlugin::getInstance()->txt($txt), $name);
		return $text_area;
	}

	/**
	 * @param string $txt
	 * @return string
	 */
	public static function replaceLatexWithImage($txt)
	{
		$txt = ilUtil::prepareTextareaOutput($txt, true, true);
		return $txt;
	}
}
