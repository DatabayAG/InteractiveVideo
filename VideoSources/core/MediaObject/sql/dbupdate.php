<#1>
<?php
/**
 * @var $ilDB ilDB
 */
if(!$ilDB->tableExists('rep_robj_xvid_mobs'))
{
	$fields = array(
		'obj_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'mob_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_mobs', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_mobs', array('obj_id', 'mob_id'));
}
?>
<#2>
<?php
/**
 * @var $ilDB ilDB
 */
if($ilDB->tableColumnExists('rep_robj_xvid_objects', 'mob_id'))
{
	$res = $ilDB->query('SELECT obj_id, mob_id FROM rep_robj_xvid_objects');

	$transfer = array();
	while($row = $ilDB->fetchAssoc($res))
	{
		$transfer[$row['obj_id']] = $row['mob_id'];
	}

	foreach($transfer as $obj_id => $mob_id)
	{
		$ilDB->insert('rep_robj_xvid_mobs',
			array(
				'obj_id' => array('integer', $obj_id),
				'mob_id' => array('integer', $mob_id),
			));
	}
	$ilDB->update('rep_robj_xvid_objects',
		array(
			'source_id' 	=> array('text', 'imo')
		),
		array('1' => array('integer', 1))
	);
	
	$ilDB->dropTableColumn('rep_robj_xvid_objects', 'mob_id');
}
?>