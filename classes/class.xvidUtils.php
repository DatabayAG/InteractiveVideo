<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */


/**
 * Class xvidUtils
 *
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class xvidUtils 
{


	public static function timespanArray( $seconds ){


		$td['s'] = $seconds % 60;

		$td['i'] = (($seconds - $td['sec']) / 60) % 60;

		$td['h'] = (((($seconds - $td['sec']) /60)-
					$td['min']) / 60) % 24;

//		$td['day'] = floor( ((((($seconds - $td['sec']) /60)-
//					$td['min']) / 60) / 24) );

		foreach($td as $key => $value)
		{
			$time[$key] = sprintf("%02d", $value);
		}

		return $time;
	}


}
