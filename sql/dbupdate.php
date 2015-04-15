<#1>
<?php
/**
 * @var $ilDB ilDB
 */
if(!$ilDB->tableExists('rep_robj_xvid_comments'))
{
	$fields = array(
		'comment_id'     => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => true
		),
		'obj_id'         => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => true
		),
		'user_id'        => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => true
		),
		'is_tutor'       => array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true,
			'default' => 0
		),
		'is_interactive' => array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true,
			'default' => 0
		),
		'comment_time'   => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => true,
			'default' => 0
		),
		'comment_text'   => array(
			'type'    => 'text',
			'length'  => '4000',
			'notnull' => false,
			'default' => null
		)
	);

	$ilDB->createTable('rep_robj_xvid_comments', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_comments', array('comment_id'));
	$ilDB->createSequence('rep_robj_xvid_comments');
}
?>
<#2>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_objects'))
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
	$ilDB->createTable('rep_robj_xvid_objects', $fields);
}
?>
<#3>
<?php
if($ilDB->tableColumnExists('rep_robj_xvid_objects', 'ref_id'))
{
	$query = '
		SELECT rep_robj_xvid_objects.ref_id, object_reference.obj_id
		FROM rep_robj_xvid_objects
		INNER JOIN object_reference ON object_reference.ref_id = rep_robj_xvid_objects.ref_id
	';
	$res   = $ilDB->query($query);
	while($row = $ilDB->fetchAssoc($res))
	{
		$ilDB->manipulateF(
			'UPDATE rep_robj_xvid_objects SET ref_id = %s WHERE ref_id = %s',
			array('integer', 'integer'),
			array($row['obj_id'], $row['ref_id'])
		);
	}

	$ilDB->renameTableColumn('rep_robj_xvid_objects', 'ref_id', 'obj_id');
}
?>
<#4>
<?php
if($ilDB->tableColumnExists('rep_robj_xvid_comments', 'ref_id'))
{
	$query = '
		SELECT rep_robj_xvid_comments.ref_id, object_reference.obj_id
		FROM rep_robj_xvid_comments
		INNER JOIN object_reference ON object_reference.ref_id = rep_robj_xvid_comments.ref_id
	';
	$res   = $ilDB->query($query);
	while($row = $ilDB->fetchAssoc($res))
	{
		$ilDB->manipulateF(
			'UPDATE rep_robj_xvid_comments SET ref_id = %s WHERE ref_id = %s',
			array('integer', 'integer'),
			array($row['obj_id'], $row['ref_id'])
		);
	}

	$ilDB->renameTableColumn('rep_robj_xvid_comments', 'ref_id', 'obj_id');
}
?>
<#5>
<?php
if($ilDB->tableColumnExists('rep_robj_xvid_comments', 'mob_id'))
{
	$ilDB->dropTableColumn('rep_robj_xvid_comments', 'mob_id');
}
?>
<#6>
<?php
if($ilDB->tableColumnExists('rep_robj_xvid_comments', 'obj_id'))
{
	$ilDB->addIndex('rep_robj_xvid_comments', array('obj_id'), 'i1');
}
?>
<#7>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_qus_text'))
{
	$fields = array(
			'answer_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
			'question_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
			'answer' => array(
			'type' => 'text',
			'length' => '255',
			'notnull' => true
		),
			'correct' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_qus_text', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_qus_text', array('answer_id'));
	$ilDB->createSequence('rep_robj_xvid_qus_text');
}
?>
<#8>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_question'))
{
	$fields = array(
		'question_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'comment_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'question_text' => array(
			'type'    => 'text',
			'length'  => '4000',
			'notnull' => false,
			'default' => null
		),
		'type' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		)
	);	
	$ilDB->createTable('rep_robj_xvid_question', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_question', array('question_id'));
	$ilDB->createSequence('rep_robj_xvid_question');
}
?>
<#9>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_answers'))
{
	$fields = array(
		'question_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'answer_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'user_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_answers', $fields);
}
?>
<#10>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_score'))
{
	$fields = array(
		'question_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
		'user_id' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		),
			'points' => array(
			'type' => 'integer',
			'length' => '4',
			'notnull' => true
		)
	);
	$ilDB->createTable('rep_robj_xvid_score', $fields);
}
?>
<#11>
<?php
if($ilDB->tableExists('rep_robj_xvid_comments'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'comment_title'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_comments', 'comment_title',
			array(
				'type'    => 'text',
				'length'  => '100',
				'notnull' => false,
				'default' => null
			));
	}

	if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'repeat_question'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_comments', 'repeat_question',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0
			)
		);
	}

	if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'comment_tags'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_comments', 'comment_tags',
			array(
				'type'    => 'text',
				'length'  => '4000',
				'notnull' => false,
				'default' => null
			)
		);
	}
}
?>