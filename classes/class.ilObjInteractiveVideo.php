<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */


/**
 * Class ilObjInteractiveVideo
 * @author Nadia Ahmad <nahmad@databay.de>
 */
class ilObjInteractiveVideo extends ilObjectPlugin implements ilLPStatusPluginInterface
{
	const TABLE_NAME_OBJECTS = 'rep_robj_xvid_objects';
	const TABLE_NAME_COMMENTS = 'rep_robj_xvid_comments';
	const TABLE_NAME_QUESTIONS = 'rep_robj_xvid_question';
	const TABLE_NAME_LP = 'rep_robj_xvid_lp';
	const TABLE_NAME_SUB_TITLE = 'rep_robj_xvid_subtitle';
	const LP_MODE_DEACTIVATED = 0;
    const LP_MODE_BY_QUESTIONS = 99;
    const LP_MODE_BY_ANSWERED_QUESTIONS = 100;
    const LAYOUT_SIMILAR = 0;
    const LAYOUT_BIG_VIDEO = 1;
    const LAYOUT_VERY_BIG_VIDEO = 2;
	protected int $learning_progress_mode = self::LP_MODE_DEACTIVATED;

	protected bool $is_online = false;
	protected int $is_anonymized = 0;
	protected int $is_repeat = 0;
	protected int $is_chronologic = 0;
	protected int $is_public = 0;
	protected string $source_id;
	protected ?ilInteractiveVideoSource $video_source_object = null;
	protected $video_source_import_object;
	protected int $task_active = 0;
	protected string $task;

	/**
	 * @var boolean
	 */
	protected $auto_resume_after_question = 0;

	/**
	 * @var boolean
	 */
	protected $fixed_modal = 0;
	/**
	 * @var int
	 */
	protected int $video_mode = ilInteractiveVideoPlugin::CLASSIC_MODE;
	/**
	 * @var SimpleChoiceQuestion[]
	 */
	public array $import_simple_choice = array();

	/** @var ilObjComment[] */
	public array $import_comment = array();
	protected int $enable_comment = 1;
	protected int $enable_toolbar = 1;
	protected int $show_toc_first = 0;
	protected int $enable_comment_stream = 1;
	protected int $marker_for_students = 0;
	protected int $no_comment_stream = 0;
    protected int $layout_width = self::LAYOUT_BIG_VIDEO;
    protected bool $marker_active = false;

	/**
	 * @param $src_id
	 * @return ilInteractiveVideoSource
	 */
	public function getVideoSourceObject($src_id) : ilInteractiveVideoSource
    {
		$factory = new ilInteractiveVideoSourceFactory();
		if($this->video_source_object === null)
		{
			$this->video_source_object = $factory->getVideoSourceObject($src_id);
		}
		else
		{
			if($this->video_source_object->getId() !== $src_id)
			{
				$this->video_source_object = $factory->getVideoSourceObject($src_id);
			}
		}

		return $this->video_source_object;
	}

