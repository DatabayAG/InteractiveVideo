<#1>
<?php
/**
 * @var $ilDB ilDB
 */
if(!$ilDB->tableExists('rep_robj_xvid_surl'))
{
	$fields = array(
		'obj_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'simple_url' => array(
			'type' => 'text',
			'length' => '1000',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_surl', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_surl', array('obj_id'));
}
?>