<?php
use enshrined\svgSanitize\Sanitizer;
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
		$time = [];
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
	 * @return string
	 */
	public static function getTimeStringFromSeconds($seconds, bool $text_instead_of_null_string = false, bool $empty_string_instead_of_null = false)
	{
		$s = $seconds % 60;
		$m = (($seconds - $s) / 60) % 60;
		$h = (((($seconds - $s) / 60) - $m) / 60) % 24;

		if($seconds == 0 && $text_instead_of_null_string && !$empty_string_instead_of_null)
		{
			return 'n.n.';
		}
		else if($seconds == 0 && $empty_string_instead_of_null)
		{
			return '';
		}
		else
		{
			return self::fillZeroIfSmallerTen($h) . ':' . self::fillZeroIfSmallerTen($m) . ':' . self::fillZeroIfSmallerTen($s);
		}
	}

    /**
     * @param $number
     * @return string
     */
	protected static function fillZeroIfSmallerTen($number)
	{
		if($number < 10)
		{
			return '0' . $number;
		}

		return $number;
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
	 */
	public static function constructTextAreaFormElement(string $txt, $name): \ilTextAreaInputCkeditorGUI
	{
		return new ilTextAreaInputCkeditorGUI(ilInteractiveVideoPlugin::getInstance()->txt($txt), $name);
	}

    /**
	 * @param $path
	 */
	public static function ensureFileSavePathExists($path): string
	{
		$path = ilFileUtils::getWebspaceDir() . self::INTERACTIVE_VIDEO . $path;
		if( ! is_dir($path))
		{
            ilFileUtils::makeDirParents($path);
		}
		return $path .'/';
	}

	public static function secureSvg(string $svg): string
	{
		if(file_exists('./Services/MediaObjects/lib/svg-sanitizer-master/src/Sanitizer.php'))
		{
			$sanitizer = new Sanitizer();
			$svg = $sanitizer->sanitize($svg);
		}
		return $svg;
	}
}
