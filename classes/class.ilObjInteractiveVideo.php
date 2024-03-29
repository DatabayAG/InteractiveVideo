<?php
/* Copyright (c) 1998-2015 ILIAS open source, Extended GPL, see docs/LICENSE */

use ILIAS\DI\Exceptions\Exception;

require_once 'Services/Repository/classes/class.ilObjectPlugin.php';
require_once 'Services/Tracking/interfaces/interface.ilLPStatusPlugin.php';
require_once 'Services/Tracking/classes/class.ilLPStatus.php';
require_once dirname(__FILE__) . '/class.ilInteractiveVideoPlugin.php';
ilInteractiveVideoPlugin::getInstance()->includeClass('questions/class.SimpleChoiceQuestion.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.ilObjComment.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('class.xvidUtils.php');
ilInteractiveVideoPlugin::getInstance()->includeClass('../VideoSources/class.ilInteractiveVideoSourceFactory.php');

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

	/** @var int */
	const LP_MODE_DEACTIVATED = 0;

	/** @var int */
	const LP_MODE_BY_QUESTIONS = 99;

    /** @var int */
    const LP_MODE_BY_ANSWERED_QUESTIONS = 100;

    const LAYOUT_SIMILAR = 0;
    const LAYOUT_BIG_VIDEO = 1;
    const LAYOUT_VERY_BIG_VIDEO = 2;

	/** @var int */
	protected $learning_progress_mode = self::LP_MODE_DEACTIVATED;

	/** @var bool */
	protected $is_online = false;

	/** @var int */
	protected $is_anonymized = 0;

	/** @var int */
	protected $is_repeat = 0;

	/** @var int	 */
	protected $is_chronologic = 0;

	/** @var int */
	protected $is_public = 0;

	/** @var string */
	protected $source_id;

	/** @var ilInteractiveVideoSource */
	protected $video_source_object;

	/** @var */
	protected $video_source_import_object;

	/** @var int */
	protected $task_active = 0;

	/** @var string */
	protected $task;

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
	protected $video_mode = ilInteractiveVideoPlugin::CLASSIC_MODE;


	/**
	 * @var SimpleChoiceQuestion[]
	 */
	/** @var SimpleChoiceQuestion[] */
	public $import_simple_choice = array();

	/** @var ilObjComment[] */
	public $import_comment = array();

	/** @var int */
	protected $enable_comment = 1;

	/** @var int */
	protected $enable_toolbar = 1;

    /** @var int */
	protected $show_toc_first = 0;

    /** @var int */
	protected $enable_comment_stream = 1;
	/**
	 * @var int
	 */
	protected $marker_for_students = 0;

	/**
	 * @var int
	 */
	protected $no_comment_stream = 0;

    /**
     * @var int
     */
    protected $layout_width = self::LAYOUT_BIG_VIDEO;

    /**
     * @var bool
     */
    protected $marker_active = false;

	/**
	 * @param $src_id
	 * @return ilInteractiveVideoSource
	 */
	public function getVideoSourceObject($src_id)
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

	protected function doRead()
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

		$this->getVideoSourceObject($row['source_id']);
		$this->setLearningProgressMode($row['lp_mode']);

        $db_settings = new ilSetting(('xvid'));
        if((int) $db_settings->get('xvid_activate_marker') === 1)
        {
            $this->marker_active = true;
        }
		parent::doRead();
	}

	/**
	 * @return string
	 */
	protected function getOldVideoSource()
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
	public function saveSubtitleData($data_short, $data_long)
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
	public function removeSubtitleData($filename)
	{
        /**
         * @var $ilDB ilDBInterface
         */
		global $ilDB;

		$ilDB->manipulateF('DELETE FROM ' . self::TABLE_NAME_SUB_TITLE . ' WHERE obj_id = %s && file_name = %s',
			array('integer', 'text'), array($this->getId(), $filename));
	}

	/**
	 * @return array
	 */
	public function getSubtitleData()
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

    /**
     * @param bool $a_clone_mode
     * @throws ilException
     */
	protected function doCreate($a_clone_mode = false)
	{
		/**
		 * @var $ilLog ilLog
		 * @var $ilDb ilDB
		 */
		global $ilLog, $ilDB;

		if(! $a_clone_mode)
		{
			$post_src_id = ilUtil::stripSlashes($_POST['source_id']);
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
						$source_id		= ilUtil::stripSlashes($_POST['source_id']);
						$is_task		= (int)$_POST['is_task'];
						$task			= ilUtil::stripSlashes($_POST['task']);
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

	/**
	 *
	 */
	protected function doUpdate()
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

	/**
	 *
	 */
	public function beforeDelete()
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

	/**
	 *
	 */
	protected function doDelete()
	{
		parent::doDelete();
	}

	/**
	 * @param ilObjInteractiveVideo $new_obj
	 * @param integer $a_target_id
	 * @param integer $a_copy_id
	 */
	protected function doCloneObject($new_obj, $a_target_id, $a_copy_id = null)
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
                'source_id'           => array('text', $this->getSourceId()),
                'is_task'             => array('integer', $this->getTaskActive()),
                'task'                => array('text', $this->getTask()),
                'lp_mode'             => array('integer', $this->getLearningProgressMode()),
                'video_mode'          => array('integer', $this->getVideoMode()),
                'layout_width'          => array('integer', $this->getLayoutWidth()),
                'marker_for_students' => array('integer', $this->getMarkerForStudents())
			)
		);

		$this->video_source_object->doCloneVideoSource($this->getId(), $new_obj->getId());

		$comment = new ilObjComment();
		$comment->cloneTutorComments($this->getId(), $new_obj->getId());
	}

	/**
	 * @return bool
	 * @throws ilException
	 */
	protected function beforeCreate()
	{
		return true;
	}

	/**
	 * @return bool
	 */
	protected function beforeCloneObject()
	{
		return true;
	}

	/**
	 *
	 */
	protected function initType()
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
     * @param bool $replace_with_text
     * @param bool $empty_string_if_null
     * @param bool $replace_settings_with_text
     * @param bool $strip_tags
     * @return array
     */
	public function getCommentsTableData($replace_with_text = false, $empty_string_if_null = false, $replace_settings_with_text = false, $strip_tags = false, $csv_export = false)
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
            if(!$csv_export) {
                $is_compulsory                            = $row['compulsory_question'] ? '1' : '0';
            }
			if($replace_settings_with_text )
			{
                $is_tutor			= xvidUtils::yesNoString($row['is_tutor']);
                $is_interactive		= xvidUtils::yesNoString($row['is_interactive']);

                if(!$csv_export) {
                    $is_compulsory    = xvidUtils::yesNoString($row['compulsory_question']);
                }
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

            if(!$csv_export) {
                $table_data[$counter]['compulsory']      = $is_compulsory;
            }
            $table_data[$counter]['type']               = $type;
			$table_data[$counter]['marker']             = $row['marker'];
			$table_data[$counter]['is_reply_to']        = $row['is_reply_to'];
            if(!$csv_export) {
                $table_data[$counter]['is_table_of_content'] = $row['is_table_of_content'];
            }
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
     * @return array
     */
	public function getCommentsTableDataByUserId()
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

    /**
     * @return bool
     */
    public function doesTocCommentExists()
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
	 * @return mixed
	 */
	public function getQuestionDataById($comment_id)
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
	 * @return array
	 */
	public function getCommentTextById($comment_id)
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
	 * @param bool $with_user_id
	 * @return array
	 */
	public function getCommentIdsByObjId($obj_id, $with_user_id = true)
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
	public function saveVideoStarted($obj_id, $usr_id)
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
	public function saveVideoFinished($obj_id, $usr_id)
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
	 * @return bool
	 */
	public function doesLearningProgressEntryExists($obj_id, $usr_id)
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
	public function getAllStartedAndFinishedUsers($obj_id)
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

	/**
	 * @param int $usr_id
	 * @return bool
	 */
	public function hasUserStartedAndFinishedVideo($usr_id)
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

	################## SETTER & GETTER ##################

	/**
	 * @return int
	 */
	public function isAnonymized()
	{
		return $this->is_anonymized;
	}

	/**
	 * @param int $is_anonymized
	 */
	public function setIsAnonymized($is_anonymized)
	{
		$this->is_anonymized = $is_anonymized;
	}

	/**
	 * @return int
	 */
	public function isRepeat()
	{
		return $this->is_repeat;
	}

	/**
	 * @param int $is_repeat
	 */
	public function setIsRepeat($is_repeat)
	{
		$this->is_repeat = $is_repeat;
	}

	/**
	 * @return int
	 */
	public function isChronologic()
	{
		return $this->is_chronologic;
	}

	/**
	 * @param int $is_chronologic
	 */
	public function setIsChronologic($is_chronologic)
	{
		$this->is_chronologic = $is_chronologic;
	}

	/**
	 * @return int
	 */
	public function isPublic()
	{
		return $this->is_public;
	}

	/**
	 * @param int $is_public
	 */
	public function setIsPublic($is_public)
	{
		$this->is_public = $is_public;
	}

	/**
	 * @return string
	 */
	public function getSourceId()
	{
		return $this->source_id;
	}

	/**
	 * @param string $source_id
	 */
	public function setSourceId($source_id)
	{
		$this->source_id = $source_id;
	}
	/**
	 * @param $status
	 */
	public function setOnline($status)
	{
		$this->is_online = (bool)$status;
	}

	/**
	 * @return bool
	 */
	public function isOnline()
	{
		return (bool)$this->is_online;
	}

	/**
	 * @return int
	 */
	public function getTaskActive()
	{
		return $this->task_active;
	}

	/**
	 * @param int $task_active
	 */
	public function setTaskActive($task_active)
	{
		$this->task_active = $task_active;
	}

	/**
	 * @return string
	 */
	public function getTask()
	{
		return $this->task;
	}

	/**
	 * @param string $task
	 */
	public function setTask($task)
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
	public function setVideoSourceImportObject($video_source_import_object)
	{
		$this->video_source_import_object = $video_source_import_object;
	}

    /**
     * Get all user ids with LP status completed
     * @return array
     */
    public function getLPCompleted()
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
    public function getLPNotAttempted()
    {
        return [];
    }

    /**
     * Get all user ids with LP status failed
     * @return array
     */
    public function getLPFailed()
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
    public function getLPInProgress()
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
            $users = array_unique(array_values(array_map(static function (array $event) {
                return $event['usr_id'];
            }, ilChangeEvent::_lookupReadEvents($this->getId()))));

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
    public function getLPStatusForUser($a_user_id)
    {
        $status = ilLPStatus::LP_STATUS_NOT_ATTEMPTED_NUM;

        if (in_array($this->getLearningProgressMode(), [self::LP_MODE_DEACTIVATED])) {
            return $status;
        }

        require_once 'Services/Tracking/classes/class.ilChangeEvent.php';
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

    /**
     * @param int $usrId
     * @return int
     */
    public function getPercentageForUser($usrId)
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

	/**
	 * @param int $learning_progress_mode
	 */
	public function setLearningProgressMode($learning_progress_mode)
	{
		$this->learning_progress_mode = $learning_progress_mode;
	}

	/**
	 * @return int
	 */
	public function getLearningProgressMode()
	{
		return $this->learning_progress_mode;
	}

	/**
	 * @return array
	 */
	public function getLPValidModes()
	{
		return array(
			self::LP_MODE_DEACTIVATED,
			self::LP_MODE_BY_QUESTIONS,
			self::LP_MODE_BY_ANSWERED_QUESTIONS,
		);
	}

	/**
	 * @param $lp_mode
	 * @return bool
	 */
	public function isCoreLPMode($lp_mode)
	{
		return in_array($lp_mode, array_keys(ilLPObjSettings::getClassMap()));
	}

	/**
	 * @return int
	 */
	public function getEnableComment()
	{
		return $this->enable_comment;
	}

	/**
	 * @param int $enable_comment
	 */
	public function setEnableComment($enable_comment)
	{
		$this->enable_comment = $enable_comment;
	}

    /**
     * @param $lp_mode
     * @return string
     * @throws ilException
     */
    public function getInternalLabelForLPMode($lp_mode)
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
	/**
	 * @return int
	 */
	public function getNoCommentStream()
	{
		return $this->no_comment_stream;
	}

	/**
	 * @param int $no_comment_stream
	 */
	public function setNoCommentStream($no_comment_stream)
	{
		$this->no_comment_stream = $no_comment_stream;
	}

	/**
	 * @return int
	 */
	public function getDefaultMode()
	{
		return self::LP_MODE_DEACTIVATED;
	}

	public function updateLearningProgressForActor()
	{
		global $DIC;

		require_once "./Services/Tracking/classes/status/class.ilLPStatusEvent.php";
		require_once "./Services/Tracking/classes/class.ilLPStatusWrapper.php";
		require_once "./Services/Tracking/classes/class.ilLearningProgress.php";

		ilLPStatusWrapper::_updateStatus(
			$this->getId(),
            $DIC->user()->getId()
		);
	}

    /**
     * @param array $usrIds
     */
    public function refreshLearningProgress(array $usrIds = [])
    {
        require_once "./Services/Tracking/classes/status/class.ilLPStatusEvent.php";
        require_once "./Services/Tracking/classes/class.ilLPStatusWrapper.php";
        require_once "./Services/Tracking/classes/class.ilLearningProgress.php";

        ilLPStatusWrapper::_refreshStatus(
            $this->getId(),
            empty($usrIds) ? null : $usrIds
        );
    }

	public function trackReadEvent()
	{
        global $DIC;

        require_once 'Services/Tracking/classes/class.ilChangeEvent.php';
        ilChangeEvent::_recordReadEvent($this->getType(), $this->getRefId(), $this->getId(), $DIC->user()->getId());
	}

	/**
	 * @param int $comment_id
	 * @param SimpleChoiceQuestion $question
	 * @param array $a_upload
	 * @return bool
	 */
	public function uploadImage($comment_id, $question, array $a_upload)
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

	/**
	 * @return bool
	 */
	public function isAutoResumeAfterQuestion()
	{
		return $this->auto_resume_after_question;
	}

	/**
	 * @param bool $auto_resume_after_question
	 */
	public function setAutoResumeAfterQuestion($auto_resume_after_question)
	{
		$this->auto_resume_after_question = $auto_resume_after_question;
	}

	/**
	 * @return bool
	 */
	public function isFixedModal()
	{
		return $this->fixed_modal;
	}

	/**
	 * @param bool $fixed_modal
	 */
	public function setFixedModal($fixed_modal)
	{
		$this->fixed_modal = $fixed_modal;
	}

    /**
     * @return int
     */
    public function getShowTocFirst()
    {
        return $this->show_toc_first;
    }

    /**
     * @param int $show_toc_first
     */
    public function setShowTocFirst($show_toc_first)
    {
        $this->show_toc_first = $show_toc_first;
    }

    /**
     * @return int
     */
    public function getEnableCommentStream()
    {
        return $this->enable_comment_stream;
    }

    /**
     * @param int $enable_comment_stream
     */
    public function setEnableCommentStream($enable_comment_stream)
    {
        $this->enable_comment_stream = $enable_comment_stream;
    }

	/**
	 * @return int
	 */
	public function getEnableToolbar()
	{
		return $this->enable_toolbar;
	}

	/**
	 * @param int $enable_toolbar
	 */
	public function setEnableToolbar($enable_toolbar)
	{
		$this->enable_toolbar = $enable_toolbar;
	}
	/**
	 * @return int
	 */
	public function getVideoMode()
	{
		return $this->video_mode;
	}

	/**
	 * @param int $video_mode
	 */
	public function setVideoMode($video_mode)
	{
		$this->video_mode = $video_mode;
	}

	/**
	 * @return int
	 */
	public function getMarkerForStudents()
	{
		return $this->marker_for_students;
	}

	/**
	 * @param int $marker_for_students
	 */
	public function setMarkerForStudents($marker_for_students)
	{
		$this->marker_for_students = $marker_for_students;
	}

    /**
     * @return int
     */
    public function getLayoutWidth()
    {
        return $this->layout_width;
    }

    /**
     * @return string
     */
    public function getLayoutWidthTransformed()
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

    /**
     * @param int $layout_width
     */
    public function setLayoutWidth($layout_width)
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
