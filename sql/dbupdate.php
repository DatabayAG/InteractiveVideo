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
<#12>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_correct'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'feedback_correct',
			array(
				'type'    => 'text',
				'length'  => '4000',
				'notnull' => false,
				'default' => null
			));
	}

	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_one_wrong'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'feedback_one_wrong',
			array(
				'type'    => 'text',
				'length'  => '4000',
				'notnull' => false,
				'default' => null
			));
	}
}
?>
<#13>
<?php
if($ilDB->tableExists('rep_robj_xvid_objects'))
{

	if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_anonymized'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_anonymized',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_public'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_public',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
}
?>
<#14>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'limit_attempts'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'limit_attempts',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'is_jump_correct'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'is_jump_correct',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'jump_correct_ts'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'jump_correct_ts',
			array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true,
				'default' => 0));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'is_jump_wrong'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'is_jump_wrong',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'jump_wrong_ts'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'jump_wrong_ts',
			array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true,
				'default' => 0));
	}
}
?>
<#15>
<?php
if($ilDB->tableExists('rep_robj_xvid_comments'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'is_private'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_comments', 'is_private',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
}
?>
<#16>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'repeat_question'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'repeat_question',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0
			)
		);
	}
	
	$res = $ilDB->queryF('SELECT comment_id FROM rep_robj_xvid_comments WHERE repeat_question = %s',
		array('integer'), array(1));
	
	while($row = $ilDB->fetchAssoc($res))
	{
		$comment_ids[] = $row['comment_id'];
	}
		
	$ilDB->manipulateF('
	UPDATE rep_robj_xvid_question 
	SET rep_robj_xvid_question.repeat_question = %s
	WHERE '. $ilDB->in('comment_id', $comment_ids, false, 'integer'),
		array('integer'), array(1)) ;
}
?>
<#17>
<?php
	if($ilDB->tableColumnExists('rep_robj_xvid_comments', 'repeat_question'))
	{
		$ilDB->dropTableColumn('rep_robj_xvid_comments','repeat_question');
	}
?>
<#18>
<?php
if($ilDB->tableExists('rep_robj_xvid_objects'))
{

	if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_online'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_online',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
}
?>
<#19>
<?php
if($ilDB->tableExists('rep_robj_xvid_objects'))
{

	if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_repeat'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_repeat',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 0));
	}
}
?>
<#20>
<?php
$ilDB->addPrimaryKey('rep_robj_xvid_answers', array('question_id', 'answer_id', 'user_id'));
$ilDB->addPrimaryKey('rep_robj_xvid_score', array('question_id', 'user_id'));
?>
<#21>
<?php
$ilDB->addIndex('rep_robj_xvid_question', array('comment_id'), 'ci');
?>
<#22>
<?php
if($ilDB->tableExists('rep_robj_xvid_objects'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_chronologic'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_chronologic',
				array(
						'type'    => 'integer',
						'length'  => '1',
						'notnull' => true,
						'default' => 1));
	}
}
?>
<#23>
<?php
if($ilDB->tableExists('rep_robj_xvid_comments'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'comment_time_end'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_comments', 'comment_time_end',
				array(
						'type'    => 'integer',
						'length'  => '4',
						'notnull' => true,
						'default' => 0));
	}
}
?>
<#24>
	<?php
	if($ilDB->tableExists('rep_robj_xvid_question'))
	{
		if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'show_response_frequency'))
		{
			$ilDB->addTableColumn('rep_robj_xvid_question', 'show_response_frequency',
					array(
							'type'    => 'integer',
							'length'  => '1',
							'notnull' => true,
							'default' => 0));
		}
	} 
?>
<#25>
	<?php
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'show_correct_icon'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'show_correct_icon',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true,
				'default' => 1));
	}
	?>
