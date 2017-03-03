<?php
require_once 'Services/MediaObjects/classes/class.ilFFmpeg.php';

/**
 * Class ilInteractiveVideoFFmpeg
 */
class ilInteractiveVideoFFmpeg extends ilFFmpeg
{
	/**
	 * @param string $a_file
	 * @param string $a_target_filename
	 * @param string $a_target_dir
	 * @param int    $a_sec
	 * @return string
	 * @throws ilFFmpegException
	 */
	static function extractImage($a_file, $a_target_filename, $a_target_dir = '', $a_sec = 1)
	{
		$spi = pathinfo($a_file);
		$target_dir = ($a_target_dir != '') ? $a_target_dir : $spi['dirname'];

		$target_file = $target_dir.'/'.$a_target_filename;

		$sec =  self::parseTimeString($a_sec);

		$cmd = '-y -i '.ilUtil::escapeShellArg($a_file).' -r 1 -f image2 -vframes 1 -ss '.$sec.' '.ilUtil::escapeShellArg($target_file);
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
	 * @param $time
	 * @return int|string
	 */
	protected static function parseTimeString($time)
	{
		if($matches = preg_split('/:/', $time))
		{
			if(sizeof($matches) == 3)
			{
				return self::escapeHourMinutesSeconds($matches[0], $matches[1], $matches[2]);
			}
			else if(sizeof($matches) == 2)
			{
				return self::escapeHourMinutesSeconds('00', $matches[0], $matches[1]);
			}
		}
		return (int) $time;
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
		return $hours . ':' . self::escapeMinutesSeconds($minutes, $seconds);
	}

	/**
	 * @param $minutes
	 * @param $seconds
	 * @return string
	 */
	protected static function escapeMinutesSeconds($minutes, $seconds)
	{
		$minutes		= (int) $minutes;
		return $minutes . ':' . self::escapeSeconds($seconds);
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
		return $seconds . '.' . $milliseconds;
	}
}