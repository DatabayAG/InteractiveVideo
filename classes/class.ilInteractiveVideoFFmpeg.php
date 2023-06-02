<?php
require_once 'Services/MediaObjects/classes/class.ilFFmpeg.php';
require_once 'Services/WebAccessChecker/classes/class.ilWACSignedPath.php';

/**
 * Class ilInteractiveVideoFFmpeg
 */
class ilInteractiveVideoFFmpeg extends ilFFmpeg
{
	/**
	 * @param string $a_file
	 * @param string $a_target_filename
	 * @param string $a_target_dir
	 * @param $a_sec
	 * @return string
	 * @throws ilFFmpegException
	 */
    public static function extractImage(
        string $a_file,
        string $a_target_filename,
        string $a_target_dir = "",
        int $a_sec = 1
    ): string
	{
		$spi = pathinfo($a_file);
		$target_dir = ($a_target_dir != '') ? $a_target_dir : $spi['dirname'];

		ilUtil::makeDirParents($target_dir);
		$target_file = $target_dir.'/'.$a_target_filename;

		$cmd = ' -ss '.ilUtil::escapeShellArg($a_sec).' -y -i '.ilUtil::escapeShellArg($a_file).' -r 1 -f image2 -vframes 1 '.ilUtil::escapeShellArg($target_file);
		$ret = self::exec($cmd. ' 2>&1');
		self::$last_return = $ret;

		if (is_file($target_file))
		{
			return $target_file;
		}
		else
		{
			require_once './Services/MediaObjects/exceptions/class.ilFFmpegException.php';
			throw new ilFFmpegException('It was not possible to extract an image from '.basename($a_file).'.');
		}
	}

    /**
     * @param        $a_file
     * @param string $a_target_filename
     * @param string $a_target_dir
     * @param int    $a_sec
     * @param bool   $return_json
     * @return false|string
     * @throws ilFFmpegException
     * @throws ilWACException
     */
	static function extractImageWrapper($a_file, $a_target_filename = '', $a_target_dir = '', $a_sec = 1, $return_json = false)
	{
		$json_container = array();

		$sec =  self::parseTimeString($a_sec);

		if($seconds_split = preg_split('/\./', $sec))
		{
			for($i = 0; $i <= 9; $i = $i+3)
			{
				$sec = $seconds_split[0] . '.' .$i;
				$file = self::extractImage($a_file, $i . '.jpg', $a_target_dir, $sec);
				$json_container[] = array('time' => $sec, 'img' => ilWACSignedPath::signFile($file . '?' . rand()));
			}
		}
		
		if($return_json)
		{
			return json_encode($json_container);
		}
	}

	/**
	 * @param $time
	 * @return int|string
	 */
	protected static function parseTimeString($time)
	{
		if($matches = preg_split('/:/', $time))
		{
			if(is_array($matches) && sizeof($matches) == 3)
			{
				return self::escapeHourMinutesSeconds($matches[0], $matches[1], $matches[2]);
			}
			else if(is_array($matches) && sizeof($matches) == 2)
			{
				return self::escapeHourMinutesSeconds('00', $matches[0], $matches[1]);
			}
		}
		return $time;
	}

	/**
	 * @param $hours
	 * @param $minutes
	 * @param $seconds
	 * @return string
	 */
	protected static function escapeHourMinutesSeconds($hours, $minutes, $seconds)
	{
		$hours			= (int) $hours;
		$minutes		= (int) $minutes;
		return self::fillZeroIfSmallerTen($hours) . ':' . self::escapeMinutesSeconds($minutes, $seconds);
	}

	/**
	 * @param $minutes
	 * @param $seconds
	 * @return string
	 */
	protected static function escapeMinutesSeconds($minutes, $seconds)
	{
		$minutes		= (int) $minutes;
		return self::fillZeroIfSmallerTen($minutes) . ':' . self::escapeSeconds($seconds);
	}

	/**
	 * @param $seconds
	 * @return string
	 */
	protected static function escapeSeconds($seconds)
	{
		$milliseconds	= 0;
		if($seconds_split = preg_split('/\./', $seconds))
		{
			$seconds = (int)  $seconds_split[0];
			$milliseconds = (int) $seconds_split[1];
		}
		else
		{
			$seconds = (int) $seconds;
		}
		return self::fillZeroIfSmallerTen($seconds) . '.' . $milliseconds;
	}

	/**
	 * @param int $comment_id
	 * @param int $id
	 * @param string $path_org
	 * @return string
	 */
	public static function moveSelectedImage($comment_id, $id, $path_org)
	{
		$file_extension	= pathinfo($path_org, PATHINFO_EXTENSION);
		if($file_extension != '' && preg_split('/\?/', $file_extension))
		{
			$clean_extension = preg_split('/\?/', $file_extension);
			if(is_array($clean_extension) && count($clean_extension) > 1)
			{
				$file_extension = $clean_extension[0];
			}
			$path_org = preg_split('/\?/', $path_org);
			if(is_array($path_org) && count($path_org) > 1)
			{
				$path_org = $path_org[0];
			}
		}
		$clean_name		= $comment_id .'.' . $file_extension;
		$part			= 'xvid_' . $id . '/' . $comment_id . '/images';
		$path			= xvidUtils::ensureFileSavePathExists($part);
		$original		= "org_".$id."_".$clean_name;
		$new_file		= $path.$original;
		if(@copy($path_org, $new_file))
		{
			chmod($new_file, 0770);
			ilUtil::delDir(dirname($path_org));
			return $new_file;
		}
	}

	/**
	 * @param string $path_to_file
	 */
	public static function removeSelectedImage($path_to_file)
	{
		if(file_exists($path_to_file))
		{
			unlink($path_to_file);
		}
	}

	/**
	 * @param int $number
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
}