<#26>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'show_wrong_icon'))
{
	$ilDB->addTableColumn('rep_robj_xvid_question', 'show_wrong_icon',
		array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true,
			'default' => 1));
}
?>
<#27>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_plugins'))
{
	$fields = array(
		'plugin_name'     => array(
			'type'    => 'text',
			'length'  => '200',
			'notnull' => true
		),
		'is_activated'         => array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true
		),
		'db_update'   => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => false
		),
		'version'     => array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => false,
			'default' => 0
		)
	);

	$ilDB->createTable('rep_robj_xvid_plugins', $fields);
	$ilDB->addPrimaryKey('rep_robj_xvid_plugins', array('plugin_name'));
}
?>
<#28>
<?php
if($ilDB->tableExists('rep_robj_xvid_plugins') && ! $ilDB->tableExists('rep_robj_xvid_sources'))
{
	$ilDB->renameTable('rep_robj_xvid_plugins', 'rep_robj_xvid_sources');
}
?>
<#29>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_sources', 'class_path'))
{
	$ilDB->addTableColumn('rep_robj_xvid_sources', 'class_path',
		array(
			'type'    => 'text',
			'length'  => '4000',
			'notnull' => true)
	);
}
?>
<#30>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_sources', 'plugin_id'))
{
	$ilDB->addTableColumn('rep_robj_xvid_sources', 'plugin_id',
		array(
			'type'    => 'text',
			'length'  => '255',
			'notnull' => true)
	);
}
?>
<#31>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'plugin_id'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'plugin_id',
		array(
			'type'    => 'text',
			'length'  => '255',
			'notnull' => true)
	);
}
?>
<#32>
<?php
if($ilDB->tableColumnExists('rep_robj_xvid_objects', 'plugin_id'))
{
	$ilDB->renameTableColumn('rep_robj_xvid_objects', 'plugin_id', 'source_id');
}
?>
<#33>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'is_task'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'is_task',
		array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true)
	);
}
?>
<#34>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'task'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'task',
		array(
			'type'    => 'text',
			'length'  => '4000',
			'notnull' => false)
	);
}
?>
<#35>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'lp_mode'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'lp_mode',
		array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true,
			'default' => 0));
}
?>
<#36>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'is_reply_to'))
{
	$ilDB->addTableColumn('rep_robj_xvid_comments', 'is_reply_to',
		array(
			'type'    => 'integer',
			'length'  => '4',
			'notnull' => false,
			'default' => 0));
}
?>
<#37>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_correct_obj_id'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'feedback_correct_obj_id',
			array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => false,
				'default' => null
			));
	}

	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_correct_obj_id'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'feedback_correct_obj_id',
			array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => false,
				'default' => null
			));
	}
}
?>
<#38>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_wrong_obj_id'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'feedback_wrong_obj_id',
			array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => false,
				'default' => null
			));
	}
}
?>
<#39>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if($ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_wrong_obj_id'))
	{
		$ilDB->renameTableColumn('rep_robj_xvid_question', 'feedback_wrong_obj_id', 'feedback_wrong_ref_id');
	}
	if($ilDB->tableColumnExists('rep_robj_xvid_question', 'feedback_correct_obj_id'))
	{
		$ilDB->renameTableColumn('rep_robj_xvid_question', 'feedback_correct_obj_id', 'feedback_correct_ref_id');
	}
}
?>
<#40>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'reflection_question_comment'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'reflection_question_comment',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => null
			));
	}
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'neutral_answer'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'neutral_answer',
			array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => null
			));
	}
}
?>
<#41>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_lp'))
{
	if(!$ilDB->tableExists('rep_robj_xvid_lp'))
	{
		$fields = array(
			'obj_id'     => array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true
			),
			'usr_id'         => array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => true
			),
			'started'   => array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => 0
			),
			'ended'     => array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => 0
			)
		);

		$ilDB->createTable('rep_robj_xvid_lp', $fields);
		$ilDB->addPrimaryKey('rep_robj_xvid_lp', array('obj_id', 'usr_id'));
	}
}
?>
<#42>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
	if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'question_image'))
	{
		$ilDB->addTableColumn('rep_robj_xvid_question', 'question_image',
			array(
				'type'    => 'text',
				'length'  => '4000',
				'notnull' => false,
				'default' => null
			));
	}
}
?>
<#43>
<?php
require_once 'Services/WebAccessChecker/classes/class.ilWACSecurePath.php';
$ilWACSecurePath = new ilWACSecurePath();
$ilWACSecurePath->setPath('xvid');
$ilWACSecurePath->setCheckingClass('ilObjInteractiveVideoAccess');
$ilWACSecurePath->setComponentDirectory('/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo');
$ilWACSecurePath->create();
?>
<#44>
<?php
if($ilDB->tableExists('rep_robj_xvid_lp'))
{
		$ilDB->dropTable('rep_robj_xvid_lp');
		$fields = array(
			'obj_id'     => array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true
			),
			'usr_id'         => array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true
			),
			'started'   => array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => 0
			),
			'ended'     => array(
				'type'    => 'integer',
				'length'  => '1',
				'notnull' => false,
				'default' => 0
			)
		);

		$ilDB->createTable('rep_robj_xvid_lp', $fields);
		$ilDB->addPrimaryKey('rep_robj_xvid_lp', array('obj_id', 'usr_id'));
}
?>
<#45>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'no_comment'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'no_comment',
		array(
			'type'    => 'integer',
			'length'  => '1',
			'notnull' => true,
			'default' => 0));
}
?>
<#46>
<?php
// Empty step
?>
<#47>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'auto_resume'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'auto_resume',
		array(
			'type'    => 'integer',
			'length'  => 1,
			'notnull' => true,
			'default' => 0)
	);
}
?>
<#48>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'fixed_modal'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'fixed_modal',
		array(
			'type'    => 'integer',
			'length'  => 1,
			'notnull' => true,
			'default' => 0)
	);
}
?>
<#49>
<?php
if(!$ilDB->tableExists('rep_robj_xvid_subtitle'))
{
	if(!$ilDB->tableExists('rep_robj_xvid_subtitle'))
	{
		$fields = array(
			'obj_id'     => array(
				'type'    => 'integer',
				'length'  => '4',
				'notnull' => true
			),
			'file_name'         => array(
				'type'    => 'text',
				'length'  => '1000',
				'notnull' => false,
				'default' => null
			),
			'short_title'   => array(
				'type'    => 'text',
				'length'  => '200',
				'notnull' => false,
				'default' => null
			),
			'long_title'     => array(
				'type'    => 'text',
				'length'  => '1000',
				'notnull' => false,
				'default' => null
			)
		);

		$ilDB->createTable('rep_robj_xvid_subtitle', $fields);
		$ilDB->addPrimaryKey('rep_robj_xvid_subtitle', array('obj_id', 'short_title'));
	}
}
?>
<#50>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'no_toolbar'))
{
	$ilDB->addTableColumn('rep_robj_xvid_objects', 'no_toolbar',
		array(
			'type'    => 'integer',
			'length'  => 1,
			'notnull' => true,
			'default' => 0)
	);
}
?>
<#51>
<?php
$ilDB->addPrimaryKey('rep_robj_xvid_objects', array('obj_id'));
?>
<#52>
<?php
if($ilDB->tableExists('rep_robj_xvid_comments'))
{
    if(!$ilDB->tableColumnExists('rep_robj_xvid_comments', 'is_table_of_content'))
    {
        $ilDB->addTableColumn('rep_robj_xvid_comments', 'is_table_of_content',
            array(
                'type'    => 'integer',
                'length'  => '1',
                'notnull' => true,
                'default' => 0));
    }
}
?>
<#53>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'show_toc_first'))
{
    $ilDB->addTableColumn('rep_robj_xvid_objects', 'show_toc_first',
        array(
            'type'    => 'integer',
            'length'  => 1,
            'notnull' => true,
            'default' => 0)
    );
}
?>
<#54>
<?php
if(!$ilDB->tableColumnExists('rep_robj_xvid_objects', 'disable_comment_stream'))
{
    $ilDB->addTableColumn('rep_robj_xvid_objects', 'disable_comment_stream',
        array(
            'type'    => 'integer',
            'length'  => 1,
            'notnull' => true,
            'default' => 0)
    );
}
?>
<#55>
<?php
$ilDB->addIndex('rep_robj_xvid_comments', ['is_interactive', 'obj_id'], 'i2');
?>
<#56>
<?php
$ilDB->addIndex('rep_robj_xvid_question', ['comment_id', 'type'], 'i2');
?>
<#57>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
    if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'compulsory_question'))
    {
        $ilDB->addTableColumn('rep_robj_xvid_question', 'compulsory_question',
            array(
                'type'    => 'integer',
                'length'  => '1',
                'notnull' => false,
                'default' => null
            ));
    }
}
?>

<#58>
<?php
if($ilDB->tableExists('rep_robj_xvid_question'))
{
    if(!$ilDB->tableColumnExists('rep_robj_xvid_question', 'show_best_solution'))
    {
        $ilDB->addTableColumn('rep_robj_xvid_question', 'show_best_solution',
            array(
                'type'    => 'integer',
                'length'  => '1',
                'notnull' => true,
                'default' => 0));
    }
}
?>