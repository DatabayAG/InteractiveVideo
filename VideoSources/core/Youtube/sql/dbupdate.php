<#1>
<?php
/**
 * @var $ilDB ilDB
 */
if(!$ilDB->tableExists('rep_robj_xvid_youtube'))
{
	$fields = array(
		'obj_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'youtube_id' => array(
			'type' => 'text',
			'length' => '100',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_youtube', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_youtube', array('obj_id', 'youtube_id'));
}
?>