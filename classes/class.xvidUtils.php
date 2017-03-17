<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */
require_once 'Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo/classes/Form/class.ilTextAreaInputCkeditorGUI.php';

/**
 * Class xvidUtils
 *
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class xvidUtils 
{
	
	const INTERACTIVE_VIDEO = '/xvid/';

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
	 * @param      $seconds
	 * @param bool $text_instead_of_null_string
	 * @return string
	 */
	public static function timeSpanString( $seconds, $text_instead_of_null_string = false)
	{

			$s = $seconds % 60;
			$m = (($seconds - $s) / 60) % 60;
			$h = (((($seconds - $s) / 60) - $m) / 60) % 24;

			if($seconds == 0 && $text_instead_of_null_string)
			{
				return 'n.n.';
			}
			else
			{
				if($h > 10)
				{
					$h = '0' . $h;
				}
				return $h . ':' . $m . ':' . $s ;
			}
	}

	/**
	 * @param $value
	 * @return string
	 */
	public static function yesNoString( $value)
	{

		global $lng;
		if($value == 1)
		{
			return $lng->txt('yes');
		}
		else
		{
			return $lng->txt('no');
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
	
	public static function ensureFileSavePathExists($path)
	{
		$path = ilUtil::getWebspaceDir() . self::INTERACTIVE_VIDEO . $path;
		if( ! is_dir($path))
		{
			ilUtil::makeDirParents($path);
		}
		return $path .'/';
	}
}