    protected function doRead(): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT * FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);
		
		$this->setIsAnonymized($row['is_anonymized']);
		$this->setIsRepeat($row['is_repeat']);
		$this->setIsPublic($row['is_public']);
		$this->setOnline((bool)$row['is_online']);
		$this->setIsChronologic($row['is_chronologic']);
		$this->setSourceId($row['source_id']);
		$this->setTaskActive($row['is_task']);
		$this->setTask($row['task']);
		$this->setEnableComment($row['enable_comment']);
		$this->setEnableToolbar($row['show_toolbar']);
		$this->setAutoResumeAfterQuestion($row['auto_resume']);
		$this->setFixedModal($row['fixed_modal']);
		$this->setShowTocFirst($row['show_toc_first']);
		$this->setEnableCommentStream($row['disable_comment_stream']);
		$this->setNoCommentStream($row['no_comment_stream']);
		$this->setVideoMode($row['video_mode']);
		$this->setMarkerForStudents($row['marker_for_students']);
        $this->setLayoutWidth($row['layout_width']);
        $this->video_source_object = null;
		$this->getVideoSourceObject($row['source_id']);
		$this->setLearningProgressMode($row['lp_mode']);

        $db_settings = new ilSetting(('xvid'));
        if((int) $db_settings->get('xvid_activate_marker') === 1)
        {
            $this->marker_active = true;
        }
		parent::doRead();
	}

	protected function getOldVideoSource() : string
    {
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF(
			'SELECT source_id FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'),
			array($this->getId())
		);
		$row = $ilDB->fetchAssoc($res);

		return $row['source_id'];
	}

	/**
	 * @param $data_short
	 * @param $data_long
	 */
	public function saveSubtitleData($data_short, $data_long): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_SUB_TITLE . ' WHERE obj_id = %s',
			array('integer'), array($this->getId()));

		$titles = array();
		if(is_array($data_short) && count($data_short) > 0) {
			foreach ($data_short as $name => $value) {
				$titles[$name]['s'] = $value;
			}

			foreach ($data_long as $name => $value) {
				$titles[$name]['l'] = $value;
			}
		}

		foreach ($titles as $name => $value) {
			$ilDB->insert(
				self::TABLE_NAME_SUB_TITLE,
				array(
					'obj_id'      => array('integer', $this->getId()),
					'file_name'   => array('text', $name),
					'short_title' => array('text', $value['s']),
					'long_title'  => array('text', $value['l'])
				));
		}
	}

	/**
	 * @param $filename
	 */
	public function removeSubtitleData($filename): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_SUB_TITLE . ' WHERE obj_id = %s && file_name = %s',
			array('integer', 'text'), array($this->getId(), $filename));
	}

	/**
	 * @return array<int|string, array{s: mixed, l: mixed}>
	 */
	public function getSubtitleData() : array
    {
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_SUB_TITLE. ' WHERE obj_id = %s',
			array('integer'), array($this->getId()));

		$sub_title_data = array();

		while($row = $ilDB->fetchAssoc($res))
		{
			$sub_title_data[$row['file_name']]['s'] = $row['short_title'];
			$sub_title_data[$row['file_name']]['l'] = $row['long_title'];
		}

		return $sub_title_data;
	}

    protected function doCreate(bool $clone_mode = false): void
	{
		/**
		 * @var $ilLog ilLog
		 * @var $ilDb ilDB
		 */
		global $ilLog, $ilDB;

		if(! $clone_mode)
		{
			$post_src_id = ilInteractiveVideoPlugin::stripSlashesWrapping($_POST['source_id']);
			$from_post = false;
			if(($post_src_id == null || $post_src_id == '') && $this->source_id != null)
			{
				$src_id = $this->source_id;
			}
			else
			{
				$src_id = $post_src_id;
				$from_post = true;
			}

			if($src_id != '')
			{

				try
				{
					$this->getVideoSourceObject($src_id);
					$this->video_source_object->doCreateVideoSource($this->getId());
                    /**
                     * @var $ilDB ilDBInterface
                     */
					global $ilDB;

					$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
						array('integer'), array($this->getId()));

					if(!$from_post)
					{
						$anonymized		= $this->is_anonymized;
						$repeat			= $this->is_repeat;
						$chronologic	= $this->is_chronologic;
						$online			= $this->is_online;
						$source_id		= $this->source_id;
						$is_task		= $this->task_active;
						$task			= $this->task;
						$enable_comment = $this->enable_comment;
						$show_toolbar	= $this->enable_toolbar;
						$auto_resume	= $this->auto_resume_after_question;
						$fixed_modal	= $this->fixed_modal;
						$show_toc_first	= $this->show_toc_first;
						$disable_comment_stream	= $this->enable_comment_stream;
                        $layout_width   = $this->layout_width;
						$no_comment_stream  = $this->no_comment_stream;
						$video_mode			= $this->video_mode;
						$marker_for_students= $this->marker_for_students;
					}
					else
					{
						$anonymized		= (int)$_POST['is_anonymized'];
						$repeat			= (int)$_POST['is_repeat'];
						$chronologic	= $_POST['is_chronologic'];
                        if( $chronologic === null ){
                            $chronologic = 0;
                        } else {
                            $chronologic	= (int) $_POST['is_chronologic'];
                        }

                        $online			= (int)$_POST['is_online'];
						$source_id		= ilInteractiveVideoPlugin::stripSlashesWrapping($_POST['source_id']);
						$is_task		= (int)$_POST['is_task'];
						$task			= ilInteractiveVideoPlugin::stripSlashesWrapping($_POST['task']);
						$enable_comment	= (int)$_POST['enable_comment'];
                        $show_toolbar = 1;
                        if(array_key_exists('show_toolbar', $_POST))
                        {
                            $show_toolbar		= (int)$_POST['show_toolbar'];
                        }

						$auto_resume	= (int)$_POST['auto_resume'];
						$fixed_modal	= (int)$_POST['fixed_modal'];
						$show_toc_first	= (int)$_POST['show_toc_first'];
						$enable_comment_stream	= (int)$_POST['enable_comment_stream'];
                        $layout_width   = (int)$_POST['layout_width'];
						$no_comment_stream	= (int)$_POST['no_comment_stream'];
						$video_mode			= (int)$_POST['video_mode'];
						$marker_for_students= (int)$_POST['marker_for_students'];
					}

					$ilDB->insert(
						self::TABLE_NAME_OBJECTS,
						array(
							'obj_id'         => array('integer', $this->getId()),
							'is_anonymized'  => array('integer', $anonymized),
							'is_repeat'      => array('integer', $repeat),
							'is_chronologic' => array('integer', $chronologic),
							'is_public'      => array('integer', 1),
							'is_online'      => array('integer', $online),
							'source_id'      => array('text', $source_id),
							'is_task'        => array('integer',$is_task ),
							'auto_resume'    => array('integer',$auto_resume ),
							'fixed_modal'    => array('integer',$fixed_modal ),
							'task'           => array('text', $task),
							'enable_comment'     => array('integer', 1),
							'show_toolbar'     => array('integer', $show_toolbar),
							'show_toc_first' => array('integer', $show_toc_first),
							'disable_comment_stream' => array('integer', 1),
							'layout_width' => array('integer', $layout_width),
							'no_comment_stream'   => array('integer', $no_comment_stream),
							'video_mode'          => array('integer', $video_mode),
							'marker_for_students' => array('integer', $marker_for_students)
						)
					);

					parent::doCreate();

					$this->createMetaData();
				}
				catch(Exception $e)
				{
					$ilLog->write($e->getMessage());
					$ilLog->logStack();

					$this->delete();

					throw new ilException(sprintf("%s: Creation incomplete", __METHOD__));
				}
			}
			else
			{
				$this->delete();
				throw new ilException(ilInteractiveVideoPlugin::getInstance()->txt('at_least_one_source'));
			}
		}
	}

    protected function doUpdate(): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		parent::doUpdate();
		
		$old_source_id = $this->getOldVideoSource();
		if($old_source_id != null && $old_source_id != $this->getSourceId())
		{
			$this->getVideoSourceObject($old_source_id);
			$this->video_source_object->doDeleteVideoSource($this->getId());
		}

		$ilDB->update(self::TABLE_NAME_OBJECTS ,
			array('is_anonymized'		=>array('integer',	$this->isAnonymized()),
                  'is_repeat'			=>array('integer',	$this->isRepeat()),
                  'is_public'			=>array('integer',	$this->isPublic()),
                  'is_chronologic'	=>array('integer',	$this->isChronologic()),
                  'is_online'			=>array('integer',	$this->isOnline()),
                  'source_id'			=>array('text',		$this->getSourceId()),
                  'is_task'			=> array('integer', $this->getTaskActive()),
                  'task'				=> array('text',	$this->getTask()),
                  'auto_resume'       => array('integer', $this->isAutoResumeAfterQuestion()),
                  'fixed_modal'       => array('integer', $this->isFixedModal()),
                  'show_toc_first'    => array('integer', $this->getShowTocFirst()),
                  'disable_comment_stream'    => array('integer', $this->getEnableCommentStream()),
                  'lp_mode'			=> array('integer', $this->getLearningProgressMode()),
                  'enable_comment'		=> array('integer', $this->getEnableComment()),
                  'show_toolbar'		=> array('integer', $this->getEnableToolbar()),
                  'no_comment_stream'		=> array('integer', $this->getNoCommentStream()),
                  'video_mode'			=> array('integer', $this->getVideoMode()),
                  'marker_for_students'	=> array('integer', $this->getMarkerForStudents()),
                  'layout_width'	=> array('integer', $this->getLayoutWidth())
					),
			array('obj_id' => array('integer', $this->getId())));
	}

    protected function beforeDelete(): bool
	{
        if (((!$this->referenced) || ($this->countReferences() == 1)) && $this->video_source_object !== null ) {
            $this->getVideoSourceObject($this->getSourceId());
            $this->video_source_object->beforeDeleteVideoSource($this->getId());
            self::deleteComments(self::getCommentIdsByObjId($this->getId(), false));

            /**
             * @var $ilDB ilDBInterface
             */
            global $ilDB;
            $ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = ' . $ilDB->quote($this->getId(), 'integer'));
            $this->deleteMetaData();
        }
        return true;
	}

    protected function doDelete(): void
	{
		parent::doDelete();
	}

	/**
				 * @param ilObjInteractiveVideo $new_obj
				 * @param integer $a_target_id
				 * @param int|null $a_copy_id
				 */
				protected function doCloneObject(ilObject2 $new_obj, int $a_target_id, ?int $a_copy_id = null): void
	{
		parent::doCloneObject($new_obj, $a_target_id, $a_copy_id);

		$this->cloneMetaData($new_obj);

        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_OBJECTS . ' WHERE obj_id = %s',
			array('integer'), array($new_obj->getId()));

		$ilDB->insert(
			self::TABLE_NAME_OBJECTS ,
			array(
                'obj_id'        => array('integer', $new_obj->getId()),
                'is_anonymized' => array('integer', $this->isAnonymized()),
                'is_repeat' => array('integer', $this->isRepeat()),
                'is_chronologic' => array('integer', $this->isChronologic()),
                'is_public'     => array('integer', $this->isPublic()),
                'enable_comment'     => array('integer', $this->getEnableComment()),
                'show_toolbar'     => array('integer', $this->getEnableToolbar()),
                'source_id'     => array('text', $this->getSourceId()),
                'is_task'     => array('integer', $this->getTaskActive()),
                'task'     => array('text', $this->getTask()),
                'auto_resume'     => array('integer', $this->isAutoResumeAfterQuestion()),
                'fixed_modal'     => array('integer', $this->isFixedModal()),
                'show_toc_first'  => array('integer', $this->getShowTocFirst()),
                'disable_comment_stream'  => array('integer', $this->getEnableCommentStream()),
                'lp_mode' => array('integer', $this->getLearningProgressMode()),
                'no_comment_stream'   => array('integer', $this->getNoCommentStream()),
                'video_mode'          => array('integer', $this->getVideoMode()),
                'layout_width'          => array('integer', $this->getLayoutWidth()),
                'marker_for_students' => array('integer', $this->getMarkerForStudents())
			)
		);

		$this->video_source_object->doCloneVideoSource($this->getId(), $new_obj->getId());

		$comment = new ilObjComment();
		$comment->cloneTutorComments($this->getId(), $new_obj->getId());
	}

    protected function beforeCreate(): bool
	{
		return true;
	}

    protected function beforeCloneObject(): bool
	{
		return true;
	}

    protected function initType(): void
	{
		$this->setType('xvid');
	}

	/**
	 * @param $comment_ids
	 * @return array | bool
	 */
	public static function getQuestionIdsByCommentIds($comment_ids)
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		if(!is_array($comment_ids))
			return false;

		$question_ids = array();

		$res = $ilDB->query('SELECT question_id FROM ' . self::TABLE_NAME_QUESTIONS. ' WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
		while($row = $ilDB->fetchAssoc($res))
		{
			$question_ids[] = $row['question_id'];
		}
		return $question_ids;
	}

    /**
	 * @return array
	 */
	public function getCommentsTableData(bool $replace_with_text = false, bool $empty_string_if_null = false, bool $replace_settings_with_text = false, bool $strip_tags = false) : array
    {
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF('
			SELECT *, comments.comment_id as cid  FROM ' . self::TABLE_NAME_COMMENTS . ' comments
			LEFT JOIN	' . self::TABLE_NAME_QUESTIONS . '  questions ON comments.comment_id = questions.comment_id 
			WHERE obj_id = %s
			AND is_private = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer'), array($this->getId(),0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res)) {
            $type = $this->getCommentType($row);

            $comment_time = $row['comment_time'];
            $comment_time_end = $row['comment_time_end'];
			if($replace_with_text)
			{
                $comment_time		= xvidUtils::getTimeStringFromSeconds($row['comment_time'], false);
                $comment_time_end	= xvidUtils::getTimeStringFromSeconds($row['comment_time_end'], $replace_with_text, $empty_string_if_null);
			}

            $user_name = ilObjUser::_lookupName($row['user_id']);
            $email = ilObjUser::_lookupEmail($row['user_id']);

            $login = $user_name['login'];
            $first_name = $user_name['firstname'];
            $surname = $user_name['lastname'];
            if ($this->isAnonymized() || !strlen($user_name['firstname'])) {
                $login = '';
                $first_name = '';
                $surname = '';
                $email = '';
            }

            $comment_text = $row['comment_text'];
			if($strip_tags){
                $comment_text = strip_tags($row['comment_text']);
			}

            $is_tutor                                   = $row['is_tutor'];
            $is_interactive                         	= $row['is_interactive'];
            //$is_compulsory                            = $row['compulsory_question'] ? '1' : '0';
			if($replace_settings_with_text )
			{
                $is_tutor			= xvidUtils::yesNoString($row['is_tutor']);
                $is_interactive		= xvidUtils::yesNoString($row['is_interactive']);
                //$is_compulsory    = xvidUtils::yesNoString($row['compulsory_question']);
			}

            $table_data[$counter]['comment_id']         = $row['cid'];
            $table_data[$counter]['comment_time']		= $comment_time;
            $table_data[$counter]['comment_time_end']	= $comment_time_end;
			$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['user_user_name']		= $login;
			$table_data[$counter]['user_first_name']	= $first_name;
			$table_data[$counter]['user_surname']		= $surname;
			$table_data[$counter]['user_email']			= $email;
			$table_data[$counter]['title']				= $row['comment_title'];
            $table_data[$counter]['comment_text']       = $comment_text;
            $table_data[$counter]['is_tutor']			= $is_tutor;
            $table_data[$counter]['is_interactive']		= $is_interactive;
             //$table_data[$counter]['compulsory']      = $is_compulsory
            $table_data[$counter]['type']               = $type;
			$table_data[$counter]['marker']             = $row['marker'];
			$table_data[$counter]['is_reply_to']        = $row['is_reply_to'];
			//$table_data[$counter]['is_table_of_content'] = $row['is_table_of_content'];

            $counter++;
        }

		return $table_data;

	}

    /**
     * @param $row
     * @return string
     */
    private function getCommentType($row) : string
    {
        $type = 'comment';
        if ($row['is_interactive'] == "1") {
            $type = 'question';
        } else {
            if ($row['is_table_of_content'] == "1") {
                $type = 'chapter';
            }
        }
        return $type;
    }

    /**
	 * @return array<int, array{comment_id: mixed, comment_time: string, comment_time_end: string, title: mixed, comment_text: mixed, is_private: string, is_reply_to: mixed}>
	 */
	public function getCommentsTableDataByUserId(): array
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB, $ilUser;

		$res = $ilDB->queryF('
			SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' 
			WHERE obj_id = %s
			AND user_id = %s
			AND is_interactive = %s
			ORDER BY comment_time ASC',
			array('integer', 'integer', 'integer'),
			array($this->getId(), $ilUser->getId(), 0));

		$counter    = 0;
		$table_data = array();
		while($row = $ilDB->fetchAssoc($res))
		{
			$table_data[$counter]['comment_id']			= $row['comment_id'];
			$table_data[$counter]['comment_time']		= xvidUtils::getTimeStringFromSeconds($row['comment_time']);
			$table_data[$counter]['comment_time_end']	= xvidUtils::getTimeStringFromSeconds($row['comment_time_end']);
			$table_data[$counter]['title']		= $row['comment_title'];
			//	$table_data[$counter]['user_id']			= $row['user_id'];
			$table_data[$counter]['comment_text']		= $row['comment_text'];
			if($row['is_private'] == 1)
			{
				$table_data[$counter]['is_private'] = ilInteractiveVideoPlugin::getInstance()->txt('private');
			}
			else
				{
				$table_data[$counter]['is_private'] = ilInteractiveVideoPlugin::getInstance()->txt('public');
			}

			$table_data[$counter]['is_reply_to'] = $row['is_reply_to'];
//			$table_data[$counter]['is_tutor']       = $row['is_tutor'];
//			$table_data[$counter]['is_interactive'] = $row['is_interactive'];
			$counter++;
		}

		return $table_data;
	}

    /**
     * @param $comment_id
     * @return mixed
     */
	public function getCommentDataById($comment_id)
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

        return $ilDB->fetchAssoc($res);
	}

    public function doesTocCommentExists(): bool
    {
        global $ilDB;

        $res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE is_table_of_content = %s AND obj_id = %s',
            array('integer', 'integer'), array(1, $this->id));

        $state = false;
        while($row = $ilDB->fetchAssoc($res))
        {
            $state = true;
            continue;
        }
        return $state;
    }

	/**
	 * @param $comment_id
	 * @return array<string, mixed>
	 */
	public function getQuestionDataById($comment_id): array
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = 	$ilDB->queryF('SELECT * FROM  ' . self::TABLE_NAME_QUESTIONS. ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);
		$data['question_data'] = $row;

		return $data;
	}

	/**
	 * @param $comment_id
	 * @return array<string, mixed>
	 */
	public function getCommentTextById($comment_id): array
	{
		/**
		 * @var $ilDB ilDBInterface
		 */
		global $ilDB;

		$res = $ilDB->queryF('SELECT comment_text, comment_title FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE comment_id = %s',
			array('integer'), array($comment_id));

		$row = $ilDB->fetchAssoc($res);

		return ['text' => $row['comment_text'], 'title' => $row['comment_title']];
	}

	/**
	 * @param      $obj_id
	 * @return array<int|string, mixed>
	 */
	public function getCommentIdsByObjId($obj_id, bool $with_user_id = true): array
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$comment_ids = array();
		$res = $ilDB->queryF('SELECT comment_id, user_id FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE obj_id = %s',
			array('integer'), array($obj_id));

		while($row = $ilDB->fetchAssoc($res))
		{
			if($with_user_id == true)
			{
				$comment_ids[$row['comment_id']] = $row['user_id'];
			}
			else
			{
				$comment_ids[] = $row['comment_id'];
			}
		}
		return $comment_ids;
	}

    /**
     * @param $comment_ids
     * @return bool
     */
	public function deleteComments($comment_ids)
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		if(!is_array($comment_ids))
        {
            return false;
        }

		$question_ids = self::getQuestionIdsByCommentIds($comment_ids);
		SimpleChoiceQuestion::deleteQuestions($question_ids);

		$ilDB->manipulate('DELETE FROM ' . self::TABLE_NAME_COMMENTS . ' WHERE ' . $ilDB->in('comment_id', $comment_ids, false, 'integer'));
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 */
	public function saveVideoStarted($obj_id, $usr_id): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		if(!$this->doesLearningProgressEntryExists($obj_id, $usr_id))
		{
			$ilDB->insert(
				self::TABLE_NAME_LP ,
				array(
					'obj_id'        => array('integer', $obj_id),
					'usr_id'        => array('integer', $usr_id),
					'started'       => array('integer', 1),
				)
			);
		}
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 */
	public function saveVideoFinished($obj_id, $usr_id): void
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		if(!$this->doesLearningProgressEntryExists($obj_id, $usr_id))
		{
			$ilDB->insert(
				self::TABLE_NAME_LP ,
				array(
					'obj_id'        => array('integer', $obj_id),
					'usr_id'        => array('integer', $usr_id),
					'started'       => array('integer', 0),
					'ended'         => array('integer', 1),
				)
			);
		}
		else
		{
			$ilDB->update(self::TABLE_NAME_LP ,
				array(
					  'started'       => array('integer', 1),
					  'ended'         => array('integer', 1),

				),
				array('obj_id' => array('integer', $obj_id),
					  'usr_id' => array('integer', $usr_id)));
		}
	}

	/**
	 * @param $obj_id
	 * @param $usr_id
	 */
	public function doesLearningProgressEntryExists($obj_id, $usr_id): bool
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND usr_id = %s',
			array('integer', 'integer'), array($obj_id, $usr_id));

		$row = $ilDB->fetchAssoc($res);
		if($row == null)
		{
			return false;
		}
		return true;
	}

	/**
	 * @param $obj_id
	 * @return array()
	 */
	public function getAllStartedAndFinishedUsers($obj_id): array
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$usr_ids = array();
		$res = $ilDB->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND started = 1 AND ended = 1',
			array('integer'), array($obj_id));

		while($row = $ilDB->fetchAssoc($res))
		{
			$usr_ids[] = $row['usr_id'];
		}
		return $usr_ids;
	}

	public function hasUserStartedAndFinishedVideo(int $usr_id): bool
	{
		$res = $this->db->queryF('SELECT * FROM ' . self::TABLE_NAME_LP . ' WHERE obj_id = %s AND usr_id = %s AND started = 1 AND ended = 1',
			array('integer', 'integer'),array($this->getId(), $usr_id));

		$row = $this->db->fetchAssoc($res);
		if($row == null)
		{
			return false;
		}
		return true;
	}

	public function isAnonymized(): int
	{
		return $this->is_anonymized;
	}

	public function setIsAnonymized(int $is_anonymized): void
	{
		$this->is_anonymized = $is_anonymized;
	}

	public function isRepeat(): int
	{
		return $this->is_repeat;
	}

	public function setIsRepeat(int $is_repeat): void
	{
		$this->is_repeat = $is_repeat;
	}

	public function isChronologic(): int
	{
		return $this->is_chronologic;
	}

	public function setIsChronologic(int $is_chronologic): void
	{
		$this->is_chronologic = $is_chronologic;
	}

	public function isPublic(): int
	{
		return $this->is_public;
	}

	public function setIsPublic(int $is_public): void
	{
		$this->is_public = $is_public;
	}

	public function getSourceId(): string
	{
		return $this->source_id;
	}

	public function setSourceId(string $source_id): void
	{
		$this->source_id = $source_id;
	}
	/**
	 * @param $status
	 */
	public function setOnline($status): void
	{
		$this->is_online = (bool)$status;
	}

	public function isOnline(): bool
	{
		return (bool)$this->is_online;
	}

	public function getTaskActive(): int
	{
		return $this->task_active;
	}

	public function setTaskActive(int $task_active): void
	{
		$this->task_active = $task_active;
	}

	public function getTask(): string
	{
		return $this->task;
	}

	public function setTask(string $task): void
	{
		$this->task = $task;
	}

	/**
	 * @return mixed
	 */
	public function getVideoSourceImportObject()
	{
		return $this->video_source_import_object;
	}

	/**
	 * @param mixed $video_source_import_object
	 */
	public function setVideoSourceImportObject($video_source_import_object): void
	{
		$this->video_source_import_object = $video_source_import_object;
	}

    /**
     * Get all user ids with LP status completed
     * @return array
     */
    public function getLPCompleted(): array
    {
        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_DEACTIVATED])) {
            return [];
        }

        $usrIds = [];
        $simple = new SimpleChoiceQuestion();
        $questionIds = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());

        if ($questionIds === []) {
            $usrIds = $this->getAllStartedAndFinishedUsers($this->getId());
        } else {
            if (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_QUESTIONS])) {
                $usrs_points = $simple->getAllUsersWithCompletelyCorrectAnswers($this->getId());
                foreach ($usrs_points as $usr_id => $points) {
                    if ($points === count($questionIds)) {
                        $usrIds[$usr_id] = $usr_id;
                    }
                }
            } elseif (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_ANSWERED_QUESTIONS])) {
                $usrIds = $simple->getUsersWithAllAnsweredQuestionsMap($this->getId());
            }
        }

        return array_values($usrIds);
    }

    /**
     * Get all user ids with LP status not attempted
     * @return array
     */
    public function getLPNotAttempted(): array
    {
        return [];
    }

    /**
     * Get all user ids with LP status failed
     * @return array
     */
    public function getLPFailed(): array
    {
        if(in_array($this->getLearningProgressMode(), array(self::LP_MODE_DEACTIVATED)))
        {
            return array();
        }

        return array();
    }

    /**
     * Get all user ids with LP status in progress
     * @return array
     */
    public function getLPInProgress(): array
    {
        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_DEACTIVATED])) {
            return [];
        }

        if (in_array(
            $this->getLearningProgressMode(),
            [
                self::LP_MODE_BY_ANSWERED_QUESTIONS,
                self::LP_MODE_BY_QUESTIONS,
            ]
        )) {
            $users = array_unique(array_values(array_map(static fn(array $event) => $event['usr_id'], ilChangeEvent::_lookupReadEvents($this->getId()))));

            $simple = new SimpleChoiceQuestion();
            $users = array_unique(array_merge($users, $simple->getUsersWithAnsweredQuestion($this->getId())));

            $users = array_diff($users, $this->getLPCompleted());
            $users = array_diff($users, $this->getLPFailed());

            return $users;
        }

        return [];
    }

    /**
     * Get current status for given user
     * @param int $a_user_id
     * @return int
     */
    public function getLPStatusForUser(int $a_user_id): int
    {
        $status = ilLPStatus::LP_STATUS_NOT_ATTEMPTED_NUM;

        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_DEACTIVATED])) {
            return $status;
        }
        if (ilChangeEvent::hasAccessed($this->getId(), $a_user_id)) {
            $status = ilLPStatus::LP_STATUS_IN_PROGRESS_NUM;
        }

        $simple = new SimpleChoiceQuestion();

        $questionIds = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());
        $numberOfAnsweredQuestions = $simple->getNumberOfAnsweredQuestions($this->getId(), $a_user_id);

        if ($questionIds === []) {
            if ($this->hasUserStartedAndFinishedVideo($a_user_id)) {
                $status = ilLPStatus::LP_STATUS_COMPLETED_NUM;
            }
        } else {
            if ($numberOfAnsweredQuestions > 0) {
                $status = ilLPStatus::LP_STATUS_IN_PROGRESS_NUM;
            }

            if (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_QUESTIONS])) {
                $totalPointsOfUser = $simple->getAllUsersWithCompletelyCorrectAnswers($this->getId(), $a_user_id);
                if ($totalPointsOfUser === count($questionIds)) {
                    $status = ilLPStatus::LP_STATUS_COMPLETED_NUM;
                }
            } elseif (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_ANSWERED_QUESTIONS])) {
                if (count($questionIds) === $numberOfAnsweredQuestions) {
                    $status = ilLPStatus::LP_STATUS_COMPLETED_NUM;
                }
            }
        }

        return $status;
    }

    public function getPercentageForUser(int $usrId): int
    {
        $percentage = 0;
        $simple = new SimpleChoiceQuestion();

        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_DEACTIVATED])) {
            return $percentage;
        }

        $questionIds = $simple->getInteractiveNotNeutralQuestionIdsByObjId($this->getId());
        if ($questionIds === []) {
            if ($this->hasUserStartedAndFinishedVideo($usrId)) {
                $percentage = 100;
            }

            return $percentage;
        }

        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_QUESTIONS])) {
            $achievedPoints = $simple->getAllUsersWithCompletelyCorrectAnswers($this->getId(), $usrId);
            $percentage = round(($achievedPoints / count($questionIds)) * 100);
        } elseif (in_array($this->getLearningProgressMode(), [self::LP_MODE_BY_ANSWERED_QUESTIONS])) {
            $numberOfAnsweredQuestions = $simple->getNumberOfAnsweredQuestions($this->getId(), $usrId);
            $percentage = round(($numberOfAnsweredQuestions / count($questionIds)) * 100);
        }

        if ($percentage > 100) {
            $percentage = 100;
        }

        return (int) $percentage;
    }

	public function setLearningProgressMode(int $learning_progress_mode): void
	{
		$this->learning_progress_mode = $learning_progress_mode;
	}

	public function getLearningProgressMode(): int
	{
		return $this->learning_progress_mode;
	}

	/**
	 * @return int[]
	 */
	public function getLPValidModes(): array
	{
		return array(
			self::LP_MODE_DEACTIVATED,
			self::LP_MODE_BY_QUESTIONS,
			self::LP_MODE_BY_ANSWERED_QUESTIONS,
		);
	}

	/**
	 * @param $lp_mode
	 */
	public function isCoreLPMode($lp_mode): bool
	{
		return in_array($lp_mode, array_keys(ilLPObjSettings::getClassMap()));
	}

	public function getEnableComment(): int
	{
		return $this->enable_comment;
	}

	public function setEnableComment(int $enable_comment): void
	{
		$this->enable_comment = $enable_comment;
	}

    /**
				 * @param $lp_mode
				 * @throws ilException
				 */
				public function getInternalLabelForLPMode($lp_mode): string
    {
        switch ($lp_mode) {
            case self::LP_MODE_BY_QUESTIONS:
                return 'by_questions';
                break;

            case self::LP_MODE_BY_ANSWERED_QUESTIONS:
                return 'by_all_answered_questions';
                break;
        }

        throw new ilException(sprintf('The LP mode "%s" is unknown!', $lp_mode));
    }
	public function getNoCommentStream(): int
	{
		return $this->no_comment_stream;
	}

	public function setNoCommentStream(int $no_comment_stream): void
	{
		$this->no_comment_stream = $no_comment_stream;
	}

	public function getDefaultMode(): int
	{
		return self::LP_MODE_DEACTIVATED;
	}

	public function updateLearningProgressForActor(): void
	{
		global $DIC;

		ilLPStatusWrapper::_updateStatus(
			$this->getId(),
            $DIC->user()->getId()
		);
	}

    /**
     * @param array $usrIds
     */
    public function refreshLearningProgress(array $usrIds = []): void
    {
        ilLPStatusWrapper::_refreshStatus(
            $this->getId(),
            empty($usrIds) ? null : $usrIds
        );
    }

	public function trackReadEvent(): void
	{
        global $DIC;
        ilChangeEvent::_recordReadEvent($this->getType(), $this->getRefId(), $this->getId(), $DIC->user()->getId());
	}

	public function uploadImage(int $comment_id, \SimpleChoiceQuestion $question, array $a_upload): bool
	{
		if(!$this->id)
		{
			return false;
		}

		$file_extension = pathinfo($a_upload['name'], PATHINFO_EXTENSION);
		$clean_name = $comment_id .'.' . $file_extension;

		$part = 'xvid_' . $this->getId() . '/' . $comment_id . '/images/';
		$path = xvidUtils::ensureFileSavePathExists($part);
		$original = "org_".$this->id."_".$clean_name;

		if(@move_uploaded_file($a_upload["tmp_name"], $path.$original))
		{
			chmod($path.$original, 0770);
			$question->setQuestionImage($path.$original);

			return true;
		}
		return false;
	}

	public function isAutoResumeAfterQuestion(): bool
	{
		return $this->auto_resume_after_question;
	}

	public function setAutoResumeAfterQuestion(bool $auto_resume_after_question): void
	{
		$this->auto_resume_after_question = $auto_resume_after_question;
	}

	public function isFixedModal(): bool
	{
		return $this->fixed_modal;
	}

	public function setFixedModal(bool $fixed_modal): void
	{
		$this->fixed_modal = $fixed_modal;
	}

    public function getShowTocFirst(): int
    {
        return $this->show_toc_first;
    }

    public function setShowTocFirst(int $show_toc_first): void
    {
        $this->show_toc_first = $show_toc_first;
    }

    public function getEnableCommentStream(): int
    {
        return $this->enable_comment_stream;
    }

    public function setEnableCommentStream(int $enable_comment_stream): void
    {
        $this->enable_comment_stream = $enable_comment_stream;
    }

	public function getEnableToolbar(): int
	{
		return $this->enable_toolbar;
	}

	public function setEnableToolbar(int $enable_toolbar): void
	{
		$this->enable_toolbar = $enable_toolbar;
	}
	public function getVideoMode(): int
	{
		return $this->video_mode;
	}

	public function setVideoMode(int $video_mode): void
	{
		$this->video_mode = $video_mode;
	}

	public function getMarkerForStudents(): int
	{
		return $this->marker_for_students;
	}

	public function setMarkerForStudents(int $marker_for_students): void
	{
		$this->marker_for_students = $marker_for_students;
	}

    public function getLayoutWidth(): int
    {
        return $this->layout_width;
    }

    public function getLayoutWidthTransformed(): string
    {
        $value = '2:1';
        switch($this->layout_width){
            case 0:
            case 101:
                $value='1:1';
                break;
            case 1:
            case 102:
                $value='2:1';
                break;
            case 2:
            case 103:
                $value='1:0';
                break;
        }
        return $value;
    }

    public function setLayoutWidth(int $layout_width): void
    {
        $this->layout_width = $layout_width;
    }

    /**
     * @return bool
     */
    public function isMarkerActive(): bool
    {
        return $this->marker_active;
    }


}
