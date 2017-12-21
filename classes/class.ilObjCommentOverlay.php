<?php

class ilObjCommentOverlay
{
	public static function getOverlayData($comment_id)
	{
		if($comment_id == 71)
		{
			return self::getText($comment_id);
		}
		else if($comment_id == 73)
		{
			return self::getRect($comment_id);
		}
		else if($comment_id == 74)
		{
			return self::getArrow($comment_id);
		}
		return self::getCircle($comment_id);
	}

	protected static function getText($comment_id)
	{
		return '<text '.self::getClass($comment_id).' x="40" y="20"  transform="rotate(30 20,40)" font-family="Verdana" font-size="20" style="fill:yellow;stroke:red;">My little dummy text.</text>';
	}

	protected static function getLine($comment_id)
	{
		return '<line '.self::getClass($comment_id).' x1="0" y1="0" x2="100" y2="300" style="stroke:rgb(0,0,255);stroke-width:2" />';
	}

	protected static function getRect($comment_id)
	{
		return '<rect '.self::getClass($comment_id).' x="-191" y="18" width="250" height="110" style="fill:none;stroke-width:4;stroke:rgb(255,0,155)"/>';
	}

	protected static function getCircle($comment_id)
	{
		return '<circle '.self::getClass($comment_id).'" cx="108" cy="148" r="86" stroke="green" stroke-width="2" fill="none" />';
	}


	protected static function getArrow($comment_id)
	{
		return '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#f00" /></marker></defs>'.
			'<line '.self::getClass($comment_id). '" x1="-5" y1="-5" x2="95" y2="75" stroke="#000" stroke-width="5" marker-end="url(#arrow)" />';
	}

	protected static function getClass($comment_id)
	{
		return ' class="interactive_overlay_element_'.$comment_id.'"';
	}
}
