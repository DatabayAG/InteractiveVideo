<#1>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_comments'))
{
	$fields = array(
		'comment_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'ref_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'mob_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),

		'user_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'is_tutor' => array(
			'type' => 'integer',
			'length' => '1',
			'notnull' => true,
			'default' => 0
		),
		'is_interactive' => array(
			'type' => 'integer',
			'length' => '1',
			'notnull' => true,
			'default' => 0
		),
		'comment_time' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true,
			'default' => 0
		),
		'comment_text' => array(
			'type' => 'text',
			'length' => '4000',
			'notnull' => true
		)
	);
	
	$ilDB->createTable("rep_robj_xvid_comments", $fields);
	$ilDB->addPrimaryKey("rep_robj_xvid_comments", array("comment_id"));
	$ilDB->createSequence("rep_robj_xvid_comments");
}
?>
<#2>
<?php
	if(!$ilDB->tableExists('rep_robj_xvid_objects'))
	{
		$fields = array(
			'ref_id' => array(
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
		$ilDB->createTable("rep_robj_xvid_objects", $fields);
	}
?>