<#1>
<?php
/**
 * @var $ilDB ilDB
 */
if(!$ilDB->tableExists('rep_robj_xvid_test'))
{
	$fields = array(
		'comment_id'     => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => true
		)
	);

	$ilDB->createTable('rep_robj_xvid_test', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_test', array('comment_id'));
}
?>